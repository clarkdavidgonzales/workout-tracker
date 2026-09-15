<template>
  <section>
    <div class="section-heading">
      <div>
        <p class="section-kicker">TRAINING LOG</p>
        <h2>My workouts</h2>
      </div>
      <span class="result-count">{{ workouts.length }} session{{ workouts.length === 1 ? '' : 's' }}</span>
    </div>

    <div v-if="workouts.length" class="workout-list">
      <workout-card
        v-for="workout in workouts"
        :key="workout.id"
        :workout="workout"
        @toggle="$emit('toggle', $event)"
        @edit="$emit('edit', $event)"
        @remove="$emit('remove', $event)"
      />
    </div>

    <ion-card v-else class="empty-card">
      <ion-card-content>
        <ion-icon :icon="barbellOutline" />
        <h3>No workouts found</h3>
        <p>Add a workout or change your search/filter.</p>
      </ion-card-content>
    </ion-card>
  </section>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonIcon } from '@ionic/vue';
import { barbellOutline } from 'ionicons/icons';
import WorkoutCard from './WorkoutCard.vue';
import type { Workout } from '../types/workout';

defineProps<{ workouts: Workout[] }>();

defineEmits<{
  toggle: [id: string | number];
  edit: [id: string | number];
  remove: [id: string | number];
}>();
</script>
