export interface Workout {
  id: string | number;
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  date: string;
  completed: boolean;
  photo?: string;
  icon?: string;
}

export interface UserProfile {
  displayName: string;
  email: string;
  avatar?: string;
  sex: 'female' | 'male' | 'other';
  age: number;
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'high';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  availableMinutes: 30 | 45 | 60 | 90;
  busyDays: string[];
  targetMuscleGroups: string[];
}
