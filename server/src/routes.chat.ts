import { Router } from "express";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireAuth, type AuthedRequest } from "./auth";

const router = Router();

/**
 * Create or get a DM conversation by other user's email (simple testing UX).
 * POST /conversations/dm { email }
 */
router.post("/conversations/dm", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const body = z.object({ email: z.string().email() }).parse(req.body);

  const other = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!other) return res.status(404).json({ error: "User not found" });
  if (other.id === userId) return res.status(400).json({ error: "Cannot DM yourself" });

  // Find existing DM with exactly these 2 members (minimal approach)
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "dm",
      members: { every: { userId: { in: [userId, other.id] } } }
    },
    include: { members: true }
  });

  if (existing && existing.members.length === 2) {
    return res.json({ conversation: existing });
  }

  const conv = await prisma.conversation.create({
    data: {
      type: "dm",
      members: {
        create: [{ userId, role: "admin" }, { userId: other.id, role: "member" }]
      }
    },
    include: { members: true }
  });

  res.status(201).json({ conversation: conv });
});

/** List my conversations */
router.get("/conversations", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, username: true } }
        }
      }
    }
  });

  const shaped = conversations.map((c) => {
    if (c.type === "dm") {
      const other = c.members.find((m) => m.userId !== userId)?.user ?? null;
      return {
        id: c.id,
        type: c.type,
        createdAt: c.createdAt,
        dmWith: other, // {id,email,username} or null
      };
    }

    // group (optional)
    return {
      id: c.id,
      type: c.type,
      title: c.title,
      createdAt: c.createdAt,
      memberCount: c.members.length,
    };
  });

  res.json({ conversations: shaped });
});


/** Get messages (cursor pagination by createdAt) */
router.get("/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conversationId = req.params.id;

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });
  if (!member) return res.status(403).json({ error: "Forbidden" });

  const q = z.object({
    cursor: z.string().optional(), // ISO date string
    limit: z.coerce.number().min(1).max(100).default(30),
  }).parse(req.query);

  const where = q.cursor
    ? { conversationId, createdAt: { lt: new Date(q.cursor) } }
    : { conversationId };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: q.limit
  });

  const nextCursor = messages.length ? messages[messages.length - 1].createdAt.toISOString() : null;
  res.json({ messages, nextCursor });
});

/** Send message */
router.post("/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conversationId = req.params.id;

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });
  if (!member) return res.status(403).json({ error: "Forbidden" });

  const body = z.object({ body: z.string().min(1).max(4000) }).parse(req.body);

  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      body: body.body
    }
  });

  res.status(201).json({ message: msg });
});

export default router;
