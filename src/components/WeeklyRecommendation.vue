<template>
  <section class="recommendation-panel">
    <div class="recommendation-heading">
      <div>
        <p class="section-kicker">SMART STARTER PLAN</p>
        <h2>{{ mode === 'bulk' ? 'Lean bulk week' : 'Cutting week' }}</h2>
        <p>Adjust your criteria in Settings to personalize this plan.</p>
        <p>{{ experienceLabel }} level · profile-based recommendations</p>
      </div>
      <div class="goal-toggle" role="group" aria-label="Recommendation goal">
        <button type="button" :class="{ active: mode === 'bulk' }" @click="mode = 'bulk'">Bulk</button>
        <button type="button" :class="{ active: mode === 'cut' }" @click="mode = 'cut'">Cut</button>
      </div>
    </div>

    <div class="split-selector">
      <span>Training split</span>
      <div class="split-options" role="group" aria-label="Training split">
        <button v-for="option in splitOptions" :key="option.value" type="button" :class="{ active: split === option.value }" @click="split = option.value">
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="split-selector frequency-selector">
      <span>Days per week</span>
      <div class="split-options" role="group" aria-label="Training days per week">
        <button v-for="days in trainingDayOptions" :key="days" type="button" :class="{ active: trainingDays === days }" @click="trainingDays = days">
          {{ days }} days
        </button>
      </div>
    </div>

    <div class="recommendation-targets">
      <div><strong>{{ calorieTarget.toLocaleString() }}</strong><span>target kcal/day</span></div>
      <div><strong>{{ proteinTarget }}g</strong><span>protein/day</span></div>
      <div><strong>{{ trainingDays }}</strong><span>training days</span></div>
    </div>

    <div class="goal-progress" :class="goalProgress.status">
      <strong>{{ goalProgress.title }}</strong>
      <span>{{ goalProgress.detail }}</span>
    </div>

    <div class="recommendation-options">
      <div class="option-heading"><span>Muscle groups for this plan</span><small>Selected groups are included</small></div>
      <div class="coverage-summary"><button v-for="group in muscleGroups" :key="group" type="button" :class="{ selected: criteria.targetMuscleGroups.includes(group), covered: coveredMuscles.includes(group) }" @click="toggleMuscleGroup(group)">{{ group }}</button></div>
      <div class="option-heading busy-heading"><span>Busy days</span><small>Recommendations avoid these days</small></div>
      <div class="busy-day-options"><button v-for="day in weekDays" :key="day" type="button" :class="{ active: criteria.busyDays.includes(day) }" @click="toggleBusyDay(day)">{{ day }}</button></div>
      <button type="button" class="criteria-save" @click="saveRecommendationOptions">Save recommendation options</button>
    </div>

    <div class="recommendation-days">
      <div v-for="day in variedPlan" :key="day.day" class="recommendation-day">
        <div><strong>{{ day.day }}</strong><span>{{ day.focus }}</span></div>
        <p>{{ day.exercises.map((exercise) => `${exercise} (${exerciseLoad(exercise)} kg)`).join(' · ') }}</p>
        <small v-if="day.exerciseMinutes">{{ day.duration }} min total · {{ day.exerciseMinutes }} min each · {{ day.recoveryMinutes }} min recovery between exercises</small>
      </div>
    </div>
    <div class="use-plan-row">
      <div>
        <strong>Ready to train?</strong>
        <span>Add {{ recommendedWorkouts.length }} planned session{{ recommendedWorkouts.length === 1 ? '' : 's' }} to this week.</span>
      </div>
      <button type="button" class="use-plan-button" @click="usePlan">Add plan to week</button>
    </div>
    <p class="recommendation-note">Starting estimate only. Adjust based on weekly progress, recovery, and advice from a qualified professional.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { UserProfile } from '../types/workout';
import { estimateMaintenanceCalories } from '../utils/calories';

const props = defineProps<{
  profile: UserProfile;
  selectedDate: string;
  bodyWeight?: number;
  bodyWeightSource?: string;
  bodyWeightEntries?: Record<string, { date: string; weight: number }>;
}>();
const emit = defineEmits<{
  usePlan: [workouts: Array<{ exercise: string; category: string; sets: number; reps: number; weight: number; duration: number; date: string; icon: string }>];
  saveCriteria: [profile: UserProfile];
}>();
const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Calves'] as const;
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const criteria = reactive({
  busyDays: [...(props.profile.busyDays ?? [])],
  targetMuscleGroups: [...(props.profile.targetMuscleGroups ?? muscleGroups)],
});
watch(() => props.profile, (profile) => {
  criteria.busyDays = [...(profile.busyDays ?? [])];
  criteria.targetMuscleGroups = [...(profile.targetMuscleGroups ?? muscleGroups)];
}, { deep: true });
const toggleBusyDay = (day: string) => {
  criteria.busyDays = criteria.busyDays.includes(day) ? criteria.busyDays.filter((item) => item !== day) : [...criteria.busyDays, day];
};
const toggleMuscleGroup = (group: string) => {
  if (criteria.targetMuscleGroups.includes(group)) {
    if (criteria.targetMuscleGroups.length > 1) criteria.targetMuscleGroups = criteria.targetMuscleGroups.filter((item) => item !== group);
  } else {
    criteria.targetMuscleGroups = [...criteria.targetMuscleGroups, group];
  }
};
const saveRecommendationOptions = () => emit('saveCriteria', { ...props.profile, busyDays: [...criteria.busyDays], targetMuscleGroups: [...criteria.targetMuscleGroups] });
const mode = ref<'bulk' | 'cut'>('bulk');
const split = ref<'bro' | 'full' | 'upperLower'>('upperLower');
const trainingDays = ref(4);
const trainingDayOptions = [3, 4, 5];
const weekStart = computed(() => {
  const date = new Date(`${props.selectedDate}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
});
const weekNumber = computed(() => Math.floor(weekStart.value.getTime() / 604800000));
const splitOptions = [
  { value: 'upperLower' as const, label: 'Upper / Lower' },
  { value: 'full' as const, label: 'Full body' },
  { value: 'bro' as const, label: 'Bro split' },
];
const maintenanceCalories = computed(() => estimateMaintenanceCalories(props.profile));
const recommendationWeight = computed(() => props.bodyWeight ?? props.profile.weight);
const bodyWeightSource = computed(() => props.bodyWeightSource ?? 'from profile criteria');
const recommendationProfile = computed(() => ({ ...props.profile, weight: recommendationWeight.value }));
const adjustedMaintenanceCalories = computed(() => estimateMaintenanceCalories(recommendationProfile.value));
const calorieTarget = computed(() => Math.round(adjustedMaintenanceCalories.value * (mode.value === 'bulk' ? 1.1 : 0.85)));
const proteinTarget = computed(() => Math.round(recommendationWeight.value * (mode.value === 'bulk' ? 1.8 : 2)));
const goalProgress = computed(() => {
  const entries = Object.values(props.bodyWeightEntries ?? {}).sort((a, b) => a.date.localeCompare(b.date));
  if (entries.length < 2) return { status: 'neutral', title: 'Log more measurements', detail: 'Add at least two daily weights to estimate your Bulk/Cut trend.' };
  const recent = entries.slice(-2);
  const change = recent[1].weight - recent[0].weight;
  const weeklyRate = Math.abs(change) * 7 / Math.max(1, Math.round((new Date(`${recent[1].date}T00:00:00`).getTime() - new Date(`${recent[0].date}T00:00:00`).getTime()) / 86400000));
  const targetMin = recommendationWeight.value * (mode.value === 'bulk' ? 0.0025 : 0.005);
  const targetMax = recommendationWeight.value * (mode.value === 'bulk' ? 0.005 : 0.01);
  const movingCorrectly = mode.value === 'bulk' ? change > 0 : change < 0;
  const onTrack = movingCorrectly && weeklyRate >= targetMin && weeklyRate <= targetMax;
  if (onTrack) return { status: 'on-track', title: `${mode.value === 'bulk' ? 'Bulk' : 'Cut'} is on track`, detail: `${change > 0 ? '+' : ''}${change.toFixed(1)} kg since ${recent[0].date}. Keep your current target.` };
  if (!movingCorrectly) return { status: 'adjust', title: `${mode.value === 'bulk' ? 'Bulk' : 'Cut'} needs adjustment`, detail: mode.value === 'bulk' ? 'Weight is not increasing yet. Consider adding 100-200 kcal/day.' : 'Weight is not decreasing yet. Consider reducing 100-200 kcal/day.' };
  return { status: 'neutral', title: 'Progress is being monitored', detail: `${change > 0 ? '+' : ''}${change.toFixed(1)} kg change. Keep logging daily measurements.` };
});
const experienceLevel = computed(() => props.profile.experienceLevel);
const experienceLabel = computed(() => experienceLevel.value.charAt(0).toUpperCase() + experienceLevel.value.slice(1));
const availableMinutes = computed(() => Number(props.profile.availableMinutes) || 45);
const exerciseLoad = (exercise: string) => {
  const name = exercise.toLowerCase();
  const isolation = ['raise', 'curl', 'fly', 'pushdown', 'extension', 'plank', 'stretch', 'mobility'].some((word) => name.includes(word));
  const cardio = ['walking', 'cycling', 'rowing', 'run', 'cardio', 'conditioning'].some((word) => name.includes(word));
  if (cardio) return 0;
  const levelFactor = experienceLevel.value === 'advanced' ? 0.5 : experienceLevel.value === 'intermediate' ? 0.35 : 0.2;
  const exerciseFactor = isolation ? 0.35 : 0.75;
  return Math.max(0, Math.round(recommendationWeight.value * levelFactor * exerciseFactor));
};
const muscleGroupForExercise = (exercise: string): typeof muscleGroups[number] | '' => {
  const name = exercise.toLowerCase();
  if (['bench', 'push-up', 'incline', 'chest', 'fly'].some((word) => name.includes(word))) return 'Chest';
  if (['row', 'pulldown', 'deadlift', 'back extension'].some((word) => name.includes(word))) return 'Back';
  if (['press', 'lateral', 'face pull'].some((word) => name.includes(word))) return 'Shoulders';
  if (['curl', 'tricep', 'skull'].some((word) => name.includes(word))) return 'Arms';
  if (['squat', 'leg press', 'leg curl', 'lunge', 'extension'].some((word) => name.includes(word))) return 'Legs';
  if (['hip thrust', 'glute', 'romanian'].some((word) => name.includes(word))) return 'Glutes';
  if (['plank', 'core', 'crunch', 'knee raise'].some((word) => name.includes(word))) return 'Core';
  if (name.includes('calf')) return 'Calves';
  return '';
};

const basePlan = computed(() => {
  if (split.value === 'full') return [
    { day: 'Mon', focus: 'Full body A', exercises: ['Squat', 'Bench Press', 'Barbell Row'] },
    { day: 'Tue', focus: 'Recovery', exercises: ['Walking', 'Mobility', 'Light Core'] },
    { day: 'Wed', focus: 'Full body B', exercises: ['Deadlift', 'Overhead Press', 'Lat Pulldown'] },
    { day: 'Thu', focus: 'Recovery', exercises: ['Stretching', 'Walking', 'Breathing'] },
    { day: 'Fri', focus: 'Full body C', exercises: ['Leg Press', 'Incline Press', 'Cable Row', 'Bicep Curls'] },
    { day: 'Sat', focus: 'Conditioning', exercises: ['Cycling', 'Plank', 'Mobility'] },
    { day: 'Sun', focus: 'Rest', exercises: ['Rest and recover'] },
  ];
  if (split.value === 'bro') return mode.value === 'bulk' ? [
    { day: 'Mon', focus: 'Chest', exercises: ['Bench Press', 'Incline Press', 'Chest Fly'] },
    { day: 'Tue', focus: 'Back', exercises: ['Deadlift', 'Lat Pulldown', 'Barbell Row'] },
    { day: 'Wed', focus: 'Shoulders', exercises: ['Overhead Press', 'Lateral Raises', 'Face Pulls'] },
    { day: 'Thu', focus: 'Legs', exercises: ['Back Squat', 'Leg Press', 'Calf Raises'] },
    { day: 'Fri', focus: 'Arms', exercises: ['Bicep Curls', 'Skull Crushers', 'Hammer Curls'] },
    { day: 'Sat', focus: 'Recovery', exercises: ['Walking', 'Mobility', 'Stretching'] },
    { day: 'Sun', focus: 'Rest', exercises: ['Rest and recover'] },
  ] : [
    { day: 'Mon', focus: 'Chest', exercises: ['Bench Press', 'Push-ups', 'Chest Fly'] },
    { day: 'Tue', focus: 'Back', exercises: ['Lat Pulldown', 'Cable Row', 'Back Extension'] },
    { day: 'Wed', focus: 'Shoulders', exercises: ['Overhead Press', 'Lateral Raises', 'Face Pulls'] },
    { day: 'Thu', focus: 'Legs', exercises: ['Squat', 'Walking Lunges', 'Calf Raises'] },
    { day: 'Fri', focus: 'Arms and core', exercises: ['Tricep Pushdown', 'Bicep Curls', 'Plank'] },
    { day: 'Sat', focus: 'Cardio', exercises: ['Incline Walk', 'Cycling', 'Mobility'] },
    { day: 'Sun', focus: 'Rest', exercises: ['Rest and recover'] },
  ];
  return mode.value === 'bulk' ? [
  { day: 'Mon', focus: 'Push strength', exercises: ['Bench Press', 'Overhead Press', 'Lateral Raises'] },
  { day: 'Tue', focus: 'Pull strength', exercises: ['Barbell Row', 'Lat Pulldown', 'Bicep Curls'] },
  { day: 'Wed', focus: 'Recovery', exercises: ['Walking', 'Mobility', 'Light Core'] },
  { day: 'Thu', focus: 'Leg strength', exercises: ['Back Squat', 'Romanian Deadlift', 'Calf Raises'] },
  { day: 'Fri', focus: 'Upper volume', exercises: ['Incline Press', 'Seated Cable Row', 'Tricep Pushdown'] },
  { day: 'Sat', focus: 'Conditioning', exercises: ['Cycling', 'Plank', 'Stretching'] },
  { day: 'Sun', focus: 'Rest', exercises: ['Rest and recover'] },
] : [
  { day: 'Mon', focus: 'Upper strength', exercises: ['Bench Press', 'Barbell Row', 'Overhead Press'] },
  { day: 'Tue', focus: 'Low impact cardio', exercises: ['Incline Walk', 'Core Circuit', 'Mobility'] },
  { day: 'Wed', focus: 'Lower strength', exercises: ['Back Squat', 'Hip Thrust', 'Leg Curl'] },
  { day: 'Thu', focus: 'Recovery', exercises: ['Walking', 'Stretching', 'Light Core'] },
  { day: 'Fri', focus: 'Full body', exercises: ['Deadlift', 'Push-ups', 'Lat Pulldown'] },
  { day: 'Sat', focus: 'Cardio', exercises: ['Cycling', 'Rowing', 'Mobility'] },
  { day: 'Sun', focus: 'Rest', exercises: ['Rest and recover'] },
  ];
});

const plan = computed(() => {
  const trainingEntries = basePlan.value.filter((day) => day.focus !== 'Rest');
  const availableEntries = trainingEntries.filter((day) => !criteria.busyDays.includes(day.day));
  const selectedDays = new Set(availableEntries.slice(0, trainingDays.value).map((day) => day.day));
  return basePlan.value.map((day) => {
    if (selectedDays.has(day.day)) {
      if (day.focus !== 'Recovery') return day;
      return {
        day: day.day,
        focus: 'Accessory training',
        exercises: mode.value === 'bulk' ? ['Cable Row', 'Lateral Raises', 'Bicep Curls'] : ['Push-ups', 'Cable Row', 'Plank'],
      };
    }
    return day.day === 'Sun'
      ? { day: day.day, focus: 'Rest', exercises: ['Rest and recover'] }
      : { day: day.day, focus: 'Recovery', exercises: ['Walking', 'Mobility', 'Stretching'] };
  });
});

const balancedPlan = computed(() => {
  const days = plan.value.map((day) => ({ ...day, exercises: [...day.exercises] }));
  days.forEach((day) => {
    day.exercises = day.exercises.filter((exercise) => {
      const group = muscleGroupForExercise(exercise);
      return !group || criteria.targetMuscleGroups.includes(group);
    });
  });
  const trainingDaysInPlan = days.filter((day) => !['Recovery', 'Rest'].includes(day.focus));
  const requiredExercises: Record<typeof muscleGroups[number], string> = {
    Chest: 'Bench Press',
    Back: 'Lat Pulldown',
    Shoulders: 'Overhead Press',
    Arms: 'Bicep Curls',
    Legs: 'Back Squat',
    Glutes: 'Hip Thrust',
    Core: 'Plank',
    Calves: 'Calf Raises',
  };
  const existingGroups = new Set(days.flatMap((day) => day.exercises.map(muscleGroupForExercise)));
  const missingGroups = muscleGroups.filter((group) => criteria.targetMuscleGroups.includes(group) && !existingGroups.has(group));
  missingGroups.forEach((group, index) => {
    const targetDay = trainingDaysInPlan[index % Math.max(trainingDaysInPlan.length, 1)];
    if (targetDay && !targetDay.exercises.includes(requiredExercises[group])) targetDay.exercises.push(requiredExercises[group]);
  });
  return days;
});

const variedPlan = computed(() => balancedPlan.value.map((day, index) => {
  if (day.focus === 'Recovery' || day.focus === 'Rest') return { ...day, duration: 20, load: 0, exerciseMinutes: 10, recoveryMinutes: 0 };
  const shift = (weekNumber.value + index) % day.exercises.length;
  const loadFactor = experienceLevel.value === 'advanced' ? 0.5 : experienceLevel.value === 'intermediate' ? 0.35 : 0.2;
  const recoveryMinutes = 2;
  const exerciseMinutes = Math.max(5, Math.floor((availableMinutes.value - recoveryMinutes * (day.exercises.length - 1)) / day.exercises.length));
  return {
    ...day,
    exercises: [...day.exercises.slice(shift), ...day.exercises.slice(0, shift)],
    duration: availableMinutes.value,
    exerciseMinutes,
    recoveryMinutes,
    load: Math.max(0, Math.round(recommendationWeight.value * loadFactor)),
  };
}));
const coveredMuscles = computed(() => Array.from(new Set(variedPlan.value.flatMap((day) => day.exercises.map(muscleGroupForExercise)))));

const recommendedWorkouts = computed(() => variedPlan.value
    .filter((day) => !['Recovery', 'Rest'].includes(day.focus))
    .flatMap((day) => {
      const date = new Date(weekStart.value);
      date.setDate(date.getDate() + ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(day.day));
      return day.exercises.map((exercise) => ({
          exercise,
          category: day.focus.split(' ')[0],
          sets: 3,
          reps: mode.value === 'bulk' ? 8 : 12,
          weight: exerciseLoad(exercise),
          duration: day.exerciseMinutes,
          date: date.toISOString().slice(0, 10),
          icon: 'barbell',
        }));
    }));

const usePlan = () => {
  const confirmed = window.confirm(`Add ${recommendedWorkouts.value.length} recommended sessions to this week?`);
  if (confirmed) emit('usePlan', recommendedWorkouts.value);
};
</script>