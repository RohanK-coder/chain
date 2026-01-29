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

const featureCards = [
  {
    title: "Study groups that stick",
    desc: "Find classmates by course, topic, or interest and create groups in seconds.",
    icon: Users,
    accent: "from-fuchsia-500/70 via-pink-500/60 to-rose-500/70",
  },
  {
    title: "Ask & answer threads",
    desc: "Post a question, get hints and explanations from students who’ve already solved it.",
    icon: MessagesSquare,
    accent: "from-sky-500/70 via-cyan-500/60 to-emerald-500/70",
  },
  {
    title: "Study-a-thons & events",
    desc: "Host study sprints, review sessions, or social events — then manage RSVPs easily.",
    icon: CalendarDays,
    accent: "from-amber-500/70 via-orange-500/60 to-red-500/70",
  },
  {
    title: "File sharing without chaos",
    desc: "Keep notes, slides, and resources organized by group so you can find them fast.",
    icon: FileText,
    accent: "from-violet-500/70 via-indigo-500/60 to-blue-500/70",
    badge: "dev stage",
  },
  {
    title: "Verified college-only",
    desc: "Sign up with your college email to keep the community real, safe, and relevant.",
    icon: ShieldCheck,
    accent: "from-emerald-500/70 via-teal-500/60 to-sky-500/70",
  },
  {
    title: "Built by students",
    desc: "Designed around real pain points — quick, focused, and friendly.",
    icon: Sparkles,
    accent: "from-pink-500/70 via-purple-500/60 to-indigo-500/70",
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl border bg-gradient-to-br from-fuchsia-500/20 via-sky-500/20 to-emerald-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Chain</span>
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              built by students for students
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={() =>
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Features
            </Button>
            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}
            >
              How it works
            </Button>

            {/* more colorful CTA */}
            <Button
              className="text-white shadow hover:opacity-95"
              onClick={() => navigate("/app")}
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* colorful background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-260px] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-gradient-to-br from-fuchsia-500/25 via-sky-500/20 to-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-[-260px] left-[6%] h-[560px] w-[560px] rounded-full bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-rose-500/20 blur-3xl" />
          <div className="absolute right-[-180px] top-[22%] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-violet-500/20 via-indigo-500/18 to-sky-500/18 blur-3xl" />

          {/* subtle grid */}
          <div className="absolute inset-0 opacity-[0.25] [background:radial-gradient(circle_at_1px_1px,hsl(var(--foreground))_1px,transparent_0)_0_0/22px_22px]" />
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-start">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-fuchsia-500/20 text-black">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Verified college email only
              </Badge>
              <Badge variant="outline" className="border-foreground/15">
                Mobile app + website
              </Badge>
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
              Find your people to study with —{" "}
              <span className="bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                instantly
              </span>
              
            </h1>

            <p className="mt-4 text-lg text-muted-foreground">
              Chain is a messaging platform where students connect, form study groups, ask questions, and host
              study-a-thons or campus events — all in one place.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className=" text-white shadow-md hover:opacity-95"
                onClick={() => navigate("/app")}
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-foreground/15 bg-background/60 backdrop-blur hover:bg-background/80"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Explore features
              </Button>
            </div>

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Built by students, for students
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-500" />
                Get answers from students who already solved it
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-fuchsia-500" />
                Share files without digging through endless links
              </div>
            </div>
          </div>

          {/* Hero Card */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-lg rounded-2xl border-foreground/10 bg-background/60 shadow-lg backdrop-blur">
              <div className="h-2 w-full rounded-t-2xl bg-gradient-to-r from-fuchsia-500 via-sky-500 to-emerald-500" />
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Today on Chain</p>
                    <h3 className="mt-1 text-xl font-semibold tracking-tight">
                      “Discrete Math — Study Group”
                    </h3>
                  </div>
                  <Badge className="border-0 bg-red-600">
                    Live
                  </Badge>
                </div>

                <Separator className="my-5" />

                <div className="space-y-4">
                  <div className="rounded-xl border border-foreground/10 bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-fuchsia-500/10 p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      8 students joined
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Meet peers from your university and set a quick agenda.
                    </p>
                  </div>

                  <div className="rounded-xl border border-foreground/10 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-indigo-500/10 p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <MessagesSquare className="h-4 w-4" />
                      Q&amp;A thread
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Post a problem. Get explanations, hints, and solutions from students who’ve done it.
                    </p>
                  </div>

                  <div className="rounded-xl border border-foreground/10 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 p-4">
                    <div className="flex items-center gap-2 font-medium">
                      <CalendarDays className="h-4 w-4" />
                      Next event: “Calc Sprint”
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      RSVP and get reminders — show up ready to work.
                    </p>
                  </div>
                </div>

                <Button
                  className="mt-6 w-full  text-white shadow-md hover:opacity-95"
                  size="lg"
                  onClick={() => navigate("/app")}
                >
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
              <Badge className="border-0 bg-gradient-to-r from-fuchsia-500/20 via-sky-500/20 to-emerald-500/20 text-black">
                Features
              </Badge>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Everything you need to connect and study better
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Students struggle to find the right people to collaborate with. Chain makes it simple to form groups,
                discuss solutions, and share materials without friction.
              </p>
            </div>

            <Button
              variant="outline"
              className="mt-2 border-foreground/15 bg-background/60 backdrop-blur hover:bg-background/80 sm:mt-0"
              onClick={() => navigate("/app")}
            >
              Get Started
            </Button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(({ title, desc, icon: Icon, accent, badge }) => (
              <Card
                key={title}
                className="group rounded-2xl border-foreground/10 bg-background/60 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`h-1.5 w-full rounded-t-2xl bg-gradient-to-r ${accent}`} />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${accent} text-foreground`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>{title}</span>
                    </div>
                    {badge ? (
                      <Badge variant="secondary" className="shrink-0">
                        {badge}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
          <div className="max-w-2xl">
            <Badge className="border-0 text-black bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-fuchsia-500/20">
              How it works
            </Badge>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Start in under a minute</h2>
            <p className="mt-2 text-muted-foreground">
              Create your account with a verified college email, then connect to your campus community.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                step: "Step 1",
                title: "Verify your college email",
                desc: "Keep Chain exclusive to students, reducing spam and keeping discussions high-quality.",
                accent: "from-emerald-500/70 via-sky-500/60 to-fuchsia-500/70",
              },
              {
                step: "Step 2",
                title: "Join or create groups",
                desc: "Find your course and connect with students who want to collaborate.",
                accent: "from-amber-500/70 via-orange-500/60 to-rose-500/70",
              },
              {
                step: "Step 3",
                title: "Ask, share, and host",
                desc: "Post questions, share resources, or host a study-a-thon — right inside your group.",
                accent: "from-violet-500/70 via-indigo-500/60 to-sky-500/70",
              },
            ].map((s) => (
              <Card
                key={s.step}
                className="rounded-2xl border-foreground/10 bg-background/60 shadow-sm backdrop-blur"
              >
                <div className={`h-1.5 w-full rounded-t-2xl bg-gradient-to-r ${s.accent}`} />
                <CardContent className="p-6">
                  <div className="text-sm text-muted-foreground">{s.step}</div>
                  <div className="mt-1 text-lg font-semibold">{s.title}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-foreground/10 bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-fuchsia-500/10 p-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-5 w-5" />
                Safer by design
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Chain works on mobile and web, and access is limited to verified college emails.
              </p>
            </div>
            <Button
              size="lg"
              className=" text-white shadow-md hover:opacity-95"
              onClick={() => navigate("/app")}
            >
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
            <Badge className="border-0 text-black bg-gradient-to-r from-sky-500/20 to-emerald-500/20">Mobile</Badge>
            <Badge className="border-0 text-black bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20">Web</Badge>
            <Badge className="border-0 text-black bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-fuchsia-500/20">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              College verified
            </Badge>
          </div>
        </div>
      </footer>
    </div>
  );
}
