import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, staffRolesTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  RegisterBody,
  LoginBody,
  RefreshTokenBody,
} from "@workspace/api-zod";

const router = Router();

async function getPermissions(staffRoleId: number | null): Promise<string[]> {
  if (!staffRoleId) return [];
  const [role] = await db.select({ permissions: staffRolesTable.permissions })
    .from(staffRolesTable)
    .where(eq(staffRolesTable.id, staffRoleId));
  return role?.permissions ?? [];
}

router.post("/auth/register", async (req, res): Promise<void> => {
  // [DEBUG] Log incoming payload (password redacted)
  logger.info({
    msg: "[register] incoming request body",
    body: { ...req.body, password: req.body?.password ? "[REDACTED]" : undefined },
  });

  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    // [DEBUG] Log full Zod validation failure
    logger.info({
      msg: "[register] validation failed",
      issues: parsed.error.issues,
      formattedError: parsed.error.message,
    });
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, phone, password } = parsed.data;

  const [existing] = await db.select({ id: usersTable.id })
    .from(usersTable)
    .where(or(eq(usersTable.email, email), eq(usersTable.phone, phone)));

  if (existing) {
    // [DEBUG] Log which field caused the duplicate conflict
    logger.info({
      msg: "[register] duplicate check failed — email or phone already registered",
      email,
      phone,
      existingUserId: existing.id,
    });
    res.status(400).json({ error: "Email or phone already registered" });
    return;
  }

  logger.info({ msg: "[register] validation + uniqueness passed, creating user", email, phone });

  const hashedPassword = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    phone,
    password: hashedPassword,
    role: "user",
  }).returning();

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));

  const { password: _, refreshToken: __, ...safeUser } = user;
  res.status(201).json({
    accessToken,
    refreshToken,
    user: { ...safeUser, walletBalance: parseFloat(safeUser.walletBalance), permissions: [] },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  // Accept both `email` (mobile) and `credential` (existing clients)
  const body = req.body ?? {};
  const normalized = { ...body, credential: body.credential ?? body.email };

  const parsed = LoginBody.safeParse(normalized);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(", ");
    res.status(400).json({ error: message });
    return;
  }

  const { credential, password } = parsed.data;
  const [user] = await db.select()
    .from(usersTable)
    .where(or(eq(usersTable.email, credential), eq(usersTable.phone, credential)));

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (user.isBlocked) {
    res.status(403).json({ error: "Account is blocked" });
    return;
  }

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));

  const permissions = await getPermissions(user.staffRoleId);
  const { password: _, refreshToken: __, ...safeUser } = user;
  res.status(200).json({
    accessToken,
    refreshToken,
    user: { ...safeUser, walletBalance: parseFloat(safeUser.walletBalance), permissions },
  });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const { refreshToken } = parsed.data;
    const payload = verifyRefreshToken(refreshToken);

    const [user] = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const newPayload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await db.update(usersTable).set({ refreshToken: newRefreshToken }).where(eq(usersTable.id, user.id));

    const permissions = await getPermissions(user.staffRoleId);
    const { password: _, refreshToken: __, ...safeUser } = user;
    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: { ...safeUser, walletBalance: parseFloat(safeUser.walletBalance), permissions },
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const [user] = await db.select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const permissions = await getPermissions(user.staffRoleId);
  const { password: _, refreshToken: __, ...safeUser } = user;
  res.json({ ...safeUser, walletBalance: parseFloat(safeUser.walletBalance), permissions });
});

export default router;
