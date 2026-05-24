import { Router } from "express";
import { db, bookingsTable, tripsTable, usersTable, promoCodesTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";
import {
  ListBookingsQueryParams,
  GetBookingParams,
  CreateBookingBody,
  CancelBookingParams,
} from "@workspace/api-zod";

const router = Router();

function formatBooking(b: Record<string, unknown>) {
  return {
    ...b,
    totalPrice: typeof b.totalPrice === "string" ? parseFloat(b.totalPrice as string) : b.totalPrice,
  };
}

router.get("/bookings", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = ListBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { userId, tripId, status, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userId) conditions.push(eq(bookingsTable.userId, userId));
  if (tripId) conditions.push(eq(bookingsTable.tripId, tripId));
  if (status) conditions.push(eq(bookingsTable.status, status as "pending" | "confirmed" | "cancelled" | "completed"));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
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
      user: {
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        role: usersTable.role,
        walletBalance: usersTable.walletBalance,
        isVerified: usersTable.isVerified,
        isBlocked: usersTable.isBlocked,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      },
    })
      .from(bookingsTable)
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(bookingsTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(bookingsTable).where(where),
  ]);

  res.json({ data: data.map(b => formatBooking(b as Record<string, unknown>)), total: countResult[0].count, page, limit });
});

router.post("/bookings", authenticate, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { tripId, seatCount, promoCode: promoCodeStr } = parsed.data;

  // Use a transaction to prevent race conditions
  const result = await db.transaction(async (tx) => {
    const [trip] = await tx.select().from(tripsTable).where(eq(tripsTable.id, tripId));
    if (!trip) return { error: "Trip not found", status: 404 };
    if (trip.status !== "scheduled" && trip.status !== "active") return { error: "Trip is not available for booking", status: 400 };
    if (trip.availableSeats < seatCount) return { error: "Not enough available seats", status: 400 };

    let totalPrice = parseFloat(trip.price) * seatCount;
    let promoCodeId: number | undefined;

    if (promoCodeStr) {
      const [promo] = await tx.select().from(promoCodesTable).where(eq(promoCodesTable.code, promoCodeStr));
      if (promo && promo.isActive) {
        if (!promo.expiryDate || new Date(promo.expiryDate) > new Date()) {
          if (!promo.maxUsage || promo.usedCount < promo.maxUsage) {
            if (promo.discountType === "percentage") {
              totalPrice = totalPrice * (1 - parseFloat(promo.discountValue) / 100);
            } else {
              totalPrice = Math.max(0, totalPrice - parseFloat(promo.discountValue));
            }
            promoCodeId = promo.id;
            await tx.update(promoCodesTable).set({ usedCount: promo.usedCount + 1 }).where(eq(promoCodesTable.id, promo.id));
          }
        }
      }
    }

    await tx.update(tripsTable).set({ availableSeats: trip.availableSeats - seatCount }).where(eq(tripsTable.id, tripId));

    const [booking] = await tx.insert(bookingsTable).values({
      userId: req.user!.id,
      tripId,
      seatCount,
      totalPrice: String(totalPrice),
      status: "confirmed",
      paymentStatus: "paid",
      promoCodeId,
    }).returning();

    return { booking };
  });

  if ("error" in result) {
    res.status(result.status ?? 400).json({ error: result.error });
    return;
  }

  res.status(201).json(formatBooking(result.booking as Record<string, unknown>));
});

router.get("/bookings/:id", authenticate, async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (req.user!.role !== "admin" && booking.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  res.json(formatBooking(booking as Record<string, unknown>));
});

router.patch("/bookings/:id/cancel", authenticate, async (req, res): Promise<void> => {
  const params = CancelBookingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, params.data.id));
    if (!booking) return { error: "Booking not found", status: 404 };
    if (req.user!.role !== "admin" && booking.userId !== req.user!.id) return { error: "Forbidden", status: 403 };
    if (booking.status === "cancelled") return { error: "Booking already cancelled", status: 400 };

    const [updated] = await tx.update(bookingsTable).set({ status: "cancelled", paymentStatus: "refunded" }).where(eq(bookingsTable.id, params.data.id)).returning();
    await tx.update(tripsTable).set({ availableSeats: sql`available_seats + ${booking.seatCount}` }).where(eq(tripsTable.id, booking.tripId));

    return { booking: updated };
  });

  if ("error" in result) {
    res.status(result.status ?? 400).json({ error: result.error });
    return;
  }

  res.json(formatBooking(result.booking as Record<string, unknown>));
});

export default router;
