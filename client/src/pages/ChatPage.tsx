// src/pages/ChatPage.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Users,
  MessagesSquare,
  CalendarPlus,
  LogOut,
  Send,
  Plus,
  RefreshCcw,
  HelpCircle,
} from "lucide-react";

type Conversation = {
  id: string;
  type: "dm" | "group";
  title?: string | null;
  createdAt: string;
  dmWith?: { id: string; email: string; username?: string | null } | null;
  memberCount?: number;
};

type Message = {
  id: string;
  senderId?: string | null;
  body: string;
  createdAt: string;
};

type Studyathon = {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt?: string | null;
  participantCount: number;
  conversationId: string;
  createdBy?: { id: string; email: string; username?: string | null };
};

type Question = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: { id: string; email: string; username?: string | null };
  answerCount: number;
};

type Answer = {
  id: string;
  body: string;
  createdAt: string;
  createdBy: { id: string; email: string; username?: string | null };
};

export function ChatPage({ onLogout }: { onLogout: () => void }) {
  // identity + chats
  const [me, setMe] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // dm
  const [dmEmail, setDmEmail] = useState("");

  // messaging
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // group create dialog
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupInvites, setGroupInvites] = useState(""); // comma separated emails
  const [creatingGroup, setCreatingGroup] = useState(false);

  // live feed: studyathons
  const [studyathons, setStudyathons] = useState<Studyathon[]>([]);
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyCreateOpen, setStudyCreateOpen] = useState(false);
  const [studyTitle, setStudyTitle] = useState("");
  const [studyDesc, setStudyDesc] = useState("");
  const [studyLocation, setStudyLocation] = useState("");
  const [studyStartsAt, setStudyStartsAt] = useState("");
  const [studyEndsAt, setStudyEndsAt] = useState("");
  const [creatingStudy, setCreatingStudy] = useState(false);

  // live feed: questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [qTitle, setQTitle] = useState("");
  const [qBody, setQBody] = useState("");
  const [postingQ, setPostingQ] = useState(false);

  // answers UI
  const [answersOpen, setAnswersOpen] = useState(false);
  const [answersFor, setAnswersFor] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [answering, setAnswering] = useState(false);

  // errors
  const [err, setErr] = useState<string | null>(null);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  async function loadMe() {
    const data = await api.me();
    setMe(data.user);
  }

  async function loadConversations() {
    const data = await api.listConversations();
    setConversations(data.conversations);
    if (!activeId && data.conversations[0]?.id) setActiveId(data.conversations[0].id);
  }

  async function loadMessages(conversationId: string) {
    const data = await api.listMessages(conversationId);
    setMessages((data.messages ?? []).slice().reverse()); // newest-first -> oldest-first
  }

  async function refreshFeed() {
    setErr(null);
    try {
      setStudyLoading(true);
      setQLoading(true);
      const [s, q] = await Promise.all([
        api.listLiveStudyathons?.(30),
        api.listQuestions?.(30),
      ]);
      setStudyathons(s?.studyathons ?? []);
      setQuestions(q?.questions ?? []);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load feed");
    } finally {
      setStudyLoading(false);
      setQLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        await loadMe();
        await loadConversations();
        await refreshFeed();
      } catch (e: any) {
        setErr(e.message ?? "Failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);

    // polling demo
    const t = setInterval(() => loadMessages(activeId), 2500);
    return () => clearInterval(t);
  }, [activeId]);

  async function startDm() {
    setErr(null);
    const email = dmEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Enter a valid email like user@example.com");
      return;
    }

    try {
      const data = await api.dmByEmail(email);
      await loadConversations();
      setActiveId(data.conversation.id);
      setDmEmail("");
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    }
  }

  async function send() {
    if (!activeId) return;
    const body = text.trim();
    if (!body) return;

    setErr(null);
    setSending(true);
    try {
      await api.sendMessage(activeId, body);
      setText("");
      await loadMessages(activeId);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setSending(false);
    }
  }

  async function createGroup() {
    setErr(null);

    const title = groupTitle.trim();
    if (!title) {
      setErr("Group title is required.");
      return;
    }

    const memberEmails = groupInvites
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    setCreatingGroup(true);
    try {
      const created = await api.createGroup(title, memberEmails.length ? memberEmails : undefined);
      await loadConversations();
      setActiveId(created.conversation.id);
      setGroupTitle("");
      setGroupInvites("");
      setGroupOpen(false);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setCreatingGroup(false);
    }
  }

  async function createStudyathon() {
    setErr(null);

    const title = studyTitle.trim();
    if (!title) {
      setErr("Study-a-thon title is required.");
      return;
    }
    if (!studyStartsAt) {
      setErr("Start time is required.");
      return;
    }

    setCreatingStudy(true);
    try {
      await api.createStudyathon({
        title,
        description: studyDesc.trim() || undefined,
        location: studyLocation.trim() || undefined,
        startsAt: new Date(studyStartsAt).toISOString(),
        endsAt: studyEndsAt ? new Date(studyEndsAt).toISOString() : undefined,
      });

      setStudyCreateOpen(false);
      setStudyTitle("");
      setStudyDesc("");
      setStudyLocation("");
      setStudyStartsAt("");
      setStudyEndsAt("");
      await refreshFeed();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setCreatingStudy(false);
    }
  }

  async function joinStudyathon(s: Studyathon) {
    setErr(null);
    try {
      const r = await api.joinStudyathon(s.id);
      const conversationId = r?.conversationId ?? s.conversationId;
      await loadConversations();
      setActiveId(conversationId);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    }
  }

  async function postQuestion() {
    setErr(null);
    const title = qTitle.trim();
    const body = qBody.trim();
    if (!title || !body) {
      setErr("Question title and body are required.");
      return;
    }

    setPostingQ(true);
    try {
      await api.postQuestion({ title, body });
      setQTitle("");
      setQBody("");
      await refreshFeed();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setPostingQ(false);
    }
  }

  async function openAnswers(question: Question) {
    setErr(null);
    setAnswersFor(question);
    setAnswersOpen(true);
    setAnswerText("");
    try {
      const data = await api.listAnswers(question.id);
      setAnswers(data.answers ?? []);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    }
  }

  async function submitAnswer() {
    if (!answersFor) return;
    const body = answerText.trim();
    if (!body) return;

    setErr(null);
    setAnswering(true);
    try {
      await api.answerQuestion(answersFor.id, body);
      setAnswerText("");
      const data = await api.listAnswers(answersFor.id);
      setAnswers(data.answers ?? []);
      await refreshFeed();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setAnswering(false);
    }
  }

  const headerTitle = active
    ? active.type === "dm"
      ? active.dmWith?.email ?? "Direct message"
      : active.title ?? "Group chat"
    : "Pick a conversation";

  return (
    <div className="h-screen w-full grid grid-cols-1 md:grid-cols-[360px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-background">
        <div className="p-4 space-y-4">
          {/* Me */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{me?.username ?? "…"}</div>
              <div className="text-xs text-muted-foreground truncate">
                {me?.email ? `@${me.email}` : " "}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await api.logout();
                onLogout();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <Separator />

          {/* DM + Create Group */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-4">
              {/* DM */}
              <div className="space-y-2">
                <Label htmlFor="dm-email">Start a DM</Label>
                <div className="flex gap-2">
                  <Input
                    id="dm-email"
                    placeholder="person@college.edu"
                    value={dmEmail}
                    onChange={(e) => setDmEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="email"
                  />
                  <Button onClick={startDm} disabled={!dmEmail.trim()}>
                    <MessagesSquare className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Create Group Dialog */}
              <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Create Group
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create a group</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-title">Group title</Label>
                      <Input
                        id="group-title"
                        placeholder="CS204 · Midterm prep"
                        value={groupTitle}
                        onChange={(e) => setGroupTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group-invites">Invite by email (comma-separated)</Label>
                      <Input
                        id="group-invites"
                        placeholder="a@college.edu, b@college.edu"
                        value={groupInvites}
                        onChange={(e) => setGroupInvites(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Only existing users can be added (based on backend lookup).
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button onClick={createGroup} disabled={creatingGroup || !groupTitle.trim()}>
                      {creatingGroup ? "Creating…" : "Create"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {err && (
            <Alert variant="destructive">
              <AlertTitle>Action failed</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Conversations</h3>
            <Badge variant="secondary">{conversations.length}</Badge>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-330px)] px-2 pb-4">
          <div className="space-y-2 px-2">
            {conversations.map((c) => {
              const selected = c.id === activeId;
              const title = c.type === "dm" ? c.dmWith?.username ?? "DM" : c.title ?? "Group";

              const subtitle =
                c.type === "dm"
                  ? c.dmWith?.email
                    ? `@${c.dmWith.email}`
                    : c.dmWith?.id ?? ""
                  : `${c.memberCount ?? ""} members`;

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={[
                    "w-full text-left rounded-xl border p-3 transition",
                    selected ? "bg-muted border-muted-foreground/20" : "bg-background hover:bg-muted/40",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{title}</div>
                      <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
                    </div>
                    <Badge variant={c.type === "dm" ? "outline" : "secondary"} className="shrink-0">
                      {c.type.toUpperCase()}
                    </Badge>
                  </div>
                </button>
              );
            })}

            {!conversations.length && (
              <div className="text-sm text-muted-foreground px-2 py-6">
                No conversations yet. Start a DM or create a group.
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main */}
      <main className="flex flex-col min-h-0">
        {/* Top bar */}
        <div className="border-b p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">{headerTitle}</div>
            {active && <div className="text-xs text-muted-foreground truncate">{active.id}</div>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshFeed}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh Feed
            </Button>
            {active && <Badge variant="secondary">{active.type === "dm" ? "Direct" : "Group"}</Badge>}
          </div>
        </div>

        {/* Content tabs (FIXED HEIGHT + SCROLL AREAS) */}
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <div className="border-b px-4 py-2 flex items-end justify-end">
              <TabsList>
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="feed">Live Feed</TabsTrigger>
              </TabsList>
            </div>

            {/* This wrapper makes TabsContent take the remaining height */}
            <div className="flex-1 min-h-0">
              {/* CHAT TAB */}
              <TabsContent value="chat" className="m-0 h-full">
                <div className="h-full min-h-0 flex flex-col">
                  {/* ✅ Scrollable messages region */}
                  <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="p-4 space-y-4">
                        {!activeId && (
                          <div className="text-sm text-muted-foreground">
                            Select a conversation to view messages.
                          </div>
                        )}

                        {activeId && !messages.length && (
                          <div className="text-sm text-muted-foreground">No messages yet. Say hi 👋</div>
                        )}

                        {messages.map((m) => {
                          const mine = m.senderId === me?.id;
                          return (
                            <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                              <div className="max-w-[78%]">
                                <div
                                  className={[
                                    "rounded-2xl px-3 py-2 border whitespace-pre-wrap break-words",
                                    mine
                                      ? "bg-blue-600 text-primary-foreground border-blue-600/30"
                                      : "bg-background",
                                  ].join(" ")}
                                >
                                  {m.body}
                                </div>
                                <div className={mine ? "text-right" : "text-left"}>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(m.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Input stays pinned */}
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder={activeId ? "Message…" : "Select a conversation to message"}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") send();
                        }}
                        disabled={!activeId || sending}
                      />
                      <Button onClick={send} disabled={!activeId || sending || !text.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        {sending ? "Sending…" : "Send"}
                      </Button>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Demo uses polling every 2.5s. Upgrade to Socket.IO later for realtime.
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* FEED TAB */}
              <TabsContent value="feed" className="m-0 h-full">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-6">
                    {/* Studyathons */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold truncate">Study-a-thons</div>
                        <div className="text-sm text-muted-foreground">
                          Create or join a study sprint — it appears for everyone.
                        </div>
                      </div>

                      <Dialog open={studyCreateOpen} onOpenChange={setStudyCreateOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Host
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Host a study-a-thon</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Title</Label>
                              <Input
                                value={studyTitle}
                                onChange={(e) => setStudyTitle(e.target.value)}
                                placeholder="DSA practice sprint"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={studyDesc}
                                onChange={(e) => setStudyDesc(e.target.value)}
                                placeholder="What you’ll cover, topics, agenda…"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Location (optional)</Label>
                              <Input
                                value={studyLocation}
                                onChange={(e) => setStudyLocation(e.target.value)}
                                placeholder="Library · Room 204 / Online"
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Starts at</Label>
                                <Input
                                  type="datetime-local"
                                  value={studyStartsAt}
                                  onChange={(e) => setStudyStartsAt(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Ends at (optional)</Label>
                                <Input
                                  type="datetime-local"
                                  value={studyEndsAt}
                                  onChange={(e) => setStudyEndsAt(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              onClick={createStudyathon}
                              disabled={creatingStudy || !studyTitle.trim() || !studyStartsAt}
                            >
                              {creatingStudy ? "Creating…" : "Create"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="grid gap-3">
                      {studyLoading && (
                        <div className="text-sm text-muted-foreground">Loading study-a-thons…</div>
                      )}

                      {!studyLoading && !studyathons.length && (
                        <Card className="rounded-2xl">
                          <CardContent className="p-4 text-sm text-muted-foreground">
                            No live study-a-thons right now. Host one to get started.
                          </CardContent>
                        </Card>
                      )}

                      {studyathons.map((s) => (
                        <Card key={s.id} className="rounded-2xl">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{s.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(s.startsAt).toLocaleString()}
                                  {s.endsAt ? ` → ${new Date(s.endsAt).toLocaleString()}` : ""}
                                  {s.location ? ` · ${s.location}` : ""}
                                </div>
                                {s.description && (
                                  <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                                    {s.description}
                                  </div>
                                )}
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-2">
                                <Badge variant="secondary">{s.participantCount} joined</Badge>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={api.studyathonCalendarUrl(s.id)} target="_blank" rel="noreferrer">
                                      <CalendarPlus className="mr-2 h-4 w-4" />
                                      Add
                                    </a>
                                  </Button>
                                  <Button size="sm" onClick={() => joinStudyathon(s)}>
                                    Join
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-muted-foreground">
                              Join opens the study-a-thon chat automatically.
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Separator />

                    {/* Questions Feed */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold truncate">Questions</div>
                        <div className="text-sm text-muted-foreground">
                          Post doubts — seniors and peers can answer.
                        </div>
                      </div>
                    </div>

                    <Card className="rounded-2xl">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <HelpCircle className="h-4 w-4" />
                          Ask a question
                        </div>

                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={qTitle}
                            onChange={(e) => setQTitle(e.target.value)}
                            placeholder="How do I solve this DP transition?"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Details</Label>
                          <Textarea
                            value={qBody}
                            onChange={(e) => setQBody(e.target.value)}
                            placeholder="Paste the problem statement or what you tried…"
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={postQuestion} disabled={postingQ || !qTitle.trim() || !qBody.trim()}>
                            {postingQ ? "Posting…" : "Post"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid gap-3">
                      {qLoading && <div className="text-sm text-muted-foreground">Loading questions…</div>}

                      {!qLoading && !questions.length && (
                        <Card className="rounded-2xl">
                          <CardContent className="p-4 text-sm text-muted-foreground">
                            No questions yet. Be the first to ask!
                          </CardContent>
                        </Card>
                      )}

                      {questions.map((q) => (
                        <Card key={q.id} className="rounded-2xl">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{q.title}</div>
                                <div className="text-xs text-muted-foreground">
                                  by {q.createdBy.username ? `@${q.createdBy.username}` : q.createdBy.email} ·{" "}
                                  {new Date(q.createdAt).toLocaleString()}
                                </div>
                                <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                                  {q.body}
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-2">
                                <Badge variant="secondary">{q.answerCount} answers</Badge>
                                <Button size="sm" variant="outline" onClick={() => openAnswers(q)}>
                                  View / Answer
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>

      {/* Answers Dialog */}
      <Dialog open={answersOpen} onOpenChange={setAnswersOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Answers</DialogTitle>
          </DialogHeader>

          {answersFor ? (
            <div className="space-y-4">
              <div className="rounded-xl border p-3">
                <div className="font-semibold">{answersFor.title}</div>
                <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {answersFor.body}
                </div>
              </div>

              <ScrollArea className="h-[260px] rounded-xl border">
                <div className="p-3 space-y-3">
                  {!answers.length && (
                    <div className="text-sm text-muted-foreground">No answers yet. Be the first to reply.</div>
                  )}

                  {answers.map((a) => (
                    <div key={a.id} className="rounded-xl border p-3">
                      <div className="text-xs text-muted-foreground">
                        {a.createdBy.username ? `@${a.createdBy.username}` : a.createdBy.email} ·{" "}
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                      <div className="mt-2 text-sm whitespace-pre-wrap">{a.body}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-2">
                <Label>Your answer</Label>
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Explain the approach, give hints, or share a solution…"
                />
              </div>

              <DialogFooter>
                <Button onClick={submitAnswer} disabled={!answerText.trim() || answering}>
                  {answering ? "Posting…" : "Post answer"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No question selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
