// src/App.tsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router";

import { getTokens } from "./api";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";

// This component is your current "screen":
// it decides AuthPage vs ChatPage based on tokens.
function AppGate() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(!!getTokens());

  return authed ? (
    <ChatPage
      onLogout={() => {
        setAuthed(false);
        navigate("/"); // go back to homepage on logout (optional)
      }}
    />
  ) : (
    <AuthPage
      onAuthed={() => {
        setAuthed(true);
        navigate("/app"); // stay on the same screen after auth
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* This is the screen you showed in your snippet */}
        <Route path="/app" element={<AppGate />} />

        {/* Optional: redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
