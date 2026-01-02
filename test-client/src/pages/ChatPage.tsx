import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

type Conversation = {
  id: string;
  type: "dm" | "group";
  title?: string | null;
  createdAt: string;
  dmWith?: { id: string; email: string; username?: string | null } | null;
  memberCount?: number;
};
type Message = { id: string; senderId?: string | null; body: string; createdAt: string };

export function ChatPage({ onLogout }: { onLogout: () => void }) {
  const [me, setMe] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [dmEmail, setDmEmail] = useState("");
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const active = useMemo(() => conversations.find(c => c.id === activeId) ?? null, [conversations, activeId]);

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

    // simple polling for demo
    const t = setInterval(() => loadMessages(activeId), 2500);
    return () => clearInterval(t);
  }, [activeId]);

  async function startDm() {
  setErr(null);

  const email = dmEmail.trim();

  // minimal validation (matches your backend expectation)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErr("Enter a valid email like user@example.com");
    return;
  }

  try {
    console.log("DM request payload:", { email }); // helps debug
    const data = await api.dmByEmail(email);
    await loadConversations();
    setActiveId(data.conversation.id);
    setDmEmail("");
  } catch (e: any) {
    setErr(e.message ?? "Failed");
  }
}


  async function send() {
    if (!activeId || !text.trim()) return;
    setErr(null);
    try {
      await api.sendMessage(activeId, text.trim());
      setText("");
      await loadMessages(activeId);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", height: "100vh", fontFamily: "system-ui" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{me?.email}</div>
            {/* <div style={{ fontSize: 12, opacity: 0.7 }}>{me?.id}</div> */}
          </div>
          <button onClick={async () => { await api.logout(); onLogout(); }}>Logout</button>
        </div>

        <hr />

        <div style={{ display: "grid", gap: 8 }}>
          <input placeholder="DM by email" value={dmEmail} onChange={e => setDmEmail(e.target.value)} />
          <button onClick={startDm} disabled={!dmEmail.trim()}>
  Start / Open DM
</button>

        </div>

        <h4 style={{ marginTop: 16 }}>Conversations</h4>
        <div style={{ display: "grid", gap: 6 }}>
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                textAlign: "left",
                padding: 10,
                border: "1px solid #ddd",
                background: c.id === activeId ? "#f3f3f3" : "white"
              }}
            >
                <div style={{ fontWeight: 600 }}>
                    {c.type === "dm"
                        ? (c.dmWith?.email ?? "DM")
                        : `GROUP${c.title ? ` · ${c.title}` : ""} (${c.memberCount ?? ""})`}
                </div>

              <div style={{ fontSize: 12, opacity: 0.7 }}>{c.id}</div>
            </button>
          ))}
        </div>

        {err && <p style={{ color: "crimson" }}>{err}</p>}
      </aside>

      <main style={{ padding: 12, display: "grid", gridTemplateRows: "1fr auto", gap: 10 }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, overflow: "auto" }}>
          <div style={{ marginBottom: 10, fontWeight: 700 }}>
            {active ? `Conversation: ${active.id}` : "Pick a conversation"}
          </div>
          {messages.map(m => (
            <div key={m.id} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {m.senderId === me?.id ? "You" : m.senderId} · {new Date(m.createdAt).toLocaleString()}
              </div>
              <div>{m.body}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ flex: 1 }}
            placeholder="Message…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") send(); }}
            disabled={!activeId}
          />
          <button onClick={send} disabled={!activeId}>Send</button>
        </div>
      </main>
    </div>
  );
}
 