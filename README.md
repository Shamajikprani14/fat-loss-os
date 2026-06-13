# Fat Loss OS

Your personal **fat loss operating system** — track weight, nutrition, workouts, and habits, monitor progress with photos, and get AI-powered weekly coaching. Mobile-first, dark-mode ready, production-grade.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![TS](https://img.shields.io/badge/TypeScript-strict-blue) ![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3FCF8E)

## Features

- **Auth** — email/password sign up, login, logout, forgot/reset password (Supabase Auth) with protected routes via middleware.
- **Dashboard** — current/goal weight, total lost, weekly change, calories & protein remaining, weight-trend + weekly-average charts, and today's habits / recent workouts / nutrition widgets.
- **Weight** — add/edit/delete entries, daily graph, weekly average, monthly trend (linear regression slope).
- **Nutrition** — meals with calories/protein/carbs/fat, daily targets with progress bars, weekly average calories.
- **Workouts** — create/edit/delete with dynamic exercise rows (sets/reps/weight) and automatic PR tracking (estimated 1RM, Epley).
- **Habits** — default Water / Sleep / Workout / Prayer / Reading plus custom habits, one-tap logging, and streak calculations.
- **Progress Photos** — front/side/back uploads to Supabase Storage with a timeline.
- **AI Coach** — weekly review analyzing weight trend, workout consistency, habit completion, and nutrition adherence (OpenAI, with a deterministic fallback).

## Tech Stack

| Layer       | Choice                                            |
| ----------- | ------------------------------------------------- |
| Framework   | Next.js 15 (App Router, Server Actions)           |
| Language    | TypeScript (strict, `noUncheckedIndexedAccess`)   |
| UI          | Tailwind CSS + shadcn/ui + Recharts + lucide      |
| Backend     | Next.js Route Handlers & Server Actions           |
| Database    | PostgreSQL via Supabase (with RLS)                |
| Auth        | Supabase Auth (`@supabase/ssr`)                   |
| Validation  | Zod + React Hook Form                             |
| AI          | OpenAI SDK                                         |
| Deploy      | Vercel · Docker                                   |

## Project Structure

```
src/
  app/
    (auth)/            login, signup, forgot-password, reset-password
    (dashboard)/       dashboard, weight, nutrition, workouts, habits, progress, coach, profile
    api/ai/weekly-review/  AI review route handler
    auth/callback/     OAuth/email confirmation exchange
  actions/             server actions (auth, weight, nutrition, workout, habit, profile, progress, coach)
  components/
    ui/                shadcn/ui primitives
    dashboard/         charts, stat cards, module managers
    forms/, providers/
  hooks/               client hooks
  lib/
    supabase/          client, server, admin, middleware
    validations/       Zod schemas
    auth.ts, utils.ts, constants.ts
  services/            calculations.ts, ai-coach.ts
  types/               database + app types
database/
  migrations/          0001_init.sql, 0002_rls.sql, 0003_storage.sql
  seed.sql
```

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env       # fill in Supabase + OpenAI values

# 3. Apply database migrations (see DEPLOYMENT.md → Supabase)
#    Run database/migrations/*.sql in order via the Supabase SQL editor or CLI.

# 4. Run
npm run dev                # http://localhost:3000
```

### Required environment variables

| Variable                              | Where        | Notes                              |
| ------------------------------------- | ------------ | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | client/server| Project URL                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | client/server| Public anon key                    |
| `SUPABASE_SERVICE_ROLE_KEY`           | server only  | Bypasses RLS — never expose        |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | client/server| Defaults to `progress-photos`      |
| `OPENAI_API_KEY`                      | server only  | Optional; falls back if unset      |
| `OPENAI_MODEL`                        | server only  | Defaults to `gpt-4o-mini`          |
| `NEXT_PUBLIC_SITE_URL`                | client/server| Used in auth redirect URLs         |

## Scripts

```bash
npm run dev           # start dev server
npm run build         # production build
npm run start         # serve production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier write
```

## Security

- **Row Level Security** on every table; child tables (`exercise_logs`, `habit_logs`) are scoped through their parent's `user_id`.
- **User-ownership validation** in every server action (`.eq("user_id", user.id)`) as defense-in-depth alongside RLS.
- **Zod validation** on all inputs before they reach the database.
- **Storage** is a private bucket with per-user folder policies.
- The **service-role key** is only ever imported server-side (`src/lib/supabase/admin.ts`).

## Docker

```bash
docker compose up --build      # builds and serves on :3000
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step Vercel + Supabase setup.

## License

MIT
