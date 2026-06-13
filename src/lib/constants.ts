import type { ActivityLevel, Gender } from "@/types/database";

export const APP_NAME = "Fat Loss OS";

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; factor: number }[] = [
  { value: "sedentary", label: "Sedentary (little/no exercise)", factor: 1.2 },
  { value: "light", label: "Light (1–3 days/week)", factor: 1.375 },
  { value: "moderate", label: "Moderate (3–5 days/week)", factor: 1.55 },
  { value: "active", label: "Active (6–7 days/week)", factor: 1.725 },
  { value: "very_active", label: "Very Active (physical job/2x day)", factor: 1.9 },
];

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export const DEFAULT_HABITS = [
  { habit_name: "Water", target: 8, unit: "glasses" },
  { habit_name: "Sleep", target: 8, unit: "hours" },
  { habit_name: "Workout", target: 1, unit: "session" },
  { habit_name: "Prayer", target: 5, unit: "times" },
  { habit_name: "Reading", target: 20, unit: "minutes" },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/weight", label: "Weight", icon: "Scale" },
  { href: "/nutrition", label: "Nutrition", icon: "Utensils" },
  { href: "/workouts", label: "Workouts", icon: "Dumbbell" },
  { href: "/habits", label: "Habits", icon: "CheckCircle2" },
  { href: "/progress", label: "Progress", icon: "Camera" },
  { href: "/coach", label: "AI Coach", icon: "Sparkles" },
  { href: "/profile", label: "Profile", icon: "User" },
] as const;
