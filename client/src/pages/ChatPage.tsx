import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

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

export function ChatPage({ onLogout }: { onLogout: () => void }) {
  const [me, setMe] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dmEmail, setDmEmail] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loadingDm, setLoadingDm] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);

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
    setMessages(data.messages.reverse()); // API returns newest-first
  }

  useEffect(() => {
    (async () => {
      setErr(null);
      try {
        await loadMe();
        await loadConversations();
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

  async function startDm() {
    setErr(null);

    const email = dmEmail.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Enter a valid email like user@example.com");
      return;
    }

    setLoadingDm(true);
    try {
      const data = await api.dmByEmail(email);
      await loadConversations();
      setActiveId(data.conversation.id);
      setDmEmail("");
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoadingDm(false);
    }
  }

  async function send() {
    if (!activeId) return;

    const body = text.trim();
    if (!body) return;

    setErr(null);
    setLoadingSend(true);
    try {
      await api.sendMessage(activeId, body);
      setText("");
      await loadMessages(activeId);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setLoadingSend(false);
    }
  }

  return (
    <div className="h-screen w-full grid grid-cols-1 md:grid-cols-[340px_1fr]">
      {/* Sidebar */}
      <aside className="border-r bg-background">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold truncate">{me?.email ?? "…"}</div>
              <div className="text-xs text-muted-foreground truncate">
                {me?.username ? `@${me.username}` : " "}
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
              Logout
            </Button>
          </div>

          <Separator />

          <Card className="p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="dm-email">Start a DM</Label>
              <div className="flex gap-2">
                <Input
                  id="dm-email"
                  placeholder="person@example.com"
                  value={dmEmail}
                  onChange={(e) => setDmEmail(e.target.value)}
                  inputMode="email"
                  autoComplete="email"
                />
                <Button onClick={startDm} disabled={!dmEmail.trim() || loadingDm}>
                  {loadingDm ? "…" : "Open"}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: create 2 users (two browsers/incognito) and DM each other by email.
            </p>
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

        <ScrollArea className="h-[calc(100vh-260px)] px-2 pb-4">
          <div className="space-y-2 px-2">
            {conversations.map((c) => {
              const selected = c.id === activeId;
              const title =
                c.type === "dm"
                  ? c.dmWith?.email ?? "DM"
                  : `Group${c.title ? ` · ${c.title}` : ""}`;

              const subtitle =
                c.type === "dm"
                  ? (c.dmWith?.username ? `@${c.dmWith.username}` : c.dmWith?.id ?? "")
                  : `${c.memberCount ?? ""} members`;

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={[
                    "w-full text-left rounded-lg border p-3 transition",
                    selected ? "bg-muted border-muted-foreground/20" : "bg-background hover:bg-muted/40"
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
                No conversations yet. Start a DM above.
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main chat */}
      <main className="flex flex-col">
        <div className="border-b p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">
              {active
                ? active.type === "dm"
                  ? (active.dmWith?.email ?? "Direct message")
                  : (active.title ?? "Group chat")
                : "Pick a conversation"}
            </div>
            {active && (
              <div className="text-xs text-muted-foreground truncate">
                {active.id}
              </div>
            )}
          </div>
          {active && (
            <Badge variant="secondary">
              {active.type === "dm" ? "Direct" : "Group"}
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {!activeId && (
              <div className="text-sm text-muted-foreground">Select a conversation to view messages.</div>
            )}

            {activeId && !messages.length && (
              <div className="text-sm text-muted-foreground">No messages yet. Say hi 👋</div>
            )}

            {messages.map((m) => {
              const mine = m.senderId === me?.id;
              return (
                <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div className={mine ? "max-w-[75%]" : "max-w-[75%]"}>
                    
                    <div
                      className={[
                        "mt-1 rounded-2xl px-3 py-2 border whitespace-pre-wrap break-words",
                        mine ? "bg-blue-600 text-primary-foreground border-primary/20" : "bg-background"
                      ].join(" ")}
                    >
                      {m.body}
                    </div>
                    <div className={mine ? "text-right" : "text-left"}>
                      <div className="text-xs text-muted-foreground">
                         {new Date(m.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder={activeId ? "Message…" : "Select a conversation to message"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={!activeId || loadingSend}
            />
            <Button onClick={send} disabled={!activeId || loadingSend || !text.trim()}>
              {loadingSend ? "Sending…" : "Send"}
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Demo uses polling every 2.5s. Upgrade to Socket.IO later for realtime.
          </div>
        </div>
      </main>
    </div>
  );
}
