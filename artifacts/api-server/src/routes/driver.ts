import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, driversTable, tripsTable, bookingsTable, driverEarningsTable, tripStationProgressTable, stationsTable, notificationsTable, tripEventsTable } from "@workspace/db";
import { eq, and, or, desc, sql, gte, lte } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import { z } from "zod";

const router = Router();

function fmtDriver(d: Record<string, unknown>) {
  return { ...d, rating: typeof d.rating === "string" ? parseFloat(d.rating as string) : d.rating };
}
function fmtEarning(e: Record<string, unknown>) {
  return { ...e, amount: typeof e.amount === "string" ? parseFloat(e.amount as string) : e.amount };
}
function fmtTrip(t: Record<string, unknown>) {
  return { ...t, price: typeof t.price === "string" ? parseFloat(t.price as string) : t.price };
}
function fmtBooking(b: Record<string, unknown>) {
  return { ...b, totalPrice: typeof b.totalPrice === "string" ? parseFloat(b.totalPrice as string) : b.totalPrice };
}

const DriverLoginBody = z.object({
  credential: z.string().min(1),
  password: z.string().min(1),
});

const DriverRegisterBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8),
  licenseNumber: z.string().optional(),
  nationalId: z.string().optional(),
});

const UpdateStatusBody = z.object({
  status: z.enum(["offline", "online", "busy", "suspended"]).optional(),
});

const LocationBody = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().optional(),
  heading: z.number().optional(),
  tripId: z.number().optional(),
});

const CancelTripBody = z.object({
  reason: z.string().min(1),
});

// ─── DRIVER AUTH ─────────────────────────────────────────────────────────────

router.post("/driver/auth/register", async (req, res): Promise<void> => {
  try {
    const parsed = DriverRegisterBody.safeParse(req.body);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      const field = first?.path[0] ? `${String(first.path[0])}: ` : "";
      res.status(400).json({ error: `${field}${first?.message ?? "Invalid data"}` });
      return;
    }

    const { name, email, phone, password, licenseNumber, nationalId } = parsed.data;

    // Check email uniqueness
    const [existingEmail] = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (existingEmail) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    // Check phone uniqueness
    const [existingPhone] = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.phone, phone));

    if (existingPhone) {
      res.status(409).json({ error: "An account with this phone number already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db.insert(usersTable).values({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "driver",
    }).returning();

    const [driver] = await db.insert(driversTable).values({
      userId: user.id,
      name,
      phone,
      licenseNumber: licenseNumber ?? null,
      nationalId: nationalId ?? null,
    }).returning();

    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));

    const { password: _, refreshToken: __, ...safeUser } = user;
    res.status(201).json({
      accessToken,
      refreshToken,
      user: { ...safeUser, walletBalance: parseFloat(safeUser.walletBalance) },
      driver: fmtDriver(driver as Record<string, unknown>),
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/driver/auth/login", async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const parsed = DriverLoginBody.safeParse({ ...body, credential: body.credential ?? body.email });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { credential, password } = parsed.data;
  const [user] = await db.select()
    .from(usersTable)
    .where(
      sql`(${usersTable.email} = ${credential} OR ${usersTable.phone} = ${credential}) AND ${usersTable.role} = 'driver'`
    );

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Invalid driver credentials" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: "Account is suspended" });
    return;
  }

  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, user.id));
  if (!driver) {
    res.status(403).json({ error: "No driver profile found for this account" });
    return;
  }

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));

  const { password: _, refreshToken: __, ...safeUser } = user;
  res.json({
    accessToken,
    refreshToken,
    user: { ...safeUser, walletBalance: parseFloat(safeUser.walletBalance) },
    driver: fmtDriver(driver as Record<string, unknown>),
  });
});

router.post("/driver/auth/logout", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  await db.update(usersTable).set({ refreshToken: null }).where(eq(usersTable.id, req.user!.id));
  await db.update(driversTable).set({ isOnline: false, status: "offline" }).where(eq(driversTable.userId, req.user!.id));
  res.json({ ok: true });
});

router.get("/driver/me", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }
  res.json(fmtDriver(driver as Record<string, unknown>));
});

// ─── DRIVER STATUS ────────────────────────────────────────────────────────────

router.patch("/driver/status/online", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select({ id: driversTable.id, status: driversTable.status })
    .from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }
  if (driver.status === "suspended") { res.status(403).json({ error: "Account suspended" }); return; }

  const [updated] = await db.update(driversTable)
    .set({ isOnline: true, status: "online" })
    .where(eq(driversTable.id, driver.id))
    .returning();
  res.json(fmtDriver(updated as Record<string, unknown>));
});

router.patch("/driver/status/offline", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select({ id: driversTable.id })
    .from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [updated] = await db.update(driversTable)
    .set({ isOnline: false, status: "offline" })
    .where(eq(driversTable.id, driver.id))
    .returning();
  res.json(fmtDriver(updated as Record<string, unknown>));
});

// ─── DRIVER LOCATION (REST fallback) ─────────────────────────────────────────

router.patch("/driver/location", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const parsed = LocationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [updated] = await db.update(driversTable).set({
    currentLatitude: parsed.data.latitude,
    currentLongitude: parsed.data.longitude,
    currentSpeed: parsed.data.speed,
    currentHeading: parsed.data.heading,
  }).where(eq(driversTable.id, driver.id)).returning();

  if (parsed.data.tripId) {
    const tripId = parsed.data.tripId;
    const cutoff = new Date(Date.now() - 10_000);
    const [recent] = await db.select({ id: tripEventsTable.id })
      .from(tripEventsTable)
      .where(
        and(
          eq(tripEventsTable.tripId, tripId),
          eq(tripEventsTable.type, "LOCATION_UPDATE"),
          sql`${tripEventsTable.createdAt} > ${cutoff}`
        )
      )
      .limit(1);

    if (!recent) {
      await db.insert(tripEventsTable).values({
        tripId,
        type: "LOCATION_UPDATE",
        metadata: {
          lat: parsed.data.latitude,
          lng: parsed.data.longitude,
          speed: parsed.data.speed ?? null,
        },
      });
    }
  }

  res.json(fmtDriver(updated as Record<string, unknown>));
});

// ─── DRIVER TRIPS ─────────────────────────────────────────────────────────────

router.get("/driver/trips", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const status = req.query.status as string | undefined;
  const conditions = [eq(tripsTable.driverId, driver.id)];
  if (status) {
    conditions.push(eq(tripsTable.status, status as "scheduled" | "active" | "completed" | "cancelled" | "waiting_driver" | "driver_assigned" | "boarding"));
  }

  const trips = await db.select().from(tripsTable)
    .where(and(...conditions))
    .orderBy(desc(tripsTable.departureTime))
    .limit(50);

  res.json({ data: trips.map(t => fmtTrip(t as Record<string, unknown>)), total: trips.length });
});

router.get("/driver/trips/:id", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) { res.status(400).json({ error: "Invalid trip ID" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select().from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!trip) { res.status(404).json({ error: "Trip not found or not assigned to you" }); return; }

  const bookings = await db.select().from(bookingsTable).where(eq(bookingsTable.tripId, tripId));

  res.json({ ...fmtTrip(trip as Record<string, unknown>), bookings: bookings.map(b => fmtBooking(b as Record<string, unknown>)) });
});

router.patch("/driver/trips/:id/accept", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) { res.status(400).json({ error: "Invalid trip ID" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select().from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
  if (!["scheduled", "waiting_driver"].includes(trip.status)) {
    res.status(400).json({ error: `Cannot accept trip in status: ${trip.status}` });
    return;
  }

  const now = new Date();
  const [updated] = await db.update(tripsTable).set({ status: "driver_assigned", acceptedAt: now })
    .where(eq(tripsTable.id, tripId)).returning();

  await db.insert(tripEventsTable).values({
    tripId,
    type: "DRIVER_ACCEPTED",
    metadata: { driverId: driver.id },
  });

  res.json(fmtTrip(updated as Record<string, unknown>));
});

router.patch("/driver/trips/:id/reject", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) { res.status(400).json({ error: "Invalid trip ID" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select().from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
  if (!["scheduled", "waiting_driver", "driver_assigned"].includes(trip.status)) {
    res.status(400).json({ error: `Cannot reject trip in status: ${trip.status}` });
    return;
  }

  const [updated] = await db.update(tripsTable).set({ status: "waiting_driver", driverId: driver.id })
    .where(eq(tripsTable.id, tripId)).returning();
  res.json(fmtTrip(updated as Record<string, unknown>));
});

router.patch("/driver/trips/:id/start", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) { res.status(400).json({ error: "Invalid trip ID" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select().from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(driversTable.id, driver.id)));
  const [assignedTrip] = await db.select().from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!assignedTrip) { res.status(404).json({ error: "Trip not assigned to you" }); return; }
  if (!["driver_assigned", "boarding"].includes(assignedTrip.status)) {
    res.status(400).json({ error: `Cannot start trip in status: ${assignedTrip.status}` });
    return;
  }

  await db.update(driversTable).set({ status: "busy" }).where(eq(driversTable.id, driver.id));
  const startNow = new Date();
  const [updated] = await db.update(tripsTable).set({ status: "active", startedAt: startNow })
    .where(eq(tripsTable.id, tripId)).returning();

  await db.insert(tripEventsTable).values({
    tripId,
    type: "TRIP_STARTED",
    metadata: { driverId: driver.id },
  });

  const stations = await db.select().from(stationsTable)
    .where(eq(stationsTable.routeId, updated.routeId))
    .orderBy(stationsTable.order);

  await db.insert(tripStationProgressTable).values(
    stations.map(s => ({ tripId, stationId: s.id, status: "pending" as const }))
  ).onConflictDoNothing();

  res.json(fmtTrip(updated as Record<string, unknown>));
});

router.patch("/driver/trips/:id/complete", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) { res.status(400).json({ error: "Invalid trip ID" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select().from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!trip) { res.status(404).json({ error: "Trip not assigned to you" }); return; }
  if (trip.status !== "active") {
    res.status(400).json({ error: `Cannot complete trip in status: ${trip.status}` });
    return;
  }

  const completeNow = new Date();
  const [updated] = await db.update(tripsTable).set({ status: "completed", completedAt: completeNow })
    .where(eq(tripsTable.id, tripId)).returning();

  await db.insert(tripEventsTable).values({
    tripId,
    type: "TRIP_COMPLETED",
    metadata: { driverId: driver.id },
  });

  await db.update(driversTable).set({ status: "online" }).where(eq(driversTable.id, driver.id));

  await db.update(bookingsTable)
    .set({ status: "completed" })
    .where(and(eq(bookingsTable.tripId, tripId), eq(bookingsTable.status, "confirmed")));

  const tripPrice = parseFloat(updated.price);
  const driverCut = parseFloat((tripPrice * 0.15).toFixed(2));
  await db.insert(driverEarningsTable).values({
    driverId: driver.id,
    tripId,
    amount: String(driverCut),
    status: "confirmed",
  });

  res.json(fmtTrip(updated as Record<string, unknown>));
});

router.patch("/driver/trips/:id/cancel", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) { res.status(400).json({ error: "Invalid trip ID" }); return; }

  const parsed = CancelTripBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Cancellation reason is required" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select().from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!trip) { res.status(404).json({ error: "Trip not assigned to you" }); return; }
  if (["completed", "cancelled"].includes(trip.status)) {
    res.status(400).json({ error: `Cannot cancel trip in status: ${trip.status}` });
    return;
  }

  const cancelNow = new Date();
  const [updated] = await db.update(tripsTable)
    .set({ status: "cancelled", cancelReason: parsed.data.reason, cancelledAt: cancelNow })
    .where(eq(tripsTable.id, tripId)).returning();

  await db.insert(tripEventsTable).values({
    tripId,
    type: "TRIP_CANCELLED",
    metadata: { driverId: driver.id, reason: parsed.data.reason },
  });

  await db.update(driversTable).set({ status: "online" }).where(eq(driversTable.id, driver.id));

  res.json(fmtTrip(updated as Record<string, unknown>));
});

// ─── TRIP STATIONS ────────────────────────────────────────────────────────────

router.get("/driver/trips/:id/stations", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  if (isNaN(tripId)) { res.status(400).json({ error: "Invalid trip ID" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select({ id: tripsTable.id, routeId: tripsTable.routeId })
    .from(tripsTable).where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }

  const stations = await db.select().from(stationsTable)
    .where(eq(stationsTable.routeId, trip.routeId))
    .orderBy(stationsTable.order);

  const progress = await db.select().from(tripStationProgressTable)
    .where(eq(tripStationProgressTable.tripId, tripId));

  const progressMap = new Map(progress.map(p => [p.stationId, p]));

  const bookingCountResult = await db.select({ count: sql<number>`count(*)::int` })
    .from(bookingsTable).where(eq(bookingsTable.tripId, tripId));
  const totalBookings = bookingCountResult[0]?.count ?? 0;

  const result = stations.map(s => ({
    ...s,
    progress: progressMap.get(s.id) ?? null,
    status: progressMap.get(s.id)?.status ?? "pending",
    expectedPassengers: Math.ceil(totalBookings / stations.length),
  }));

  res.json({ data: result });
});

router.patch("/driver/trips/:id/stations/:stationId/arrived", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  const stationId = parseInt(req.params.stationId);
  if (isNaN(tripId) || isNaN(stationId)) { res.status(400).json({ error: "Invalid IDs" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select({ id: tripsTable.id }).from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }

  await db.insert(tripStationProgressTable)
    .values({ tripId, stationId, status: "arrived", arrivedAt: new Date() })
    .onConflictDoUpdate({
      target: [tripStationProgressTable.tripId, tripStationProgressTable.stationId],
      set: { status: "arrived", arrivedAt: new Date() },
    });

  const [updated] = await db.select().from(tripStationProgressTable)
    .where(and(eq(tripStationProgressTable.tripId, tripId), eq(tripStationProgressTable.stationId, stationId)));

  res.json(updated);
});

router.patch("/driver/trips/:id/stations/:stationId/completed", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const tripId = parseInt(req.params.id);
  const stationId = parseInt(req.params.stationId);
  if (isNaN(tripId) || isNaN(stationId)) { res.status(400).json({ error: "Invalid IDs" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [trip] = await db.select({ id: tripsTable.id }).from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.driverId, driver.id)));
  if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }

  await db.insert(tripStationProgressTable)
    .values({ tripId, stationId, status: "completed", arrivedAt: new Date(), completedAt: new Date() })
    .onConflictDoUpdate({
      target: [tripStationProgressTable.tripId, tripStationProgressTable.stationId],
      set: { status: "completed", completedAt: new Date() },
    });

  const [updated] = await db.select().from(tripStationProgressTable)
    .where(and(eq(tripStationProgressTable.tripId, tripId), eq(tripStationProgressTable.stationId, stationId)));

  res.json(updated);
});

// ─── PASSENGER BOARDING ───────────────────────────────────────────────────────

router.patch("/driver/bookings/:id/board", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) { res.status(400).json({ error: "Invalid booking ID" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }

  const [trip] = await db.select({ id: tripsTable.id, driverId: tripsTable.driverId })
    .from(tripsTable).where(eq(tripsTable.id, booking.tripId));
  if (!trip || trip.driverId !== driver.id) {
    res.status(403).json({ error: "Not your trip" });
    return;
  }

  if (!["confirmed", "pending"].includes(booking.status)) {
    res.status(400).json({ error: `Cannot board passenger in status: ${booking.status}` });
    return;
  }

  const [updated] = await db.update(bookingsTable).set({ status: "boarded" })
    .where(eq(bookingsTable.id, bookingId)).returning();
  res.json(fmtBooking(updated as Record<string, unknown>));
});

router.patch("/driver/bookings/:id/absent", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const bookingId = parseInt(req.params.id);
  if (isNaN(bookingId)) { res.status(400).json({ error: "Invalid booking ID" }); return; }

  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }

  const [trip] = await db.select({ id: tripsTable.id, driverId: tripsTable.driverId })
    .from(tripsTable).where(eq(tripsTable.id, booking.tripId));
  if (!trip || trip.driverId !== driver.id) {
    res.status(403).json({ error: "Not your trip" });
    return;
  }

  const [updated] = await db.update(bookingsTable).set({ status: "absent" })
    .where(eq(bookingsTable.id, bookingId)).returning();
  res.json(fmtBooking(updated as Record<string, unknown>));
});

// ─── DRIVER EARNINGS ──────────────────────────────────────────────────────────

router.get("/driver/earnings", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const [totals] = await db.select({
    totalEarned: sql<string>`COALESCE(SUM(amount), 0)`,
    tripCount: sql<number>`count(*)::int`,
  }).from(driverEarningsTable).where(eq(driverEarningsTable.driverId, driver.id));

  const recent = await db.select().from(driverEarningsTable)
    .where(eq(driverEarningsTable.driverId, driver.id))
    .orderBy(desc(driverEarningsTable.date))
    .limit(10);

  res.json({
    totalEarned: parseFloat(totals?.totalEarned ?? "0"),
    tripCount: totals?.tripCount ?? 0,
    recent: recent.map(e => fmtEarning(e as Record<string, unknown>)),
  });
});

router.get("/driver/earnings/history", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const [driver] = await db.select({ id: driversTable.id }).from(driversTable).where(eq(driversTable.userId, req.user!.id));
  if (!driver) { res.status(404).json({ error: "Driver profile not found" }); return; }

  const page = parseInt(req.query.page as string ?? "1");
  const limit = parseInt(req.query.limit as string ?? "20");
  const offset = (page - 1) * limit;

  const [data, countResult] = await Promise.all([
    db.select().from(driverEarningsTable)
      .where(eq(driverEarningsTable.driverId, driver.id))
      .orderBy(desc(driverEarningsTable.date))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` })
      .from(driverEarningsTable)
      .where(eq(driverEarningsTable.driverId, driver.id)),
  ]);

  res.json({
    data: data.map(e => fmtEarning(e as Record<string, unknown>)),
    total: countResult[0].count,
    page,
    limit,
  });
});

// ─── DRIVER NOTIFICATIONS ─────────────────────────────────────────────────────

router.get("/driver/notifications", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json({ data: notifications });
});

export default router;
