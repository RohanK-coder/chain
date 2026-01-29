import { Router } from "express";
import { z } from "zod";
import { prisma } from "./prisma";
import { requireAuth, type AuthedRequest } from "./auth";

const router = Router();

/**
 * Create a GROUP conversation
 * POST /conversations/group { title, memberEmails?: string[] }
 */
router.post("/conversations/group", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const body = z
    .object({
      title: z.string().min(1).max(80),
      memberEmails: z.array(z.string().email()).optional(),
    })
    .parse(req.body);

  const emails = (body.memberEmails ?? []).map((e) => e.toLowerCase());
  const members = emails.length
    ? await prisma.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true },
      })
    : [];

  // Create group with creator as admin + found members as member
  const conv = await prisma.conversation.create({
    data: {
      type: "group",
      title: body.title,
      createdBy: userId,
      members: {
        create: [
          { userId, role: "admin" },
          ...members
            .filter((u) => u.id !== userId)
            .map((u) => ({ userId: u.id, role: "member" })),
        ],
      },
    },
    include: { members: true },
  });

  res.status(201).json({ conversation: conv });
});

/**
 * Invite/add a member to a GROUP by email
 * POST /conversations/:id/members { email }
 */
router.post("/conversations/:id/members", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conversationId = req.params.id;
  const body = z.object({ email: z.string().email() }).parse(req.body);

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  if (conv.type !== "group")
    return res.status(400).json({ error: "Only group conversations support adding members" });

  // must be admin
  const meMember = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!meMember) return res.status(403).json({ error: "Forbidden" });
  if (meMember.role !== "admin") return res.status(403).json({ error: "Only admins can add members" });

  const other = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (!other) return res.status(404).json({ error: "User not found" });

  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId, userId: other.id } },
    update: {},
    create: { conversationId, userId: other.id, role: "member" },
  });

  res.json({ ok: true });
});

/**
 * NEW: View group members
 * GET /conversations/:id/members
 */
router.get("/conversations/:id/members", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conversationId = req.params.id;

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) return res.status(403).json({ error: "Forbidden" });

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return res.status(404).json({ error: "Conversation not found" });

  const members = await prisma.conversationMember.findMany({
    where: { conversationId },
    include: { user: { select: { id: true, email: true, username: true } } },
    orderBy: { joinedAt: "asc" },
  });

  res.json({
    type: conv.type,
    title: conv.title,
    members: members.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      username: m.user.username,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
  });
});

/**
 * NEW: Leave group
 * POST /conversations/:id/leave
 */
router.post("/conversations/:id/leave", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conversationId = req.params.id;

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return res.status(404).json({ error: "Conversation not found" });
  if (conv.type !== "group") return res.status(400).json({ error: "Only group conversations support leaving" });

  const me = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!me) return res.status(400).json({ error: "Not a member" });

  await prisma.conversationMember.delete({
    where: { conversationId_userId: { conversationId, userId } },
  });

  const remaining = await prisma.conversationMember.findMany({ where: { conversationId } });

  if (remaining.length === 0) {
    await prisma.conversation.delete({ where: { id: conversationId } });
    return res.json({ ok: true, deleted: true });
  }

  // if admin left and no other admin exists -> promote first remaining
  if (me.role === "admin" && !remaining.some((m) => m.role === "admin")) {
    await prisma.conversationMember.update({
      where: { conversationId_userId: { conversationId, userId: remaining[0].userId } },
      data: { role: "admin" },
    });
  }

  res.json({ ok: true });
});

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
      members: { every: { userId: { in: [userId, other.id] } } },
    },
    include: { members: true },
  });

  if (existing && existing.members.length === 2) {
    return res.json({ conversation: existing });
  }

  const conv = await prisma.conversation.create({
    data: {
      type: "dm",
      members: {
        create: [{ userId, role: "admin" }, { userId: other.id, role: "member" }],
      },
    },
    include: { members: true },
  });

  res.status(201).json({ conversation: conv });
});

/**
 * NEW: User search (username/email suggestions)
 * GET /users/search?q=ro
 */
router.get("/users/search", requireAuth, async (req: AuthedRequest, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.json({ users: [] });

  const users = await prisma.user.findMany({
    where: {
      OR: [{ username: { contains: q } }, { email: { contains: q } }],
    },
    select: { id: true, email: true, username: true },
    take: 10,
  });

  res.json({ users });
});

/** List my conversations */
router.get("/conversations", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;

  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "desc" },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, username: true } } },
      },
    },
  });

  const shaped = conversations.map((c) => {
    if (c.type === "dm") {
      const other = c.members.find((m) => m.userId !== userId)?.user ?? null;
      return { id: c.id, type: c.type, createdAt: c.createdAt, dmWith: other };
    }
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
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) return res.status(403).json({ error: "Forbidden" });

  const q = z
    .object({
      cursor: z.string().optional(),
      limit: z.coerce.number().min(1).max(100).default(30),
    })
    .parse(req.query);

  const where = q.cursor
    ? { conversationId, createdAt: { lt: new Date(q.cursor) } }
    : { conversationId };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: q.limit,
  });

  const nextCursor = messages.length ? messages[messages.length - 1].createdAt.toISOString() : null;
  res.json({ messages, nextCursor });
});

/** Send message */
router.post("/conversations/:id/messages", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const conversationId = req.params.id;

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) return res.status(403).json({ error: "Forbidden" });

  const body = z.object({ body: z.string().min(1).max(4000) }).parse(req.body);

  const msg = await prisma.message.create({
    data: { conversationId, senderId: userId, body: body.body },
  });

  res.status(201).json({ message: msg });
});

function toIcsDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Create a studyathon (and create a group conversation tied to it)
 * POST /studyathons { title, description?, location?, startsAt, endsAt? }
 */
router.post("/studyathons", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const body = z
    .object({
      title: z.string().min(3).max(120),
      description: z.string().max(2000).optional(),
      location: z.string().max(120).optional(),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime().optional(),
    })
    .parse(req.body);

  const startsAt = new Date(body.startsAt);
  const endsAt = body.endsAt ? new Date(body.endsAt) : null;

  const conversation = await prisma.conversation.create({
    data: {
      type: "group",
      title: `Study-a-thon · ${body.title}`,
      createdBy: userId,
      members: { create: [{ userId, role: "admin" }] },
    },
  });

  const studyathon = await prisma.studyathon.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      location: body.location ?? null,
      startsAt,
      endsAt: endsAt ?? null,
      createdById: userId,
      conversationId: conversation.id,
      participants: { create: [{ userId }] },
    },
  });

  res.status(201).json({ studyathon });
});

/**
 * Join a studyathon
 * POST /studyathons/:id/join
 */
router.post("/studyathons/:id/join", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const id = req.params.id;

  const s = await prisma.studyathon.findUnique({ where: { id } });
  if (!s) return res.status(404).json({ error: "Studyathon not found" });

  await prisma.studyathonParticipant.upsert({
    where: { studyathonId_userId: { studyathonId: id, userId } },
    update: {},
    create: { studyathonId: id, userId },
  });

  await prisma.conversationMember.upsert({
    where: { conversationId_userId: { conversationId: s.conversationId, userId } },
    update: {},
    create: { conversationId: s.conversationId, userId, role: "member" },
  });

  res.json({ ok: true, conversationId: s.conversationId });
});

/**
 * Live studyathons feed
 * GET /studyathons/live?limit=20
 */
router.get("/studyathons/live", requireAuth, async (req: AuthedRequest, res) => {
  const q = z.object({ limit: z.coerce.number().min(1).max(50).default(20) }).parse(req.query);
  const now = new Date();

  const items = await prisma.studyathon.findMany({
    where: {
      OR: [
        { endsAt: null, startsAt: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) } },
        { endsAt: { gte: now } },
      ],
    },
    orderBy: { startsAt: "asc" },
    take: q.limit,
    include: {
      createdBy: { select: { id: true, email: true, username: true } },
      participants: { select: { userId: true } },
    },
  });

  res.json({
    studyathons: items.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      location: s.location,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      createdBy: s.createdBy,
      participantCount: s.participants.length,
      conversationId: s.conversationId,
    })),
  });
});

/**
 * Add to calendar (.ics)
 * GET /studyathons/:id/calendar.ics
 */
router.get("/studyathons/:id/calendar.ics", async (req: AuthedRequest, res) => {
  const id = req.params.id;

  const s = await prisma.studyathon.findUnique({
    where: { id },
    include: { createdBy: { select: { email: true } } },
  });
  if (!s) return res.status(404).send("Not found");

  const dtStart = toIcsDate(s.startsAt);
  const dtEnd = toIcsDate(s.endsAt ?? new Date(s.startsAt.getTime() + 60 * 60 * 1000));

  const uid = `${s.id}@chain`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chain//Studyathon//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${(s.title ?? "").replace(/\n/g, " ")}`,
    s.description ? `DESCRIPTION:${s.description.replace(/\n/g, "\\n")}` : "",
    s.location ? `LOCATION:${s.location.replace(/\n/g, " ")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="studyathon-${s.id}.ics"`);
  res.send(ics);
});

/**
 * Post a question (NEW: tags)
 * POST /questions { title, body, tags?: string[] }
 */
router.post("/questions", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const body = z
    .object({
      title: z.string().min(5).max(140),
      body: z.string().min(10).max(4000),
      tags: z.array(z.string().min(1).max(20)).max(5).optional(),
    })
    .parse(req.body);

  const q = await prisma.question.create({
    data: {
      title: body.title,
      body: body.body,
      createdById: userId,
      tags: body.tags?.length ? JSON.stringify(body.tags) : null,
    },
  });

  res.status(201).json({ question: q });
});

/**
 * List latest questions (NEW: tags)
 * GET /questions?limit=20
 */
router.get("/questions", requireAuth, async (req: AuthedRequest, res) => {
  const q = z.object({ limit: z.coerce.number().min(1).max(50).default(20) }).parse(req.query);

  const items = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    take: q.limit,
    include: {
      createdBy: { select: { id: true, email: true, username: true } },
      _count: { select: { answers: true } },
    },
  });

  res.json({
    questions: items.map((x) => ({
      id: x.id,
      title: x.title,
      body: x.body,
      createdAt: x.createdAt,
      createdBy: x.createdBy,
      answerCount: x._count.answers,
      tags: x.tags,
    })),
  });
});

/**
 * Answer a question
 * POST /questions/:id/answers { body }
 */
router.post("/questions/:id/answers", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.userId!;
  const questionId = req.params.id;
  const body = z.object({ body: z.string().min(2).max(4000) }).parse(req.body);

  const exists = await prisma.question.findUnique({ where: { id: questionId } });
  if (!exists) return res.status(404).json({ error: "Question not found" });

  const ans = await prisma.answer.create({
    data: { questionId, body: body.body, createdById: userId },
  });

  res.status(201).json({ answer: ans });
});

/**
 * List answers for a question
 * GET /questions/:id/answers
 */
router.get("/questions/:id/answers", requireAuth, async (req: AuthedRequest, res) => {
  const questionId = req.params.id;

  const items = await prisma.answer.findMany({
    where: { questionId },
    orderBy: { createdAt: "asc" },
    include: { createdBy: { select: { id: true, email: true, username: true } } },
  });

  res.json({ answers: items });
});

export default router;
