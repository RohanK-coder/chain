import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const router = Router();

const ACCESS_TTL_SECONDS = Number(process.env.ACCESS_TTL_SECONDS ?? 900);
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TTL_DAYS ?? 30);

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
function makeRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

router.post("/register", async (req, res) => {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    username: z.string().min(3).max(32).optional(),
  }).parse(req.body);

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      username: body.username ?? null,
      passwordHash,
    },
    select: { id: true, email: true, username: true, createdAt: true }
  });

  res.status(201).json({ user });
});

router.post("/login", async (req, res) => {
  const body = z.object({ email: z.string().email(), password: z.string() }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = jwt.sign({ sub: user.id }, process.env.JWT_ACCESS_SECRET!, { expiresIn: ACCESS_TTL_SECONDS });

  const refreshToken = makeRefreshToken();
  const refreshTokenHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000);

  await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      userAgent: req.header("user-agent") ?? null,
      ip: req.ip ?? null,
      expiresAt,
    }
  });

  res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, username: user.username } });
});

router.post("/refresh", async (req, res) => {
  const body = z.object({ refreshToken: z.string().min(20) }).parse(req.body);
  const refreshTokenHash = sha256(body.refreshToken);

  const session = await prisma.authSession.findFirst({ where: { refreshTokenHash } });
  if (!session) return res.status(401).json({ error: "Invalid refresh token" });
  if (session.revokedAt) return res.status(401).json({ error: "Session revoked" });
  if (session.expiresAt < new Date()) return res.status(401).json({ error: "Session expired" });

  // rotate: revoke old session, create new
  await prisma.authSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });

  const newRefreshToken = makeRefreshToken();
  const newRefreshTokenHash = sha256(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000);

  await prisma.authSession.create({
    data: {
      userId: session.userId,
      refreshTokenHash: newRefreshTokenHash,
      userAgent: req.header("user-agent") ?? null,
      ip: req.ip ?? null,
      expiresAt: newExpiresAt,
    }
  });

  const accessToken = jwt.sign({ sub: session.userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: ACCESS_TTL_SECONDS });

  res.json({ accessToken, refreshToken: newRefreshToken });
});

router.post("/logout", async (req, res) => {
  const body = z.object({ refreshToken: z.string().min(20) }).parse(req.body);
  const refreshTokenHash = sha256(body.refreshToken);

  await prisma.authSession.updateMany({
    where: { refreshTokenHash },
    data: { revokedAt: new Date() }
  });

  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const auth = req.header("authorization");
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  try {
    const token = auth.slice("Bearer ".length);
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
    const userId = payload.sub as string;

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, createdAt: true }
    });
    if (!me) return res.status(401).json({ error: "Unauthorized" });

    res.json({ user: me });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
