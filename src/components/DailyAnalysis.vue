<template>
  <section class="analysis-panel">
    <div class="analysis-heading">
      <div>
        <p class="section-kicker">DAILY READOUT</p>
        <h2>{{ formattedDate }}</h2>
      </div>
      <ion-input :value="selectedDate" type="date" aria-label="Analysis date" @ion-input="changeDate" />
    </div>
    <div class="analysis-grid">
      <div><strong>{{ completedWorkouts.length }}</strong><span>completed</span></div>
      <div><strong>{{ duration }}<small> min</small></strong><span>training time</span></div>
      <div><strong>{{ calories }}</strong><span>estimated kcal</span></div>
      <div><strong>{{ volume.toLocaleString() }}</strong><span>volume kg</span></div>
    </div>
    <p class="analysis-note">Maintenance estimate: <strong>{{ maintenanceCalories.toLocaleString() }} kcal/day</strong>, based on your profile and daily activity.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IonInput } from '@ionic/vue';
import type { UserProfile, Workout } from '../types/workout';
import { estimateDailyCalories, estimateMaintenanceCalories } from '../utils/calories';

const props = defineProps<{ workouts: Workout[]; profile: UserProfile; selectedDate: string }>();
const emit = defineEmits<{ 'update:selectedDate': [date: string] }>();
const selectedDate = computed(() => props.selectedDate);
const completedWorkouts = computed(() => props.workouts.filter((workout) => workout.date === selectedDate.value && workout.completed));
const duration = computed(() => completedWorkouts.value.reduce((total, workout) => total + workout.duration, 0));
const calories = computed(() => estimateDailyCalories(completedWorkouts.value, props.profile));
const volume = computed(() => completedWorkouts.value.reduce((total, workout) => total + workout.sets * workout.reps * workout.weight, 0));
const maintenanceCalories = computed(() => estimateMaintenanceCalories(props.profile));
const formattedDate = computed(() => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(`${selectedDate.value}T00:00:00`)));
const changeDate = (event: CustomEvent) => emit('update:selectedDate', String(event.detail.value ?? ''));
</script>