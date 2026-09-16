<template>
  <section class="week-planner">
    <div class="planner-heading">
      <div>
        <p class="section-kicker">WEEK PLANNER</p>
        <h2>{{ weekLabel }}</h2>
      </div>
      <div class="planner-actions">
        <button type="button" title="Copy this week" @click="$emit('copy')">
          <ion-icon :icon="copyOutline" /> Copy week
        </button>
        <button type="button" title="Paste into next week" :disabled="!canPaste" @click="$emit('paste')">
          <ion-icon :icon="clipboardOutline" /> Paste next
        </button>
        <button type="button" class="clear-week-button" title="Clear this week" :disabled="!scheduledCount" @click="$emit('clear')">
          <ion-icon :icon="trashOutline" /> Clear week
        </button>
        <span>{{ scheduledCount }} planned session{{ scheduledCount === 1 ? '' : 's' }}</span>
      </div>
    </div>

    <div class="week-days">
      <button
        v-for="day in days"
        :key="day.date"
        type="button"
        class="week-day"
        :class="{ selected: day.date === selectedDate, today: day.date === today }"
        @click="$emit('select', day.date)"
      >
        <span>{{ day.label }}</span>
        <strong>{{ day.number }}</strong>
        <small v-if="day.workouts.length">{{ day.workouts.length }} session{{ day.workouts.length === 1 ? '' : 's' }}</small>
        <small v-else class="rest-day">Rest</small>
        <i :class="{ complete: day.workouts.length > 0 && day.workouts.every((workout) => workout.completed) }"></i>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import { clipboardOutline, copyOutline, trashOutline } from 'ionicons/icons';
import type { Workout } from '../types/workout';

const props = defineProps<{ workouts: Workout[]; selectedDate: string; canPaste: boolean }>();
defineEmits<{ select: [date: string]; copy: []; paste: []; clear: [] }>();

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const today = toDateKey(new Date());
const startOfWeek = computed(() => {
  const date = new Date(`${props.selectedDate}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
});

const days = computed(() => Array.from({ length: 7 }, (_, index) => {
  const date = new Date(startOfWeek.value);
  date.setDate(date.getDate() + index);
  const dateKey = toDateKey(date);
  return {
    date: dateKey,
    label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
    number: date.getDate(),
    workouts: props.workouts.filter((workout) => workout.date === dateKey),
  };
}));

const scheduledCount = computed(() => days.value.reduce((total, day) => total + day.workouts.length, 0));
const weekLabel = computed(() => {
  const start = startOfWeek.value;
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(start)} - ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(end)}`;
});
</script>