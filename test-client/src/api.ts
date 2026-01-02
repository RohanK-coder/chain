const API = "http://localhost:3000";

export type Tokens = { accessToken: string; refreshToken: string };

export function getTokens(): Tokens | null {
  const raw = localStorage.getItem("tokens");
  return raw ? (JSON.parse(raw) as Tokens) : null;
}
export function setTokens(t: Tokens | null) {
  if (!t) localStorage.removeItem("tokens");
  else localStorage.setItem("tokens", JSON.stringify(t));
}

async function request(path: string, opts: RequestInit = {}) {
  const tokens = getTokens();
  const headers = new Headers(opts.headers || {});
  headers.set("Content-Type", "application/json");
  if (tokens?.accessToken) headers.set("Authorization", `Bearer ${tokens.accessToken}`);

  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));

  // if access expired, try refresh once
  if (res.status === 401 && tokens?.refreshToken && path !== "/auth/refresh") {
    const r = await fetch(API + "/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken })
    });
    if (r.ok) {
      const refreshed = await r.json();
      const newTokens = { accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken };
      setTokens(newTokens);

      // retry original
      const retryHeaders = new Headers(opts.headers || {});
      retryHeaders.set("Content-Type", "application/json");
      retryHeaders.set("Authorization", `Bearer ${newTokens.accessToken}`);

      const retry = await fetch(API + path, { ...opts, headers: retryHeaders });
      const retryData = await retry.json().catch(() => ({}));
      if (!retry.ok) throw new Error(retryData.error || "Request failed");
      return retryData;
    }
  }

  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  register: (email: string, password: string, username?: string) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, password, username }) }),

  login: async (email: string, password: string) => {
    const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data;
  },

  logout: async () => {
    const t = getTokens();
    if (t?.refreshToken) {
      await request("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: t.refreshToken }) }).catch(() => {});
    }
    setTokens(null);
  },

  me: () => request("/auth/me"),

  listConversations: () => request("/conversations"),
dmByEmail: (email: string) =>
  request("/conversations/dm", {
    method: "POST",
    body: JSON.stringify({ email }),
  }),

  listMessages: (conversationId: string, cursor?: string) =>
    request(`/conversations/${conversationId}/messages${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`),

  sendMessage: (conversationId: string, body: string) =>
    request(`/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
};
