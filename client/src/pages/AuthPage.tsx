import { useMemo, useState } from "react";
import { api } from "../api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AuthPage({ onAuthed }: { onAuthed: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    const e = email.trim();
    const p = password;
    if (!e || !p) return false;
    if (mode === "register" && p.length < 8) return false;
    return true;
  }, [email, password, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const safeEmail = email.trim();
      const safeUsername = username.trim();

      if (mode === "register") {
        await api.register(safeEmail, password, safeUsername || undefined);
      }
      await api.login(safeEmail, password);
      onAuthed();
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 bg-gradient-to-br from-yellow-300 to-gray-500 overflow-hidden">
      {/* Background watermark text behind the card */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
        <div className="select-none text-black opacity-30 font-semibold tracking-tight text-4xl md:text-4xl lg:text-4xl mb-4">
          app made by rohan kommathoti for csulb
        </div>
      </div>

      <Card className="relative z-10 w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            {mode === "login" ? "Log in to continue." : "Create an account to start messaging."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "register")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    placeholder="Your password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {err && (
                  <Alert variant="destructive">
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={!canSubmit || loading}>
                  {loading ? "Logging in…" : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-r">Email</Label>
                  <Input
                    id="email-r"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input
                    id="username"
                    placeholder="rohan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-r">Password</Label>
                  <Input
                    id="password-r"
                    placeholder="Min 8 characters"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 8 characters.</p>
                </div>

                {err && (
                  <Alert variant="destructive">
                    <AlertTitle>Couldn&apos;t create account</AlertTitle>
                    <AlertDescription>{err}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={!canSubmit || loading}>
                  {loading ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-sm text-muted-foreground">
            Tip: create 2 users (two browsers/incognito) and DM each other by email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
