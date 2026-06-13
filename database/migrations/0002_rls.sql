-- =============================================================================
-- Fat Loss OS — Row Level Security
-- Migration: 0002_rls.sql
-- =============================================================================
-- Every table is locked to the owning user. Child tables (exercise_logs,
-- habit_logs) are scoped through their parent's user_id.
-- =============================================================================

alter table public.users           enable row level security;
alter table public.goals           enable row level security;
alter table public.weight_logs     enable row level security;
alter table public.nutrition_logs  enable row level security;
alter table public.workouts        enable row level security;
alter table public.exercise_logs   enable row level security;
alter table public.habits          enable row level security;
alter table public.habit_logs      enable row level security;
alter table public.progress_photos enable row level security;
alter table public.ai_reports      enable row level security;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- Helper macro pattern: owned-by-user tables
-- -----------------------------------------------------------------------------
-- goals
drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- weight_logs
drop policy if exists "weight_logs_all_own" on public.weight_logs;
create policy "weight_logs_all_own" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- nutrition_logs
drop policy if exists "nutrition_logs_all_own" on public.nutrition_logs;
create policy "nutrition_logs_all_own" on public.nutrition_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- workouts
drop policy if exists "workouts_all_own" on public.workouts;
create policy "workouts_all_own" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- habits
drop policy if exists "habits_all_own" on public.habits;
create policy "habits_all_own" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- progress_photos
drop policy if exists "progress_photos_all_own" on public.progress_photos;
create policy "progress_photos_all_own" on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ai_reports
drop policy if exists "ai_reports_all_own" on public.ai_reports;
create policy "ai_reports_all_own" on public.ai_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- exercise_logs — scoped through parent workout
-- -----------------------------------------------------------------------------
drop policy if exists "exercise_logs_all_own" on public.exercise_logs;
create policy "exercise_logs_all_own" on public.exercise_logs
  for all
  using (
    exists (
      select 1 from public.workouts w
      where w.id = exercise_logs.workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = exercise_logs.workout_id and w.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- habit_logs — scoped through parent habit
-- -----------------------------------------------------------------------------
drop policy if exists "habit_logs_all_own" on public.habit_logs;
create policy "habit_logs_all_own" on public.habit_logs
  for all
  using (
    exists (
      select 1 from public.habits h
      where h.id = habit_logs.habit_id and h.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.habits h
      where h.id = habit_logs.habit_id and h.user_id = auth.uid()
    )
  );
