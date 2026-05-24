import { Router } from "express";
import { db, walletTransactionsTable, usersTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";
import {
  ListWalletTransactionsQueryParams,
  ListAllTransactionsQueryParams,
  AdminRefundBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/wallet", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select({ walletBalance: usersTable.walletBalance }).from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ userId: req.user!.id, balance: parseFloat(user.walletBalance) });
});

router.get("/wallet/transactions", authenticate, async (req, res): Promise<void> => {
  const parsed = ListWalletTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;
  const [data, countResult] = await Promise.all([
    db.select().from(walletTransactionsTable).where(eq(walletTransactionsTable.userId, req.user!.id)).limit(limit).offset(offset).orderBy(walletTransactionsTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(walletTransactionsTable).where(eq(walletTransactionsTable.userId, req.user!.id)),
  ]);
  res.json({
    data: data.map(t => ({ ...t, amount: parseFloat(t.amount) })),
    total: countResult[0].count,
    page,
    limit,
  });
});

router.get("/admin/wallet/transactions", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = ListAllTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { userId, type, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userId) conditions.push(eq(walletTransactionsTable.userId, userId));
  if (type) conditions.push(eq(walletTransactionsTable.type, type as "deposit" | "payment" | "refund"));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select({
      id: walletTransactionsTable.id,
      userId: walletTransactionsTable.userId,
      amount: walletTransactionsTable.amount,
      type: walletTransactionsTable.type,
      description: walletTransactionsTable.description,
      createdAt: walletTransactionsTable.createdAt,
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
    }).from(walletTransactionsTable)
      .leftJoin(usersTable, eq(walletTransactionsTable.userId, usersTable.id))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(walletTransactionsTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(walletTransactionsTable).where(where),
  ]);

  res.json({
    data: data.map(t => ({ ...t, amount: parseFloat(t.amount) })),
    total: countResult[0].count,
    page,
    limit,
  });
});

router.post("/admin/wallet/refund", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = AdminRefundBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { userId, amount, description } = parsed.data;

  await db.transaction(async (tx) => {
    await tx.update(usersTable).set({
      walletBalance: sql`wallet_balance + ${String(amount)}`,
    }).where(eq(usersTable.id, userId));

    const [txn] = await tx.insert(walletTransactionsTable).values({
      userId,
      amount: String(amount),
      type: "refund",
      description,
    }).returning();

    res.json({ ...txn, amount: parseFloat(txn.amount) });
  });
});

export default router;
