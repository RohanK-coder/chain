// src/pages/ChatPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api, type UserSuggestion } from "../api";

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
  Copy,
  Flame,
  ThumbsUp,
  Laugh,
  UserRound,
  Link as LinkIcon,
  Tag,
  ChevronDown,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  tags?: any; // backend returns string or null
};

type GroupMember = {
  id: string;
  email: string;
  username?: string | null;
  role: string;
  joinedAt: string;
};

function initials(label: string) {
  const s = label.trim();
  if (!s) return "U";
  const parts = s.split(/[\s._-]+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function parseTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter(Boolean);
    } catch {
      // ignore
    }
  }
  return [];
}

export function ChatPage({ onLogout }: { onLogout: () => void }) {
  // identity + chats
  const [me, setMe] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // dm
  const [dmEmail, setDmEmail] = useState("");
  const [dmSuggestions, setDmSuggestions] = useState<UserSuggestion[]>([]);
  const [dmSugOpen, setDmSugOpen] = useState(false);

  // messaging
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // group create dialog
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupInvites, setGroupInvites] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // members dialog (kept)
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);

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
  const [qTagsText, setQTagsText] = useState("");
  const [postingQ, setPostingQ] = useState(false);

  // answers UI
  const [answersOpen, setAnswersOpen] = useState(false);
  const [answersFor, setAnswersFor] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [answering, setAnswering] = useState(false);

  // errors
  const [err, setErr] = useState<string | null>(null);

  // UI sugar
  const [convQuery, setConvQuery] = useState("");
  const [convTab, setConvTab] = useState<"groups" | "dms">("groups");
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // reactions (local)
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});

  // RIGHT PANEL: tab between studyathons and questions
  const [feedTab, setFeedTab] = useState<"study" | "questions">("study");

  const feedQuestionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const headerTitle = active
    ? active.type === "dm"
      ? active.dmWith?.username ?? active.dmWith?.email ?? "Direct message"
      : active.title ?? "Group chat"
    : "Pick a conversation";

  function formatStartsIn(iso: string) {
    const now = Date.now();
    const t = new Date(iso).getTime();
    const diff = t - now;
    if (Number.isNaN(t)) return "";
    if (diff <= 0) return "Started";
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `Starts in ${days}d`;
    if (hrs > 0) return `Starts in ${hrs}h`;
    return `Starts in ${Math.max(1, mins)}m`;
  }

  function reactToMessage(messageId: string, emoji: string) {
    setReactions((prev) => {
      const cur = prev[messageId] ?? {};
      const next = { ...cur, [emoji]: (cur[emoji] ?? 0) + 1 };
      return { ...prev, [messageId]: next };
    });
  }

  async function copyText(txt: string) {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      // ignore
    }
  }

  async function copyMessage(messageId: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedMsgId(messageId);
      setTimeout(() => setCopiedMsgId(null), 900);
    } catch {
      // ignore
    }
  }

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
    setMessages((data.messages ?? []).slice().reverse());
  }

  async function refreshFeed() {
    setErr(null);
    try {
      setStudyLoading(true);
      setQLoading(true);
      const [s, q] = await Promise.all([api.listLiveStudyathons?.(30), api.listQuestions?.(30)]);
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
    const t = setInterval(() => loadMessages(activeId), 2500);
    return () => clearInterval(t);
  }, [activeId]);

  // deep-link to question in URL: /app?question=<id>
  useEffect(() => {
    const url = new URL(window.location.href);
    const qid = url.searchParams.get("question");
    if (!qid) return;
    setFeedTab("questions");
    setTimeout(() => {
      const el = feedQuestionRefs.current[qid];
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 600);
  }, [questions.length]);

  async function startDm(emailOverride?: string) {
    setErr(null);
    const email = (emailOverride ?? dmEmail).trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Enter a valid email like user@example.com");
      return;
    }

    try {
      const data = await api.dmByEmail(email);
      await loadConversations();
      setActiveId(data.conversation.id);
      setDmEmail("");
      setDmSuggestions([]);
      setDmSugOpen(false);
      setConvTab("dms");
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
      setConvTab("groups");
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setCreatingGroup(false);
    }
  }

  async function openMembers() {
    if (!activeId) return;
    setErr(null);
    setMembersOpen(true);
    setMembersLoading(true);
    try {
      const data = await api.getConversationMembers(activeId);
      setMembers(data.members ?? []);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load members");
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }

  async function createStudyathon() {
    setErr(null);

    const title = studyTitle.trim();
    if (!title) return setErr("Study-a-thon title is required.");
    if (!studyStartsAt) return setErr("Start time is required.");

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
      setFeedTab("study");
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
      setConvTab("groups");
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    }
  }

  async function postQuestion() {
    setErr(null);
    const title = qTitle.trim();
    const body = qBody.trim();
    if (!title || !body) return setErr("Question title and body are required.");

    const tags = qTagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5);

    setPostingQ(true);
    try {
      await api.postQuestion({ title, body, tags: tags.length ? tags : undefined });
      setQTitle("");
      setQBody("");
      setQTagsText("");
      await refreshFeed();
      setFeedTab("questions");
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

  // DM suggestions
  useEffect(() => {
    const q = dmEmail.trim();
    if (q.length < 2) {
      setDmSuggestions([]);
      setDmSugOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await api.searchUsers(q);
        const users = (r.users ?? []).filter((u) => u.email !== me?.email);
        setDmSuggestions(users);
        setDmSugOpen(true);
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [dmEmail, me?.email]);

  const filteredConversations = useMemo(() => {
    const q = convQuery.trim().toLowerCase();

    return conversations
      .filter((c) => (convTab === "groups" ? c.type === "group" : c.type === "dm"))
      .filter((c) => {
        if (!q) return true;
        const title = c.type === "dm" ? c.dmWith?.username ?? c.dmWith?.email ?? "dm" : c.title ?? "group";
        return title.toLowerCase().includes(q);
      });
  }, [conversations, convQuery, convTab]);

  const meLabel = me?.username ? `@${me.username}` : me?.email ?? "Me";

  return (
    <div
  className={[
    "h-screen w-full grid grid-cols-1",
    // Responsive 3-col layout:
    // left = fixed-ish (clamps), chat = flexible but capped, right = takes the rest
    "lg:grid-cols-[clamp(280px,22vw,360px)_minmax(360px,1fr)_minmax(320px,1.25fr)]",
    "bg-gradient-to-b from-indigo-50 via-background to-emerald-50",
  ].join(" ")}
>

      {/* LEFT SIDEBAR */}
      <aside className="border-r bg-background/70 backdrop-blur min-h-0">
        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{me?.username ?? "…"}</div>
              <div className="text-xs text-muted-foreground truncate">{me?.email ? `@${me.email}` : " "}</div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="bg-red-300 hover:bg-red-400"
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

          <Card className="rounded-2xl bg-white/70 backdrop-blur border-muted-foreground/10">
            <CardContent className="p-4 space-y-4">
              {/* DM */}
              <div className="space-y-2 relative">
                <Label htmlFor="dm-email">Start a DM</Label>
                <div className="flex gap-2">
                  <Input
                    id="dm-email"
                    placeholder="Type name or email…"
                    value={dmEmail}
                    onChange={(e) => setDmEmail(e.target.value)}
                    inputMode="email"
                    autoComplete="off"
                    className="bg-white/70"
                    onFocus={() => dmSuggestions.length && setDmSugOpen(true)}
                    onBlur={() => setTimeout(() => setDmSugOpen(false), 120)}
                  />
                  <Button
                    onClick={() => startDm()}
                    disabled={!dmEmail.trim()}
                    className="bg-green-500 text-black hover:bg-green-500"
                  >
                    <MessagesSquare className="mr-2 h-4 w-4" />
                    Open
                  </Button>
                </div>

                {dmSugOpen && dmSuggestions.length > 0 && (
                  <div className="absolute z-30 mt-2 w-full rounded-xl border bg-white shadow-lg overflow-hidden">
                    {dmSuggestions.map((u) => {
                      const label = u.username ? `@${u.username}` : u.email;
                      return (
                        <button
                          key={u.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between gap-3"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            startDm(u.email);
                          }}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{label}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </div>
                          <Badge variant="secondary">DM</Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Create Group */}
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
                      <p className="text-xs text-muted-foreground">Only existing users can be added.</p>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Conversations</h3>
              <Badge variant="secondary">{conversations.length}</Badge>
            </div>

            <Tabs value={convTab} onValueChange={(v) => setConvTab(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="dms">DMs</TabsTrigger>
              </TabsList>
            </Tabs>

            <Input
              placeholder="Search…"
              value={convQuery}
              onChange={(e) => setConvQuery(e.target.value)}
              className="bg-white/70"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-420px)] px-2 pb-4">
          <div className="space-y-2 px-2">
            {filteredConversations.map((c) => {
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
                    "w-full text-left rounded-xl border p-3 transition shadow-sm",
                    selected
                      ? "bg-white/80 backdrop-blur border-muted-foreground/20"
                      : "bg-white/60 hover:bg-white/80 border-muted-foreground/10",
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

            {!filteredConversations.length && (
              <div className="text-sm text-muted-foreground px-2 py-6">
                No {convTab === "groups" ? "groups" : "DMs"} yet.
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* CENTER: CHAT (smaller column now) */}
      <main className="flex flex-col min-h-0">
        <div className="border-b bg-background/70 backdrop-blur p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">{headerTitle}</div>
            {active && <div className="text-xs text-muted-foreground truncate">{active.id}</div>}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshFeed} className="bg-white/60">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh Feed
            </Button>

            {active && <Badge variant="secondary">{active.type === "dm" ? "Direct" : "Group"}</Badge>}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4">
              {!activeId && <div className="text-sm text-muted-foreground">Select a conversation.</div>}
              {activeId && !messages.length && <div className="text-sm text-muted-foreground">No messages yet. Say hi 👋</div>}

              {messages.map((m) => {
                const mine = m.senderId === me?.id;
                const msgReactions = reactions[m.id];

                return (
                  <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                    <div className="max-w-[86%] group">
                      <div
                        className={[
                          "relative rounded-2xl px-3 py-2 border whitespace-pre-wrap break-words transition shadow-sm",
                          mine
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-primary-foreground border-blue-600/30"
                            : "bg-white/80 backdrop-blur border-muted-foreground/15",
                        ].join(" ")}
                      >
                        {m.body}

                        <div className="absolute -top-3 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 rounded-full"
                            onClick={() => reactToMessage(m.id, "👍")}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" /> 👍
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 rounded-full"
                            onClick={() => reactToMessage(m.id, "🔥")}
                          >
                            <Flame className="h-4 w-4 mr-1" /> 🔥
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 rounded-full"
                            onClick={() => reactToMessage(m.id, "😂")}
                          >
                            <Laugh className="h-4 w-4 mr-1" /> 😂
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 rounded-full"
                            onClick={() => copyMessage(m.id, m.body)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            {copiedMsgId === m.id ? "Copied" : "Copy"}
                          </Button>
                        </div>
                      </div>

                      {msgReactions && (
                        <div className={mine ? "flex justify-end" : "flex justify-start"}>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(msgReactions).map(([emoji, count]) => (
                              <Badge key={emoji} variant="secondary" className="bg-white/70">
                                {emoji} {count}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

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

          {/* input (kept compact) */}
          <div className="border-t bg-background/60 backdrop-blur p-3">
            <div className="flex gap-2">
              <Input
                placeholder={activeId ? "Message…" : "Select a conversation to message"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                disabled={!activeId || sending}
                className="bg-white/70"
              />
              <Button onClick={send} disabled={!activeId || sending || !text.trim()}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              Demo uses polling every 2.5s. Upgrade to Socket.IO later for realtime.
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT PANEL (wider + tabs) */}
      <aside className="hidden lg:flex flex-col min-h-0 border-l bg-background/60 backdrop-blur">
        {/* header row */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="font-semibold">Live Feed</div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1 flex items-center gap-2 rounded-full border bg-white/70 px-2 py-1 hover:bg-white/90 transition"
                  aria-label="Open user menu"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-semibold">
                    {(me?.username?.[0] ?? me?.email?.[0] ?? "U").toUpperCase()}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="space-y-1">
                  <div className="text-sm font-semibold truncate">{me?.username ?? "Profile"}</div>
                  <div className="text-xs text-muted-foreground truncate">{me?.email ?? ""}</div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    alert(`Username: ${me?.username ?? ""}\nEmail: ${me?.email ?? ""}`);
                  }}
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={async () => {
                    await api.logout();
                    onLogout();
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ✅ Study/Questions tabs */}
          <div className="mt-3">
            <Tabs value={feedTab} onValueChange={(v) => setFeedTab(v as any)}>
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="study">Study-a-thons</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">
            <Tabs value={feedTab} onValueChange={(v) => setFeedTab(v as any)}>
              {/* STUDY TAB */}
              <TabsContent value="study" className="m-0 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold truncate">Study-a-thons</div>
                    <div className="text-sm text-muted-foreground">Create or join a study sprint.</div>
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
                          <Input value={studyTitle} onChange={(e) => setStudyTitle(e.target.value)} placeholder="DSA sprint" />
                        </div>

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea value={studyDesc} onChange={(e) => setStudyDesc(e.target.value)} placeholder="Topics, agenda…" />
                        </div>

                        <div className="space-y-2">
                          <Label>Location (optional)</Label>
                          <Input value={studyLocation} onChange={(e) => setStudyLocation(e.target.value)} placeholder="Library / Online" />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Starts at</Label>
                            <Input type="datetime-local" value={studyStartsAt} onChange={(e) => setStudyStartsAt(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Ends at (optional)</Label>
                            <Input type="datetime-local" value={studyEndsAt} onChange={(e) => setStudyEndsAt(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button onClick={createStudyathon} disabled={creatingStudy || !studyTitle.trim() || !studyStartsAt}>
                          {creatingStudy ? "Creating…" : "Create"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-3">
                  {studyLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

                  {!studyLoading && !studyathons.length && (
                    <Card className="rounded-2xl bg-white/70 border-muted-foreground/10 shadow-sm">
                      <CardContent className="p-4 text-sm text-muted-foreground">No live study-a-thons right now.</CardContent>
                    </Card>
                  )}

                  {studyathons.map((s) => (
                    <Card key={s.id} className="rounded-2xl bg-white/70 border-muted-foreground/10 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{s.title}</div>

                            <div className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="bg-white/70">
                                {formatStartsIn(s.startsAt)}
                              </Badge>
                            </div>

                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(s.startsAt).toLocaleString()}
                              {s.location ? ` · ${s.location}` : ""}
                            </div>

                            {s.description && (
                              <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{s.description}</div>
                            )}
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <Badge variant="secondary" className="bg-white/70">
                              {s.participantCount} joined
                            </Badge>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild className="bg-white/60">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* QUESTIONS TAB */}
              <TabsContent value="questions" className="m-0 space-y-4">
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">Questions</div>
                  <div className="text-sm text-muted-foreground">Post doubts — seniors and peers can answer.</div>
                </div>

                <Card className="rounded-2xl bg-white/70 border-muted-foreground/10 shadow-sm">
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
                        className="bg-white/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Details</Label>
                      <Textarea
                        value={qBody}
                        onChange={(e) => setQBody(e.target.value)}
                        placeholder="Paste the problem statement or what you tried…"
                        className="bg-white/70"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Tags (comma separated)
                      </Label>
                      <Input
                        value={qTagsText}
                        onChange={(e) => setQTagsText(e.target.value)}
                        placeholder="math, dp, pointers"
                        className="bg-white/70"
                      />
                      <p className="text-xs text-muted-foreground">Max 5 tags.</p>
                    </div>

                    <div className="flex justify-start">
                      <Button onClick={postQuestion} disabled={postingQ || !qTitle.trim() || !qBody.trim()}>
                        {postingQ ? "Posting…" : "Post"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-3">
                  {qLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

                  {!qLoading && !questions.length && (
                    <Card className="rounded-2xl bg-white/70 border-muted-foreground/10 shadow-sm">
                      <CardContent className="p-4 text-sm text-muted-foreground">No questions yet.</CardContent>
                    </Card>
                  )}

                  {questions.map((q) => {
                    const tags = parseTags(q.tags);
                    const deepLink = `${window.location.origin}${window.location.pathname}?question=${encodeURIComponent(
                      q.id
                    )}`;

                    return (
                      <div
                        key={q.id}
                        ref={(el) => {
                          feedQuestionRefs.current[q.id] = el;
                        }}
                      >
                        <Card className="rounded-2xl bg-white/70 border-muted-foreground/10 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{q.title}</div>

                                <div className="text-xs text-muted-foreground">
                                  by {q.createdBy.username ? `@${q.createdBy.username}` : q.createdBy.email} ·{" "}
                                  {new Date(q.createdAt).toLocaleString()}
                                </div>

                                {tags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {tags.map((t) => (
                                      <Badge key={t} variant="secondary" className="bg-white/70">
                                        #{t}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <Button size="sm" variant="outline" onClick={() => openAnswers(q)} className="bg-white/60 ">
                                  View / Answer
                                </Button>
                                <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{q.body}</div>

                                <div className="mt-3 flex items-center gap-2">
                                  <Button type="button" size="sm" variant="outline" className="bg-white/60" onClick={() => copyText(deepLink)}>
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    Copy link
                                  </Button>
                                  <div className="text-xs text-muted-foreground truncate">{deepLink}</div>
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-2">
                                <Badge variant="secondary" className="bg-white/70">
                                  {q.answerCount} answers
                                </Badge>
                                
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </aside>

      {/* MEMBERS DIALOG (kept) */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Group members</DialogTitle>
          </DialogHeader>

          {membersLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="space-y-2">
              {!members.length && <div className="text-sm text-muted-foreground">No members found.</div>}
              {members.map((m) => {
                const label = m.username ? `@${m.username}` : m.email;
                return (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 bg-white/60">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{label}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                    </div>
                    <Badge variant={m.role === "admin" ? "default" : "secondary"}>{m.role}</Badge>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ANSWERS DIALOG */}
      <Dialog open={answersOpen} onOpenChange={setAnswersOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Answers</DialogTitle>
          </DialogHeader>

          {answersFor ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-white/70 backdrop-blur p-3">
                <div className="font-semibold">{answersFor.title}</div>
                <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{answersFor.body}</div>
              </div>

              <ScrollArea className="h-72 rounded-xl border bg-white/50 backdrop-blur">
                <div className="p-3 space-y-3">
                  {!answers.length && <div className="text-sm text-muted-foreground">No answers yet. Be the first to reply.</div>}

                  {answers.map((a: any) => (
                    <div key={a.id} className="rounded-xl border bg-white/70 backdrop-blur p-3">
                      <div className="text-xs text-muted-foreground">
                        {a.createdBy?.username ? `@${a.createdBy.username}` : a.createdBy?.email} ·{" "}
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
                  className="bg-white/70"
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
