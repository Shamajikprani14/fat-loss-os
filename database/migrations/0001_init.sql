-- =============================================================================
-- Fat Loss OS — Initial schema
-- Migration: 0001_init.sql
-- =============================================================================
-- All user-owned tables reference auth.users(id). `users` here is the public
-- profile table that mirrors the authenticated user.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'gender_type') then
    create type gender_type as enum ('male', 'female', 'other', 'prefer_not_to_say');
  end if;
  if not exists (select 1 from pg_type where typname = 'activity_level_type') then
    create type activity_level_type as enum (
      'sedentary', 'light', 'moderate', 'active', 'very_active'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'photo_type') then
    create type photo_type as enum ('front', 'side', 'back');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- users (public profile, 1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  name          text,
  height_cm     numeric(5, 2),
  date_of_birth date,
  gender        gender_type,
  activity_level activity_level_type default 'moderate',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- goals
-- -----------------------------------------------------------------------------
create table if not exists public.goals (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  starting_weight numeric(6, 2) not null,
  current_weight  numeric(6, 2) not null,
  goal_weight     numeric(6, 2) not null,
  weekly_target   numeric(4, 2) not null default 0.5,
  target_calories integer not null default 2000,
  target_protein  integer not null default 150,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_goals_user_id on public.goals(user_id);

-- -----------------------------------------------------------------------------
-- weight_logs
-- -----------------------------------------------------------------------------
create table if not exists public.weight_logs (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references public.users(id) on delete cascade,
  weight    numeric(6, 2) not null,
  waist_cm  numeric(5, 2),
  notes     text,
  logged_at timestamptz not null default now()
);
create index if not exists idx_weight_logs_user_logged on public.weight_logs(user_id, logged_at desc);

-- -----------------------------------------------------------------------------
-- nutrition_logs
-- -----------------------------------------------------------------------------
create table if not exists public.nutrition_logs (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references public.users(id) on delete cascade,
  meal_name text not null,
  calories  integer not null default 0,
  protein   numeric(6, 2) not null default 0,
  carbs     numeric(6, 2) not null default 0,
  fat       numeric(6, 2) not null default 0,
  logged_at timestamptz not null default now()
);
create index if not exists idx_nutrition_logs_user_logged on public.nutrition_logs(user_id, logged_at desc);

-- -----------------------------------------------------------------------------
-- workouts
-- -----------------------------------------------------------------------------
create table if not exists public.workouts (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  workout_name     text not null,
  duration_minutes integer,
  notes            text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_workouts_user_created on public.workouts(user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- exercise_logs
-- -----------------------------------------------------------------------------
create table if not exists public.exercise_logs (
  id            uuid primary key default uuid_generate_v4(),
  workout_id    uuid not null references public.workouts(id) on delete cascade,
  exercise_name text not null,
  sets          integer not null default 0,
  reps          integer not null default 0,
  weight        numeric(6, 2) not null default 0
);
create index if not exists idx_exercise_logs_workout on public.exercise_logs(workout_id);

-- -----------------------------------------------------------------------------
-- habits
-- -----------------------------------------------------------------------------
create table if not exists public.habits (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  habit_name text not null,
  target     numeric(8, 2) not null default 1,
  unit       text,
  created_at timestamptz not null default now()
);
create index if not exists idx_habits_user on public.habits(user_id);

-- -----------------------------------------------------------------------------
-- habit_logs
-- -----------------------------------------------------------------------------
create table if not exists public.habit_logs (
  id        uuid primary key default uuid_generate_v4(),
  habit_id  uuid not null references public.habits(id) on delete cascade,
  value     numeric(8, 2) not null default 0,
  logged_at timestamptz not null default now()
);
create index if not exists idx_habit_logs_habit_logged on public.habit_logs(habit_id, logged_at desc);

-- -----------------------------------------------------------------------------
-- progress_photos
-- -----------------------------------------------------------------------------
create table if not exists public.progress_photos (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  image_url   text not null,
  storage_path text,
  photo_type  photo_type not null default 'front',
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_progress_photos_user on public.progress_photos(user_id, uploaded_at desc);

-- -----------------------------------------------------------------------------
-- ai_reports
-- -----------------------------------------------------------------------------
create table if not exists public.ai_reports (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  report     text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ai_reports_user_created on public.ai_reports(user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
  before update on public.goals
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- Auto-provision a public.users row + default habits on signup
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.habits (user_id, habit_name, target, unit)
  values
    (new.id, 'Water', 8, 'glasses'),
    (new.id, 'Sleep', 8, 'hours'),
    (new.id, 'Workout', 1, 'session'),
    (new.id, 'Prayer', 5, 'times'),
    (new.id, 'Reading', 20, 'minutes');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
