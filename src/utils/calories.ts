import type { UserProfile, Workout } from '../types/workout';

const activityMultipliers: Record<UserProfile['activityLevel'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
};

const metByCategory: Record<string, number> = {
  Cardio: 8,
  Legs: 6,
  'Full Body': 7,
  Back: 5,
  Chest: 5,
  Shoulders: 5,
  Arms: 4,
  Core: 4,
};

export const estimateWorkoutCalories = (workout: Workout, profile: UserProfile) => {
  const met = metByCategory[workout.category] ?? 5;
  return Math.round((met * 3.5 * profile.weight * workout.duration) / 200);
};

export const estimateDailyCalories = (workouts: Workout[], profile: UserProfile) =>
  workouts
    .filter((workout) => workout.completed)
    .reduce((total, workout) => total + estimateWorkoutCalories(workout, profile), 0);

export const estimateMaintenanceCalories = (profile: UserProfile) => {
  const sexAdjustment = profile.sex === 'male' ? 5 : profile.sex === 'female' ? -161 : -78;
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexAdjustment;
  return Math.round(bmr * activityMultipliers[profile.activityLevel]);
};