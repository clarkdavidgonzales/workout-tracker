export interface Workout {
  id: string | number;
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
