import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";
import {
  MarkNotificationReadParams,
  SendNotificationBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/notifications", authenticate, async (req, res): Promise<void> => {
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(notificationsTable.createdAt);
  res.json(notifications);
});

router.post("/notifications", authenticate, requireRole("admin"), async (req, res): Promise<void> => {
  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [notification] = await db.insert(notificationsTable).values(parsed.data).returning();
  res.status(201).json(notification);
});

router.patch("/notifications/:id/read", authenticate, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [updated] = await db.update(notificationsTable).set({ isRead: true })
    .where(eq(notificationsTable.id, params.data.id)).returning();
  if (!updated) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(updated);
});

export default router;
