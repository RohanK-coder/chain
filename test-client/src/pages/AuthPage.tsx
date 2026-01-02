import { useState } from "react";
import { api } from "../api";

export function AuthPage({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      if (mode === "register") await api.register(email, password, username || undefined);
      await api.login(email, password);
      onAuthed();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "system-ui" }}>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
        {mode === "register" && (
          <input placeholder="username (optional)" value={username} onChange={e => setUsername(e.target.value)} />
        )}
        <input placeholder="password (min 8)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">{mode === "login" ? "Login" : "Create account"}</button>
      </form>
      {err && <p style={{ color: "crimson" }}>{err}</p>}
      <button onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ marginTop: 10 }}>
        Switch to {mode === "login" ? "Register" : "Login"}
      </button>
      <p style={{ marginTop: 20, opacity: 0.7 }}>
        Tip: make 2 users (two browsers/incognito) and DM each other by email.
      </p>
    </div>
  );
}
