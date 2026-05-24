import { Router } from "express";
import {
  db,
  ridesTable,
  rideEventsTable,
  ridePricingTable,
  usersTable,
  driversTable,
  walletTransactionsTable,
  driverEarningsTable,
} from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";
import { getIO } from "../socket";
import { z } from "zod";

const router = Router();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcPrice(baseFare: number, perKmRate: number, minimumFare: number, distanceKm: number): number {
  return Math.max(minimumFare, baseFare + distanceKm * perKmRate);
}

function parsePricing(p: Record<string, unknown>) {
  return {
    ...p,
    baseFare: parseFloat(p.baseFare as string),
    perKmRate: parseFloat(p.perKmRate as string),
    perMinuteRate: parseFloat(p.perMinuteRate as string),
    minimumFare: parseFloat(p.minimumFare as string),
  };
}

function parseRide(r: Record<string, unknown>) {
  return {
    ...r,
    distanceKm: r.distanceKm != null ? parseFloat(r.distanceKm as string) : null,
    estimatedPrice: r.estimatedPrice != null ? parseFloat(r.estimatedPrice as string) : null,
    finalPrice: r.finalPrice != null ? parseFloat(r.finalPrice as string) : null,
  };
}

// ─── ADMIN: PRICING ──────────────────────────────────────────────────────────

router.get("/admin/rides/pricing", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(ridePricingTable).orderBy(ridePricingTable.vehicleType);
    res.json({ data: rows.map((r) => parsePricing(r as unknown as Record<string, unknown>)) });
  } catch {
    res.status(500).json({ error: "Failed to fetch pricing" });
  }
});

const UpdatePricingBody = z.object({
  baseFare: z.number().positive().optional(),
  perKmRate: z.number().nonnegative().optional(),
  perMinuteRate: z.number().nonnegative().optional(),
  minimumFare: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

router.patch("/admin/rides/pricing/:vehicleType", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  try {
    const { vehicleType } = req.params;
    if (!["car", "bike"].includes(vehicleType)) {
      res.status(400).json({ error: "vehicleType must be 'car' or 'bike'" });
      return;
    }
    const parsed = UpdatePricingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid data" });
      return;
    }
    const d = parsed.data;
    const updates: Record<string, unknown> = {};
    if (d.baseFare !== undefined) updates.baseFare = d.baseFare.toString();
    if (d.perKmRate !== undefined) updates.perKmRate = d.perKmRate.toString();
    if (d.perMinuteRate !== undefined) updates.perMinuteRate = d.perMinuteRate.toString();
    if (d.minimumFare !== undefined) updates.minimumFare = d.minimumFare.toString();
    if (d.isActive !== undefined) updates.isActive = d.isActive;

    const [updated] = await db
      .update(ridePricingTable)
      .set(updates as Parameters<typeof db.update>[0] extends infer T ? any : never)
      .where(eq(ridePricingTable.vehicleType, vehicleType))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Pricing not found for vehicle type" });
      return;
    }
    res.json({ data: parsePricing(updated as unknown as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: "Failed to update pricing" });
  }
});

// ─── ADMIN: RIDES ─────────────────────────────────────────────────────────────

router.get("/admin/rides", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  try {
    const { vehicleType, status, driverId, passengerId, page = "1", limit = "20" } =
      req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions: ReturnType<typeof eq>[] = [];
    if (vehicleType) conditions.push(eq(ridesTable.vehicleType, vehicleType));
    if (status) conditions.push(eq(ridesTable.status, status));
    if (driverId) conditions.push(eq(ridesTable.driverId, parseInt(driverId)));
    if (passengerId) conditions.push(eq(ridesTable.passengerId, parseInt(passengerId)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [countRows, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(ridesTable).where(where),
      db
        .select({
          ride: ridesTable,
          passenger: { id: usersTable.id, name: usersTable.name, phone: usersTable.phone },
          driver: { id: driversTable.id, name: driversTable.name, phone: driversTable.phone },
        })
        .from(ridesTable)
        .leftJoin(usersTable, eq(ridesTable.passengerId, usersTable.id))
        .leftJoin(driversTable, eq(ridesTable.driverId, driversTable.id))
        .where(where)
        .orderBy(desc(ridesTable.createdAt))
        .limit(limitNum)
        .offset(offset),
    ]);

    const total = countRows[0]?.count ?? 0;
    res.json({
      data: rows.map((r) => ({
        ...parseRide(r.ride as unknown as Record<string, unknown>),
        passenger: r.passenger,
        driver: r.driver,
      })),
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

router.get("/admin/rides/:id", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      res.status(400).json({ error: "Invalid ride ID" });
      return;
    }

    const [row] = await db
      .select({
        ride: ridesTable,
        passenger: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
          phone: usersTable.phone,
        },
        driver: {
          id: driversTable.id,
          name: driversTable.name,
          phone: driversTable.phone,
          rating: driversTable.rating,
        },
      })
      .from(ridesTable)
      .leftJoin(usersTable, eq(ridesTable.passengerId, usersTable.id))
      .leftJoin(driversTable, eq(ridesTable.driverId, driversTable.id))
      .where(eq(ridesTable.id, id));

    if (!row) {
      res.status(404).json({ error: "Ride not found" });
      return;
    }

    const events = await db
      .select()
      .from(rideEventsTable)
      .where(eq(rideEventsTable.rideId, id))
      .orderBy(rideEventsTable.createdAt);

    res.json({
      data: {
        ...parseRide(row.ride as unknown as Record<string, unknown>),
        passenger: row.passenger,
        driver: row.driver,
        events,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch ride" });
  }
});

// ─── PASSENGER: ESTIMATE ─────────────────────────────────────────────────────

const EstimateBody = z.object({
  vehicleType: z.enum(["car", "bike"]),
  pickupLatitude: z.number().min(-90).max(90),
  pickupLongitude: z.number().min(-180).max(180),
  dropoffLatitude: z.number().min(-90).max(90),
  dropoffLongitude: z.number().min(-180).max(180),
});

router.post("/rides/estimate", authenticate, async (req, res): Promise<void> => {
  try {
    const parsed = EstimateBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid data" });
      return;
    }
    const { vehicleType, pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude } = parsed.data;

    const [pricing] = await db
      .select()
      .from(ridePricingTable)
      .where(and(eq(ridePricingTable.vehicleType, vehicleType), eq(ridePricingTable.isActive, true)));

    if (!pricing) {
      res.status(404).json({ error: "Pricing not available for this vehicle type" });
      return;
    }

    const distanceKm = haversineKm(pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude);
    const estimatedDurationMinutes = Math.max(1, Math.round((distanceKm / 30) * 60));
    const estimatedPrice = calcPrice(
      parseFloat(pricing.baseFare),
      parseFloat(pricing.perKmRate),
      parseFloat(pricing.minimumFare),
      distanceKm,
    );

    res.json({
      data: {
        distanceKm: parseFloat(distanceKm.toFixed(3)),
        estimatedDurationMinutes,
        estimatedPrice: parseFloat(estimatedPrice.toFixed(2)),
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to calculate estimate" });
  }
});

// ─── PASSENGER: REQUEST ───────────────────────────────────────────────────────

const RequestRideBody = z.object({
  vehicleType: z.enum(["car", "bike"]),
  pickupLatitude: z.number().min(-90).max(90),
  pickupLongitude: z.number().min(-180).max(180),
  pickupAddress: z.string().min(1),
  dropoffLatitude: z.number().min(-90).max(90),
  dropoffLongitude: z.number().min(-180).max(180),
  dropoffAddress: z.string().min(1),
});

router.post("/rides/request", authenticate, requireRole("user"), async (req, res): Promise<void> => {
  try {
    const parsed = RequestRideBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid data" });
      return;
    }
    const {
      vehicleType,
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      dropoffLatitude,
      dropoffLongitude,
      dropoffAddress,
    } = parsed.data;
    const userId = req.user!.id;

    const [[user], [pricing]] = await Promise.all([
      db
        .select({ walletBalance: usersTable.walletBalance })
        .from(usersTable)
        .where(eq(usersTable.id, userId)),
      db
        .select()
        .from(ridePricingTable)
        .where(and(eq(ridePricingTable.vehicleType, vehicleType), eq(ridePricingTable.isActive, true))),
    ]);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (!pricing) {
      res.status(404).json({ error: "Pricing not available for this vehicle type" });
      return;
    }

    const distanceKm = haversineKm(pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude);
    const estimatedDurationMinutes = Math.max(1, Math.round((distanceKm / 30) * 60));
    const estimatedPrice = calcPrice(
      parseFloat(pricing.baseFare),
      parseFloat(pricing.perKmRate),
      parseFloat(pricing.minimumFare),
      distanceKm,
    );

    if (parseFloat(user.walletBalance as string) < estimatedPrice) {
      res.status(402).json({
        error: "Insufficient wallet balance",
        required: estimatedPrice,
        balance: parseFloat(user.walletBalance as string),
      });
      return;
    }

    const [ride] = await db
      .insert(ridesTable)
      .values({
        passengerId: userId,
        vehicleType,
        pickupLatitude,
        pickupLongitude,
        pickupAddress,
        dropoffLatitude,
        dropoffLongitude,
        dropoffAddress,
        distanceKm: distanceKm.toFixed(3),
        estimatedDurationMinutes,
        estimatedPrice: estimatedPrice.toFixed(2),
        status: "searching",
      })
      .returning();

    await db.insert(rideEventsTable).values({
      rideId: ride.id,
      type: "RIDE_REQUESTED",
      metadata: { passengerId: userId, vehicleType },
    });

    const io = getIO();
    if (io) {
      io.to(`drivers:available:${vehicleType}`).emit("ride:new_request", {
        rideId: ride.id,
        vehicleType,
        pickupAddress,
        dropoffAddress,
        distanceKm: parseFloat(distanceKm.toFixed(3)),
        estimatedPrice: parseFloat(estimatedPrice.toFixed(2)),
      });
    }

    res.status(201).json({ data: parseRide(ride as unknown as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: "Failed to create ride request" });
  }
});

// ─── PASSENGER: MY RIDES ─────────────────────────────────────────────────────

router.get("/rides/my", authenticate, requireRole("user"), async (req, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { vehicleType, status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions: ReturnType<typeof eq>[] = [eq(ridesTable.passengerId, userId)];
    if (vehicleType) conditions.push(eq(ridesTable.vehicleType, vehicleType));
    if (status) conditions.push(eq(ridesTable.status, status));

    const where = and(...conditions);

    const [countRows, rows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(ridesTable).where(where),
      db
        .select()
        .from(ridesTable)
        .where(where)
        .orderBy(desc(ridesTable.createdAt))
        .limit(limitNum)
        .offset(offset),
    ]);

    res.json({
      data: rows.map((r) => parseRide(r as unknown as Record<string, unknown>)),
      meta: { total: countRows[0]?.count ?? 0, page: pageNum, limit: limitNum },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch rides" });
  }
});

// ─── PASSENGER/DRIVER/ADMIN: GET SINGLE RIDE ────────────────────────────────

router.get("/rides/:id", authenticate, async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    const role = req.user!.role;

    const [row] = await db
      .select({
        ride: ridesTable,
        passenger: { id: usersTable.id, name: usersTable.name, phone: usersTable.phone },
        driver: { id: driversTable.id, name: driversTable.name, phone: driversTable.phone },
      })
      .from(ridesTable)
      .leftJoin(usersTable, eq(ridesTable.passengerId, usersTable.id))
      .leftJoin(driversTable, eq(ridesTable.driverId, driversTable.id))
      .where(eq(ridesTable.id, id));

    if (!row) {
      res.status(404).json({ error: "Ride not found" });
      return;
    }

    if (role === "user" && row.ride.passengerId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (role === "driver") {
      const [driver] = await db
        .select({ id: driversTable.id })
        .from(driversTable)
        .where(eq(driversTable.userId, userId));
      if (!driver || row.ride.driverId !== driver.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
    }

    res.json({
      data: {
        ...parseRide(row.ride as unknown as Record<string, unknown>),
        passenger: row.passenger,
        driver: row.driver,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch ride" });
  }
});

// ─── PASSENGER: CANCEL RIDE ──────────────────────────────────────────────────

router.patch("/rides/:id/cancel", authenticate, requireRole("user"), async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;

    const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, id));
    if (!ride) {
      res.status(404).json({ error: "Ride not found" });
      return;
    }
    if (ride.passengerId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (!["requested", "searching", "driver_assigned"].includes(ride.status)) {
      res.status(400).json({ error: `Cannot cancel a ride with status '${ride.status}'` });
      return;
    }

    const [updated] = await db
      .update(ridesTable)
      .set({ status: "cancelled", cancelReason: "passenger_cancelled", cancelledAt: new Date() })
      .where(eq(ridesTable.id, id))
      .returning();

    await db.insert(rideEventsTable).values({
      rideId: id,
      type: "RIDE_CANCELLED",
      metadata: { cancelledBy: "passenger" },
    });

    const io = getIO();
    if (io && ride.driverId) {
      const [driver] = await db
        .select({ userId: driversTable.userId })
        .from(driversTable)
        .where(eq(driversTable.id, ride.driverId));
      if (driver) {
        io.to(`passenger:${driver.userId}`).emit("ride:cancelled", { rideId: id, cancelledBy: "passenger" });
      }
    }

    res.json({ data: parseRide(updated as unknown as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: "Failed to cancel ride" });
  }
});

// ─── DRIVER: AVAILABLE RIDES ─────────────────────────────────────────────────

router.get("/driver/rides/available", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  try {
    const userId = req.user!.id;
    const [driver] = await db
      .select({ id: driversTable.id, isOnline: driversTable.isOnline, vehicleType: driversTable.vehicleType })
      .from(driversTable)
      .where(eq(driversTable.userId, userId));

    if (!driver) {
      res.status(404).json({ error: "Driver profile not found" });
      return;
    }
    if (!driver.isOnline) {
      res.status(403).json({ error: "Driver must be online to view available rides" });
      return;
    }

    const conditions: ReturnType<typeof eq>[] = [eq(ridesTable.status, "searching")];
    if (driver.vehicleType) {
      conditions.push(eq(ridesTable.vehicleType, driver.vehicleType));
    }

    const rides = await db
      .select()
      .from(ridesTable)
      .where(and(...conditions))
      .orderBy(desc(ridesTable.requestedAt));

    res.json({ data: rides.map((r) => parseRide(r as unknown as Record<string, unknown>)) });
  } catch {
    res.status(500).json({ error: "Failed to fetch available rides" });
  }
});

// ─── DRIVER: ACCEPT RIDE ──────────────────────────────────────────────────────

router.patch("/driver/rides/:id/accept", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  try {
    const rideId = parseInt(req.params.id);
    const userId = req.user!.id;

    const [driver] = await db
      .select({ id: driversTable.id, name: driversTable.name })
      .from(driversTable)
      .where(eq(driversTable.userId, userId));
    if (!driver) {
      res.status(404).json({ error: "Driver profile not found" });
      return;
    }

    const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, rideId));
    if (!ride) {
      res.status(404).json({ error: "Ride not found" });
      return;
    }
    if (ride.status !== "searching") {
      res.status(409).json({ error: `Ride is no longer available (status: ${ride.status})` });
      return;
    }

    const [updated] = await db
      .update(ridesTable)
      .set({ status: "driver_assigned", driverId: driver.id, driverAssignedAt: new Date() })
      .where(and(eq(ridesTable.id, rideId), eq(ridesTable.status, "searching")))
      .returning();

    if (!updated) {
      res.status(409).json({ error: "Ride was just taken by another driver" });
      return;
    }

    await Promise.all([
      db.update(driversTable).set({ status: "busy" }).where(eq(driversTable.id, driver.id)),
      db.insert(rideEventsTable).values({
        rideId,
        type: "DRIVER_ASSIGNED",
        metadata: { driverId: driver.id, driverName: driver.name },
      }),
    ]);

    const io = getIO();
    if (io) {
      io.to(`passenger:${ride.passengerId}`).emit("ride:driver_assigned", {
        rideId,
        driverId: driver.id,
        driverName: driver.name,
      });
    }

    res.json({ data: parseRide(updated as unknown as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: "Failed to accept ride" });
  }
});

// ─── DRIVER: ARRIVED ─────────────────────────────────────────────────────────

router.patch("/driver/rides/:id/arrived", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  try {
    const rideId = parseInt(req.params.id);
    const userId = req.user!.id;

    const [driver] = await db
      .select({ id: driversTable.id })
      .from(driversTable)
      .where(eq(driversTable.userId, userId));
    if (!driver) {
      res.status(404).json({ error: "Driver profile not found" });
      return;
    }

    const [ride] = await db
      .select()
      .from(ridesTable)
      .where(and(eq(ridesTable.id, rideId), eq(ridesTable.driverId, driver.id)));
    if (!ride) {
      res.status(404).json({ error: "Ride not found or not assigned to you" });
      return;
    }
    if (ride.status !== "driver_assigned") {
      res.status(400).json({ error: `Cannot mark arrived for ride with status '${ride.status}'` });
      return;
    }

    const [updated] = await db
      .update(ridesTable)
      .set({ status: "driver_arrived", driverArrivedAt: new Date() })
      .where(eq(ridesTable.id, rideId))
      .returning();

    await db.insert(rideEventsTable).values({
      rideId,
      type: "DRIVER_ARRIVED",
      metadata: { driverId: driver.id },
    });

    const io = getIO();
    if (io) {
      io.to(`passenger:${ride.passengerId}`).emit("ride:driver_arrived", { rideId, driverId: driver.id });
    }

    res.json({ data: parseRide(updated as unknown as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: "Failed to update ride" });
  }
});

// ─── DRIVER: START RIDE ──────────────────────────────────────────────────────

router.patch("/driver/rides/:id/start", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  try {
    const rideId = parseInt(req.params.id);
    const userId = req.user!.id;

    const [driver] = await db
      .select({ id: driversTable.id })
      .from(driversTable)
      .where(eq(driversTable.userId, userId));
    if (!driver) {
      res.status(404).json({ error: "Driver profile not found" });
      return;
    }

    const [ride] = await db
      .select()
      .from(ridesTable)
      .where(and(eq(ridesTable.id, rideId), eq(ridesTable.driverId, driver.id)));
    if (!ride) {
      res.status(404).json({ error: "Ride not found or not assigned to you" });
      return;
    }
    if (ride.status !== "driver_arrived") {
      res.status(400).json({ error: `Cannot start ride with status '${ride.status}'` });
      return;
    }

    const [updated] = await db
      .update(ridesTable)
      .set({ status: "active", startedAt: new Date() })
      .where(eq(ridesTable.id, rideId))
      .returning();

    await db.insert(rideEventsTable).values({
      rideId,
      type: "RIDE_STARTED",
      metadata: { driverId: driver.id },
    });

    const io = getIO();
    if (io) {
      io.to(`passenger:${ride.passengerId}`).emit("ride:started", { rideId, driverId: driver.id });
    }

    res.json({ data: parseRide(updated as unknown as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: "Failed to start ride" });
  }
});

// ─── DRIVER: COMPLETE RIDE ───────────────────────────────────────────────────

router.patch("/driver/rides/:id/complete", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  try {
    const rideId = parseInt(req.params.id);
    const userId = req.user!.id;

    const [driver] = await db
      .select({ id: driversTable.id })
      .from(driversTable)
      .where(eq(driversTable.userId, userId));
    if (!driver) {
      res.status(404).json({ error: "Driver profile not found" });
      return;
    }

    const [ride] = await db
      .select()
      .from(ridesTable)
      .where(and(eq(ridesTable.id, rideId), eq(ridesTable.driverId, driver.id)));
    if (!ride) {
      res.status(404).json({ error: "Ride not found or not assigned to you" });
      return;
    }
    if (ride.status !== "active") {
      res.status(400).json({ error: `Cannot complete ride with status '${ride.status}'` });
      return;
    }

    const [pricing] = await db
      .select()
      .from(ridePricingTable)
      .where(eq(ridePricingTable.vehicleType, ride.vehicleType));

    const distanceKm = ride.distanceKm ? parseFloat(ride.distanceKm as string) : 0;
    const finalPrice = pricing
      ? calcPrice(
          parseFloat(pricing.baseFare),
          parseFloat(pricing.perKmRate),
          parseFloat(pricing.minimumFare),
          distanceKm,
        )
      : ride.estimatedPrice
        ? parseFloat(ride.estimatedPrice as string)
        : 0;

    const driverCut = parseFloat((finalPrice * 0.15).toFixed(2));

    await db.transaction(async (tx) => {
      await tx
        .update(ridesTable)
        .set({ status: "completed", completedAt: new Date(), finalPrice: finalPrice.toFixed(2) })
        .where(eq(ridesTable.id, rideId));

      await tx
        .update(usersTable)
        .set({ walletBalance: sql`wallet_balance - ${finalPrice}` })
        .where(eq(usersTable.id, ride.passengerId));

      await tx.insert(walletTransactionsTable).values({
        userId: ride.passengerId,
        amount: finalPrice.toFixed(2),
        type: "payment",
        description: `Ride #${rideId} (${ride.vehicleType}) — ${distanceKm.toFixed(1)} km`,
      });

      await tx.insert(driverEarningsTable).values({
        driverId: driver.id,
        amount: driverCut.toFixed(2),
        status: "confirmed",
      });

      await tx.update(driversTable).set({ status: "online" }).where(eq(driversTable.id, driver.id));
    });

    await db.insert(rideEventsTable).values({
      rideId,
      type: "RIDE_COMPLETED",
      metadata: { driverId: driver.id, finalPrice },
    });

    const io = getIO();
    if (io) {
      io.to(`passenger:${ride.passengerId}`).emit("ride:completed", { rideId, finalPrice });
    }

    res.json({ data: { rideId, finalPrice, driverCut } });
  } catch {
    res.status(500).json({ error: "Failed to complete ride" });
  }
});

// ─── DRIVER: CANCEL RIDE ─────────────────────────────────────────────────────

router.patch("/driver/rides/:id/cancel", authenticate, requireRole("driver"), async (req, res): Promise<void> => {
  try {
    const rideId = parseInt(req.params.id);
    const userId = req.user!.id;

    const [driver] = await db
      .select({ id: driversTable.id })
      .from(driversTable)
      .where(eq(driversTable.userId, userId));
    if (!driver) {
      res.status(404).json({ error: "Driver profile not found" });
      return;
    }

    const [ride] = await db
      .select()
      .from(ridesTable)
      .where(and(eq(ridesTable.id, rideId), eq(ridesTable.driverId, driver.id)));
    if (!ride) {
      res.status(404).json({ error: "Ride not found or not assigned to you" });
      return;
    }
    if (!["driver_assigned", "driver_arrived"].includes(ride.status)) {
      res.status(400).json({ error: `Cannot cancel ride with status '${ride.status}'` });
      return;
    }

    const [updated] = await db
      .update(ridesTable)
      .set({ status: "cancelled", cancelReason: "driver_cancelled", cancelledAt: new Date() })
      .where(eq(ridesTable.id, rideId))
      .returning();

    await Promise.all([
      db.update(driversTable).set({ status: "online" }).where(eq(driversTable.id, driver.id)),
      db.insert(rideEventsTable).values({
        rideId,
        type: "RIDE_CANCELLED",
        metadata: { cancelledBy: "driver", driverId: driver.id },
      }),
    ]);

    const io = getIO();
    if (io) {
      io.to(`passenger:${ride.passengerId}`).emit("ride:cancelled", { rideId, cancelledBy: "driver" });
    }

    res.json({ data: parseRide(updated as unknown as Record<string, unknown>) });
  } catch {
    res.status(500).json({ error: "Failed to cancel ride" });
  }
});

export default router;
