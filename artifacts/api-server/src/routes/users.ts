import { Router } from "express";
import { db, usersTable, bookingsTable, tripsTable, routesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { UpdateUserProfileBody } from "@workspace/api-zod";

const router = Router();

router.get("/users/me", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  const { password: _, refreshToken: __, ...safeUser } = user;
  res.json({ ...safeUser, walletBalance: parseFloat(safeUser.walletBalance) });
});

router.patch("/users/me", authenticate, async (req, res): Promise<void> => {
  const parsed = UpdateUserProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [updated] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, req.user!.id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const { password: _, refreshToken: __, ...safeUser } = updated;
  res.json({ ...safeUser, walletBalance: parseFloat(safeUser.walletBalance) });
});

router.get("/users/me/bookings", authenticate, async (req, res): Promise<void> => {
  const bookings = await db.select({
    id: bookingsTable.id,
    userId: bookingsTable.userId,
    tripId: bookingsTable.tripId,
    seatCount: bookingsTable.seatCount,
    totalPrice: bookingsTable.totalPrice,
    status: bookingsTable.status,
    paymentStatus: bookingsTable.paymentStatus,
    promoCodeId: bookingsTable.promoCodeId,
    createdAt: bookingsTable.createdAt,
    trip: {
      id: tripsTable.id,
      routeId: tripsTable.routeId,
      departureTime: tripsTable.departureTime,
      arrivalTime: tripsTable.arrivalTime,
      price: tripsTable.price,
      status: tripsTable.status,
    },
  })
    .from(bookingsTable)
    .leftJoin(tripsTable, eq(bookingsTable.tripId, tripsTable.id))
    .where(eq(bookingsTable.userId, req.user!.id))
    .orderBy(bookingsTable.createdAt);

  res.json(bookings.map(b => ({ ...b, totalPrice: parseFloat(b.totalPrice) })));
});

export default router;
