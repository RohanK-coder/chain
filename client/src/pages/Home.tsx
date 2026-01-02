import React from "react";
import { Button } from "@/components/ui/button";
import Logo from "../assets/logo.png";
import Background from "../assets/tech-background.jpg";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav (no blur) */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <p className="text-3xl text-black">cHain</p>

          {/* Auth buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost">Login</Button>
            <Button>Sign Up</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative isolate overflow-hidden">
          {/* Background image (no blur, no overlay) */}
          <div className="absolute inset-0 -z-10">
            <img
              src={Background}
              alt="Background"
              className="h-full w-full object-cover scale-105"
            />
          </div>

          <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-16">
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Welcome
              </p>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl text-gray-300">
                cHain
              </h1>
              <p className="text-base text-white sm:text-lg ">
                developed by students for students
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Button size="lg">To Contribute</Button>
                <Button size="lg" variant="outline">
                  Learn More about cHain
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
    </div>
  );
}
