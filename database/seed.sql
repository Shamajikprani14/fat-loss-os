-- =============================================================================
-- Fat Loss OS — Optional dev seed data
-- =============================================================================
-- Run AFTER creating a test user via Supabase Auth. Replace :user_id below
-- with the auth user's UUID before running.
--   psql ... -v user_id="'00000000-0000-0000-0000-000000000000'" -f seed.sql
-- =============================================================================

\set uid :user_id

insert into public.goals (user_id, starting_weight, current_weight, goal_weight, weekly_target, target_calories, target_protein)
values (:uid, 95.0, 90.0, 78.0, 0.5, 2100, 170);

insert into public.weight_logs (user_id, weight, waist_cm, logged_at) values
  (:uid, 95.0, 98, now() - interval '28 days'),
  (:uid, 93.8, 97, now() - interval '21 days'),
  (:uid, 92.5, 96, now() - interval '14 days'),
  (:uid, 91.2, 95, now() - interval '7 days'),
  (:uid, 90.0, 94, now());

insert into public.nutrition_logs (user_id, meal_name, calories, protein, carbs, fat, logged_at) values
  (:uid, 'Greek yogurt + berries', 320, 28, 30, 9, now()),
  (:uid, 'Chicken & rice bowl', 620, 52, 65, 14, now()),
  (:uid, 'Whey shake', 180, 30, 6, 2, now());

with w as (
  insert into public.workouts (user_id, workout_name, duration_minutes, notes)
  values (:uid, 'Push Day', 55, 'Felt strong')
  returning id
)
insert into public.exercise_logs (workout_id, exercise_name, sets, reps, weight)
select id, 'Bench Press', 4, 8, 80 from w
union all select id, 'Overhead Press', 3, 10, 45 from w;
