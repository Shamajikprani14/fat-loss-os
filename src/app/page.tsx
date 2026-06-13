import Link from "next/link";
import {
  Activity,
  BarChart3,
  Camera,
  CheckCircle2,
  Dumbbell,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/providers/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const features = [
  { icon: Activity, title: "Weight Tracking", desc: "Daily logs, weekly averages, and trend detection." },
  { icon: Utensils, title: "Nutrition", desc: "Calories and macros with daily and weekly targets." },
  { icon: Dumbbell, title: "Workouts", desc: "Log sets, reps, and weight with automatic PR tracking." },
  { icon: CheckCircle2, title: "Habits", desc: "Water, sleep, prayer, reading — with streaks." },
  { icon: Camera, title: "Progress Photos", desc: "Front, side, and back views on a visual timeline." },
  { icon: Sparkles, title: "AI Coach", desc: "Weekly reviews and recommendations tuned to your data." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-5 w-5" />
          </div>
          {APP_NAME}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container flex flex-col items-center py-20 text-center md:py-28">
          <span className="mb-4 rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            Lose fat with a system, not guesswork
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">
            Your personal{" "}
            <span className="text-primary">fat loss operating system</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Track weight, nutrition, workouts, and habits in one place. Get
            AI-powered weekly coaching that adapts to your real data.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="container grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. Built for results.
      </footer>
    </div>
  );
}
