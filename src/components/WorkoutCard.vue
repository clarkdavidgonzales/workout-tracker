<template>
  <ion-card class="workout-card" :class="{ completed: workout.completed }">
    <div class="workout-photo">
      <img v-if="workout.photo" :src="workout.photo" :alt="`${workout.exercise} photo`" />
      <div v-else class="photo-fallback">
        <ion-icon :icon="displayIcon" />
        <span>{{ workout.category }}</span>
      </div>

      <ion-badge class="status-badge" :class="{ complete: workout.completed }">
        <ion-icon :icon="workout.completed ? checkmarkCircle : timeOutline" />
        {{ workout.completed ? 'Completed' : 'Planned' }}
      </ion-badge>

      <ion-button
        class="edit-button"
        fill="clear"
        aria-label="Edit workout"
        @click="$emit('edit', workout.id)"
      >
        <ion-icon slot="icon-only" :icon="createOutline" />
      </ion-button>

      <ion-button
        class="delete-button"
        fill="clear"
        aria-label="Delete workout"
        @click="$emit('remove', workout.id)"
      >
        <ion-icon slot="icon-only" :icon="trashOutline" />
      </ion-button>
    </div>

    <ion-card-content>
      <div class="workout-meta">
        <span>{{ workout.category }}</span>
        <span class="meta-dot"></span>
        <span>{{ formattedDate }}</span>
      </div>

      <h2>{{ workout.exercise }}</h2>

      <div class="workout-numbers">
        <div><strong>{{ workout.sets }}</strong><small>sets</small></div>
        <div><strong>{{ workout.reps }}</strong><small>reps</small></div>
        <div><strong>{{ workout.weight }}</strong><small>kg</small></div>
        <div><strong>{{ workout.duration }}</strong><small>min</small></div>
      </div>

      <ion-button
        class="complete-button"
        :class="{ complete: workout.completed }"
        expand="block"
        fill="clear"
        @click="$emit('toggle', workout.id)"
      >
        <ion-icon slot="start" :icon="workout.completed ? refreshOutline : checkmarkOutline" />
        {{ workout.completed ? 'Mark planned' : 'Complete workout' }}
      </ion-button>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonBadge, IonButton, IonCard, IonCardContent, IonIcon } from '@ionic/vue';
import {
  barbellOutline,
  bicycleOutline,
  bodyOutline,
  checkmarkCircle,
  checkmarkOutline,
  createOutline,
  fitnessOutline,
  footballOutline,
  refreshOutline,
  timeOutline,
  trashOutline,
  walkOutline,
} from 'ionicons/icons';
import type { Workout } from '../types/workout';

const props = defineProps<{ workout: Workout }>();

const iconMap: Record<string, string> = {
  barbell: barbellOutline,
  body: bodyOutline,
  fitness: fitnessOutline,
  walk: walkOutline,
  bicycle: bicycleOutline,
  football: footballOutline,
};

const displayIcon = computed(() => iconMap[props.workout.icon ?? 'barbell'] ?? barbellOutline);

defineEmits<{
  toggle: [id: string | number];
  edit: [id: string | number];
  remove: [id: string | number];
}>();

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
    new Date(`${props.workout.date}T00:00:00`),
  ),
);
</script>
