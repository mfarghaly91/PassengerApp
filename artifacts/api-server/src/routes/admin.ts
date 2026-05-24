import { Router } from "express";
import { db, usersTable, tripsTable, bookingsTable, busesTable, driversTable, walletTransactionsTable, driverEarningsTable, tripEventsTable, routesTable } from "@workspace/db";
import { eq, sql, and, ilike, desc, asc } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";
import {
  ListAdminUsersQueryParams,
  GetAdminUserParams,
  UpdateAdminUserParams,
  UpdateAdminUserBody,
  ToggleBlockUserParams,
} from "@workspace/api-zod";

const router = Router();

function safeUser(user: Record<string, unknown>) {
  const { password, refreshToken, ...rest } = user;
  return { ...rest, walletBalance: typeof rest.walletBalance === "string" ? parseFloat(rest.walletBalance as string) : rest.walletBalance };
}

// Analytics
router.get("/admin/analytics", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const [
    userCount,
    activeTripCount,
    bookingStats,
    revenueStat,
    activeBuses,
    activeDrivers,
    revenueByDay,
    recentBookings,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(tripsTable).where(eq(tripsTable.status, "active")),
    db.select({
      status: bookingsTable.status,
      count: sql<number>`count(*)::int`,
    }).from(bookingsTable).groupBy(bookingsTable.status),
    db.select({ total: sql<number>`sum(total_price)::float` }).from(bookingsTable).where(eq(bookingsTable.status, "confirmed")),
    db.select({ count: sql<number>`count(*)::int` }).from(busesTable).where(eq(busesTable.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(driversTable).where(eq(driversTable.isActive, true)),
    db.execute(sql`
      SELECT 
        DATE(created_at)::text as date,
        SUM(total_price)::float as revenue,
        COUNT(*)::int as bookings
      FROM bookings
      WHERE status = 'confirmed' AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `),
    db.select({
      id: bookingsTable.id,
      userId: bookingsTable.userId,
      tripId: bookingsTable.tripId,
      seatCount: bookingsTable.seatCount,
      totalPrice: bookingsTable.totalPrice,
      status: bookingsTable.status,
      paymentStatus: bookingsTable.paymentStatus,
      promoCodeId: bookingsTable.promoCodeId,
      createdAt: bookingsTable.createdAt,
    }).from(bookingsTable).orderBy(bookingsTable.createdAt).limit(10),
  ]);

  const bookingsByStatus = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
  for (const s of bookingStats) {
    bookingsByStatus[s.status as keyof typeof bookingsByStatus] = s.count;
  }

  res.json({
    totalUsers: userCount[0].count,
    activeTrips: activeTripCount[0].count,
    totalBookings: Object.values(bookingsByStatus).reduce((a, b) => a + b, 0),
    totalRevenue: revenueStat[0].total ?? 0,
    activeBuses: activeBuses[0].count,
    activeDrivers: activeDrivers[0].count,
    bookingsByStatus,
    revenueByDay: revenueByDay.rows,
    recentBookings: recentBookings.map(b => ({ ...b, totalPrice: parseFloat(b.totalPrice) })),
  });
});

// Users management
router.get("/admin/users", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = ListAdminUsersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { search, role, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) conditions.push(ilike(usersTable.name, `%${search}%`));
  if (role) conditions.push(eq(usersTable.role, role as "user" | "driver" | "admin"));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(usersTable).where(where).limit(limit).offset(offset).orderBy(usersTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(where),
  ]);

  res.json({ data: data.map(u => safeUser(u as Record<string, unknown>)), total: countResult[0].count, page, limit });
});

router.get("/admin/users/:id", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const params = GetAdminUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(safeUser(user as Record<string, unknown>));
});

router.patch("/admin/users/:id", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const params = UpdateAdminUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateAdminUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json(safeUser(updated as Record<string, unknown>));
});

router.patch("/admin/users/:id/toggle-block", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const params = ToggleBlockUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [user] = await db.select({ isBlocked: usersTable.isBlocked }).from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const [updated] = await db.update(usersTable).set({ isBlocked: !user.isBlocked }).where(eq(usersTable.id, params.data.id)).returning();
  res.json(safeUser(updated as Record<string, unknown>));
});

// Driver analytics
router.get("/admin/driver-analytics", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const [
    totalDrivers,
    onlineDrivers,
    busyDrivers,
    suspendedDrivers,
    earningsTotals,
    topEarners,
    recentEarnings,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(driversTable),
    db.select({ count: sql<number>`count(*)::int` }).from(driversTable).where(eq(driversTable.status, "online")),
    db.select({ count: sql<number>`count(*)::int` }).from(driversTable).where(eq(driversTable.status, "busy")),
    db.select({ count: sql<number>`count(*)::int` }).from(driversTable).where(eq(driversTable.status, "suspended")),
    db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)::float`,
      count: sql<number>`count(*)::int`,
    }).from(driverEarningsTable),
    db.execute(sql`
      SELECT d.id, d.name, d.rating,
             COALESCE(SUM(e.amount), 0)::float as total_earnings,
             COUNT(e.id)::int as trip_count
      FROM drivers d
      LEFT JOIN driver_earnings e ON e.driver_id = d.id
      GROUP BY d.id, d.name, d.rating
      ORDER BY total_earnings DESC
      LIMIT 10
    `),
    db.select().from(driverEarningsTable).orderBy(desc(driverEarningsTable.date)).limit(20),
  ]);

  res.json({
    totalDrivers: totalDrivers[0].count,
    onlineDrivers: onlineDrivers[0].count,
    busyDrivers: busyDrivers[0].count,
    suspendedDrivers: suspendedDrivers[0].count,
    totalEarningsPaid: earningsTotals[0].total,
    totalTripsCompleted: earningsTotals[0].count,
    topEarners: topEarners.rows,
    recentEarnings: recentEarnings.map(e => ({ ...e, amount: parseFloat(e.amount as string) })),
  });
});

// Online drivers list (for live tracking)
router.get("/admin/drivers/live", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const drivers = await db.select({
    id: driversTable.id,
    name: driversTable.name,
    phone: driversTable.phone,
    status: driversTable.status,
    isOnline: driversTable.isOnline,
    rating: driversTable.rating,
    currentLatitude: driversTable.currentLatitude,
    currentLongitude: driversTable.currentLongitude,
    currentSpeed: driversTable.currentSpeed,
    currentHeading: driversTable.currentHeading,
    assignedBusId: driversTable.assignedBusId,
    updatedAt: driversTable.updatedAt,
  }).from(driversTable).where(eq(driversTable.isActive, true));

  const activeTrips = await db.select({
    id: tripsTable.id,
    driverId: tripsTable.driverId,
    routeId: tripsTable.routeId,
    status: tripsTable.status,
    departureTime: tripsTable.departureTime,
    arrivalTime: tripsTable.arrivalTime,
  }).from(tripsTable).where(eq(tripsTable.status, "active"));

  const tripsByDriver = new Map(activeTrips.map(t => [t.driverId, t]));

  res.json({
    data: drivers.map(d => ({
      ...d,
      rating: parseFloat(d.rating as string),
      activeTrip: tripsByDriver.get(d.id) ?? null,
    })),
    total: drivers.length,
  });
});

// Shuttle trips by driver (for DriverDetailPanel activity tab)
router.get("/admin/trips", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const driverId = req.query.driverId ? parseInt(req.query.driverId as string) : null;
  const page = Math.max(1, parseInt((req.query.page as string) ?? "1") || 1);
  const limit = Math.min(200, Math.max(1, parseInt((req.query.limit as string) ?? "100") || 100));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (driverId && !isNaN(driverId)) conditions.push(eq(tripsTable.driverId, driverId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db.select({
      id: tripsTable.id,
      driverId: tripsTable.driverId,
      routeId: tripsTable.routeId,
      busId: tripsTable.busId,
      status: tripsTable.status,
      departureTime: tripsTable.departureTime,
      arrivalTime: tripsTable.arrivalTime,
      availableSeats: tripsTable.availableSeats,
      totalSeats: tripsTable.totalSeats,
      price: tripsTable.price,
      createdAt: tripsTable.createdAt,
    }).from(tripsTable).where(where).orderBy(desc(tripsTable.departureTime)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(tripsTable).where(where),
  ]);

  res.json({
    data: rows.map(r => ({ ...r, price: parseFloat(r.price as string) })),
    meta: { total: count, page, limit, pages: Math.ceil(count / limit) },
  });
});

// Full trip timeline for legal/safety reconstruction
router.get("/admin/trips/:id/full-timeline", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) { res.status(400).json({ error: "Invalid trip ID" }); return; }

  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, tripId));
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }

  const [events, driver, bus, route, bookings] = await Promise.all([
    db.select().from(tripEventsTable)
      .where(eq(tripEventsTable.tripId, tripId))
      .orderBy(asc(tripEventsTable.createdAt)),
    db.select({
      id: driversTable.id,
      name: driversTable.name,
      phone: driversTable.phone,
      licenseNumber: driversTable.licenseNumber,
      nationalId: driversTable.nationalId,
      rating: driversTable.rating,
      status: driversTable.status,
    }).from(driversTable).where(eq(driversTable.id, trip.driverId)),
    db.select({
      id: busesTable.id,
      plateNumber: busesTable.plateNumber,
      model: busesTable.model,
      capacity: busesTable.capacity,
    }).from(busesTable).where(eq(busesTable.id, trip.busId)),
    db.select({
      id: routesTable.id,
      name: routesTable.name,
      startLocation: routesTable.startLocation,
      endLocation: routesTable.endLocation,
    }).from(routesTable).where(eq(routesTable.id, trip.routeId)),
    db.select({
      id: bookingsTable.id,
      userId: bookingsTable.userId,
      seatCount: bookingsTable.seatCount,
      totalPrice: bookingsTable.totalPrice,
      status: bookingsTable.status,
      paymentStatus: bookingsTable.paymentStatus,
      createdAt: bookingsTable.createdAt,
    }).from(bookingsTable).where(eq(bookingsTable.tripId, tripId)),
  ]);

  const passengerIds = [...new Set(bookings.map(b => b.userId))];
  const passengers = passengerIds.length > 0
    ? await db.select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
      }).from(usersTable).where(sql`${usersTable.id} = ANY(${passengerIds})`)
    : [];

  const driverRecord = driver[0] ?? null;
  const driverUserId = driverRecord
    ? (await db.select({ userId: driversTable.userId }).from(driversTable).where(eq(driversTable.id, driverRecord.id)))[0]?.userId
    : null;

  const driverUser = driverUserId
    ? (await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, driverUserId)))[0]
    : null;

  res.json({
    trip: {
      ...trip,
      price: parseFloat(trip.price),
    },
    driver: driverRecord
      ? { ...driverRecord, rating: parseFloat(driverRecord.rating as string), user: driverUser }
      : null,
    vehicle: bus[0] ?? null,
    route: route[0] ?? null,
    passengers: passengers,
    bookings: bookings.map(b => ({ ...b, totalPrice: parseFloat(b.totalPrice as string) })),
    timeline: events,
    summary: {
      totalEvents: events.length,
      locationSnapshots: events.filter(e => e.type === "LOCATION_UPDATE").length,
      lifecycleEvents: events.filter(e => e.type !== "LOCATION_UPDATE").length,
    },
  });
});

export default router;
