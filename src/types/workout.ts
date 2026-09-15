export interface Workout {
  id: number;
  exercise: string;
  category: string;
  sets: number;
  reps: number;
  weight: number;
  date: string;
  completed: boolean;
  photo?: string;
  icon?: string;
}
