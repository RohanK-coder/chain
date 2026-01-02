import { useState } from "react";
import { getTokens } from "./api";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";

export default function App() {
  const [authed, setAuthed] = useState(!!getTokens());
  return authed ? <ChatPage onLogout={() => setAuthed(false)} /> : <AuthPage onAuthed={() => setAuthed(true)} />;
}
