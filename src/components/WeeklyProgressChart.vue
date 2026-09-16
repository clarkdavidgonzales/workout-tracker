<template>
  <section class="progress-chart">
    <div class="chart-heading">
      <div>
        <p class="section-kicker">WEEKLY ENERGY</p>
        <h2>Estimated calories</h2>
      </div>
      <strong>{{ weeklyCalories.toLocaleString() }} <small>kcal</small></strong>
    </div>

    <div class="chart-area">
      <div class="chart-scale"><span>1k</span><span>500</span><span>0</span></div>
      <div class="chart-bars">
        <div v-for="day in days" :key="day.date" class="chart-column">
          <span class="bar-value" v-if="day.calories">{{ day.calories }}</span>
          <div class="bar-track">
            <div class="bar-fill" :class="{ active: day.date === selectedDate }" :style="{ height: `${day.height}%` }"></div>
          </div>
          <span class="bar-label">{{ day.label }}</span>
        </div>
      </div>
    </div>
    <p class="chart-note">Only completed workouts are included in this estimate.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UserProfile, Workout } from '../types/workout';
import { estimateDailyCalories } from '../utils/calories';

const props = defineProps<{ workouts: Workout[]; profile: UserProfile; selectedDate: string }>();

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const days = computed(() => {
  const selected = new Date(`${props.selectedDate}T00:00:00`);
  const dayOfWeek = selected.getDay();
  selected.setDate(selected.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const values = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selected);
    date.setDate(date.getDate() + index);
    const dateKey = toDateKey(date);
    const dayWorkouts = props.workouts.filter((workout) => workout.date === dateKey && workout.completed);
    return {
      date: dateKey,
      label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 2),
      calories: estimateDailyCalories(dayWorkouts, props.profile),
    };
  });
  const maxCalories = Math.max(...values.map((day) => day.calories), 1000);
  return values.map((day) => ({ ...day, height: day.calories ? Math.max((day.calories / maxCalories) * 100, 5) : 0 }));
});

const weeklyCalories = computed(() => days.value.reduce((total, day) => total + day.calories, 0));
</script>