<template>
  <section class="history-panel">
    <div class="history-heading">
      <div>
        <p class="section-kicker">PROGRESS HISTORY</p>
        <h2>Last 8 weeks</h2>
      </div>
      <div class="history-total"><strong>{{ totalVolume.toLocaleString() }}</strong><span>kg completed volume</span></div>
    </div>

    <div class="history-grid">
      <div class="history-scale"><span>{{ maxVolume.toLocaleString() }}</span><span>0</span></div>
      <div class="history-bars">
        <div v-for="week in weeks" :key="week.key" class="history-column">
          <span class="history-value">{{ week.sessions || '' }}</span>
          <div class="history-track"><div class="history-fill" :style="{ height: `${week.height}%` }"></div></div>
          <strong>{{ week.label }}</strong>
          <small>{{ week.volume.toLocaleString() }} kg</small>
        </div>
      </div>
    </div>

    <div class="history-summary">
      <span><strong>{{ completedWorkouts }}</strong> completed sessions</span>
      <span><strong>{{ totalCalories.toLocaleString() }}</strong> estimated kcal</span>
      <span><strong>{{ averageVolume.toLocaleString() }}</strong> kg average/week</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UserProfile, Workout } from '../types/workout';
import { estimateDailyCalories } from '../utils/calories';

const props = defineProps<{ workouts: Workout[]; profile: UserProfile }>();
const dayMs = 86400000;

const toKey = (date: Date) => date.toISOString().slice(0, 10);
const currentWeekStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
};

const weeks = computed(() => {
  const current = currentWeekStart();
  const values = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(current);
    start.setDate(start.getDate() - (7 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const completed = props.workouts.filter((workout) => workout.completed && workout.date >= toKey(start) && workout.date < toKey(end));
    return {
      key: toKey(start),
      label: new Intl.DateTimeFormat('en', { month: 'short' }).format(start),
      volume: completed.reduce((total, workout) => total + workout.sets * workout.reps * workout.weight, 0),
      sessions: completed.length,
      calories: estimateDailyCalories(completed, props.profile),
    };
  });
  const maxVolume = Math.max(...values.map((week) => week.volume), 1);
  return values.map((week) => ({ ...week, height: week.volume ? Math.max((week.volume / maxVolume) * 100, 5) : 0 }));
});

const totalVolume = computed(() => weeks.value.reduce((total, week) => total + week.volume, 0));
const completedWorkouts = computed(() => weeks.value.reduce((total, week) => total + week.sessions, 0));
const totalCalories = computed(() => weeks.value.reduce((total, week) => total + week.calories, 0));
const averageVolume = computed(() => Math.round(totalVolume.value / 8));
const maxVolume = computed(() => Math.max(...weeks.value.map((week) => week.volume), 1));
</script>
