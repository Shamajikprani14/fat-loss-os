# Deployment Guide

This guide covers provisioning **Supabase** (database, auth, storage) and deploying to **Vercel**.

---

## 1. Supabase Setup

### 1.1 Create the project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Note the **Project URL** and **anon** + **service_role** keys under **Project Settings → API**.

### 1.2 Apply the schema

Open **SQL Editor** and run, in order:

1. `database/migrations/0001_init.sql` — tables, enums, triggers, auto-provisioning of the profile row + default habits on signup.
2. `database/migrations/0002_rls.sql` — Row Level Security policies.
3. `database/migrations/0003_storage.sql` — the `progress-photos` storage bucket and per-user policies.

> Using the CLI instead?
>
> ```bash
> npm i -g supabase
> supabase link --project-ref <your-ref>
> supabase db push   # if you convert these into supabase/migrations
> ```

### 1.3 Auth configuration

Under **Authentication → URL Configuration**:

- **Site URL**: `https://your-domain.com` (or `http://localhost:3000` for dev).
- **Redirect URLs**: add `https://your-domain.com/auth/callback` and `http://localhost:3000/auth/callback`.

Under **Authentication → Providers**: keep **Email** enabled. For production, configure SMTP under **Project Settings → Auth** so confirmation and reset emails send reliably.

### 1.4 Storage

`0003_storage.sql` already creates a private `progress-photos` bucket with policies that restrict each user to their own `${uid}/` folder. No manual steps needed.

---

## 2. Vercel Deployment

### 2.1 Import

1. Push this repo to GitHub.
2. <https://vercel.com/new> → import the repo. Vercel auto-detects Next.js.

### 2.2 Environment variables

Add these under **Project → Settings → Environment Variables** (Production + Preview):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>     # mark as sensitive
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=progress-photos
OPENAI_API_KEY=<openai key>                       # optional
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2.3 Deploy

- Click **Deploy**. Vercel runs `next build` and ships it.
- Alternatively, the included `.github/workflows/deploy.yml` deploys on push to `main` — add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as GitHub secrets.

### 2.4 Post-deploy checklist

- [ ] Sign up creates a `users` row + 5 default habits (verify in Supabase → Table editor).
- [ ] `NEXT_PUBLIC_SITE_URL` matches the deployed domain (auth redirects depend on it).
- [ ] Supabase **Redirect URLs** include the production `/auth/callback`.
- [ ] Upload a progress photo and confirm it lands under `progress-photos/<uid>/`.

---

## 3. Docker (self-host)

```bash
cp .env.example .env   # fill values
docker compose up --build
```

The image uses Next.js standalone output and runs as a non-root user on port `3000`. Public Supabase envs are passed as build args (see `docker-compose.yml`); server-only secrets are read at runtime from `.env`.

---

## 4. Local development with Supabase CLI (optional)

```bash
supabase start                       # local Postgres + Auth + Storage
# apply the SQL in database/migrations to the local db
supabase status                      # copy the local URL + anon key into .env
npm run dev
```

---

## Troubleshooting

| Symptom                              | Fix                                                                 |
| ------------------------------------ | ------------------------------------------------------------------- |
| Redirected to `/login` in a loop     | Check `NEXT_PUBLIC_SUPABASE_*` envs and that cookies aren't blocked. |
| Auth email link 404s                 | Add `/auth/callback` to Supabase Redirect URLs.                     |
| "row violates RLS policy" on insert  | Confirm you're authenticated; `user_id` must equal `auth.uid()`.    |
| Photos upload but don't display      | Confirm the bucket name env matches and the image domain in `next.config.ts`. |
| AI review shows fallback text        | `OPENAI_API_KEY` is unset or invalid — set it in env.               |
