import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Wordmark";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TaskBridge — Turn unclear requests into clear plans" },
      { name: "description", content: "TaskBridge helps freelancers turn vague work requests into organized plans with tasks, priorities, and progress." },
      { property: "og:title", content: "TaskBridge — Turn unclear requests into clear plans" },
      { property: "og:description", content: "Organize work requests into actionable plans and track progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <Wordmark />
        <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-16">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">For freelancers & early-career pros</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
          Turn unclear requests into clear, actionable plans.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Capture what a client asked for, define the outcome, break it into prioritized tasks, and see exactly how far along you are.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Get Started</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/auth">Sign In</Link></Button>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            ["Define", "Write down the request and the outcome you're aiming for."],
            ["Break down", "Add tasks with priorities and statuses."],
            ["Track", "Progress updates as tasks are completed."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-lg border bg-card p-5">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
