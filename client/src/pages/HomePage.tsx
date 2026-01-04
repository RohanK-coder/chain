// src/pages/HomePage.tsx
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  CheckCircle2,
  MessagesSquare,
  Users,
  CalendarDays,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl border bg-muted">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Chain</span>
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              built by students for students
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Features
            </Button>
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>
              How it works
            </Button>
            <Button onClick={() => navigate("/app")}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-240px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-muted blur-3xl" />
          <div className="absolute bottom-[-240px] left-[10%] h-[480px] w-[480px] rounded-full bg-muted blur-3xl" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-start">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Verified college email only
              </Badge>
              <Badge variant="outline">Mobile app + website</Badge>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              Find your people to study with — instantly.
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              Chain is a messaging platform where students connect, form study groups, ask questions, and host
              study-a-thons or campus events — all in one place.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" onClick={() => navigate("/app")}>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore features
              </Button>
            </div>

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Built by students, for students
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Get answers from students who already solved it
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Share files without digging through endless links
              </div>
            </div>
          </div>

          {/* Hero Card */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-lg rounded-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Today on Chain</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight">
                      “Discrete Math — Study Group”
                    </h3>
                  </div>
                  <Badge variant="secondary">Live</Badge>
                </div>

                <Separator className="my-5" />

                <div className="space-y-4">
                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      8 students joined
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Meet peers from your university and set a quick agenda.
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/40 p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <MessagesSquare className="h-4 w-4" />
                      Q&amp;A thread
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Post a problem. Get explanations, hints, and solutions from students who’ve done it.
                    </p>
                  </div>

                  

                  
                </div>

                <Button className="mt-6 w-full" size="lg" onClick={() => navigate("/app")}>
                  Join with your college email <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Access is limited to verified college emails to keep it safe and relevant.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="secondary">Features</Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Everything you need to connect and study better
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Students struggle to find the right people to collaborate with. Chain makes it simple to form groups,
                discuss solutions, and share materials without friction.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/app")} className="mt-2 sm:mt-0">
              Get Started
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 font-semibold">
                  <Users className="h-5 w-5" />
                  Study groups that stick
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Find classmates by course, topic, or interest and create groups in seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 font-semibold">
                  <MessagesSquare className="h-5 w-5" />
                  Ask &amp; answer threads
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Post a question, get hints and explanations from students who’ve already solved it.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 font-semibold">
                  <CalendarDays className="h-5 w-5" />
                  Study-a-thons &amp; events
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Host study sprints, review sessions, or social events — then manage RSVPs easily.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 font-semibold">
                  <FileText className="h-5 w-5" />
                  File sharing without chaos : dev stage
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep notes, slides, and resources organized by group so you can find them fast.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-5 w-5" />
                  Verified college-only
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign up with your college email to keep the community real, safe, and relevant.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-5 w-5" />
                  Built by students
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Designed around the real pain points of university life — quick, focused, and friendly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="max-w-2xl">
            <Badge variant="secondary">How it works</Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Start in under a minute
            </h2>
            <p className="mt-2 text-muted-foreground">
              Create your account with a verified college email, then connect to your campus community.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Step 1</div>
                <div className="mt-1 text-lg font-semibold">Verify your college email</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Keep Chain exclusive to students, reducing spam and keeping discussions high-quality.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Step 2</div>
                <div className="mt-1 text-lg font-semibold">Join or create groups</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Find your course and connect with students who want to collaborate.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Step 3</div>
                <div className="mt-1 text-lg font-semibold">Ask, share, and host</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Post questions, share resources, or host a study-a-thon — right inside your group.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border bg-muted/30 p-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-5 w-5" />
                Safer by design
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Chain works on mobile and web, and access is limited to verified college emails.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/app")}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Chain — developed by students, for students.
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Mobile</Badge>
            <Badge variant="outline">Web</Badge>
            <Badge variant="secondary">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              College verified
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
