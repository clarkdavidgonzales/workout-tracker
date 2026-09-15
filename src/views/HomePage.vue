<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <div class="toolbar-inner">
          <a class="brand" href="#">
            <span class="brand-mark"><ion-icon :icon="barbell" /></span>
            <span>Rep<span>Log</span></span>
          </a>
          <div class="profile-dot">CG</div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <main class="page-shell">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow"><ion-icon :icon="flashOutline" /> YOUR FITNESS JOURNEY</p>
            <h1>Build strength.<br /><span>Track progress.</span></h1>
            <p class="hero-text">
              Plan every session, record your sets and weight, and turn small improvements into real results.
            </p>
            <a class="hero-link" href="#workouts">
              View workouts <ion-icon :icon="arrowForwardOutline" />
            </a>
          </div>

          <div class="hero-art" aria-hidden="true">
            <div class="pulse-ring ring-one"></div>
            <div class="pulse-ring ring-two"></div>
            <div class="weight-icon"><ion-icon :icon="barbellOutline" /></div>
          </div>
        </section>

        <section class="stats-grid">
          <div class="stat-item">
            <span class="stat-icon orange"><ion-icon :icon="calendarOutline" /></span>
            <div><strong>{{ workouts.length }}</strong><small>Total sessions</small></div>
          </div>
          <div class="stat-item">
            <span class="stat-icon green"><ion-icon :icon="checkmarkDoneOutline" /></span>
            <div><strong>{{ completedCount }}</strong><small>Completed</small></div>
          </div>
          <div class="stat-item">
            <span class="stat-icon blue"><ion-icon :icon="trendingUpOutline" /></span>
            <div><strong>{{ totalVolume.toLocaleString() }}</strong><small>Volume kg</small></div>
          </div>
        </section>

        <section class="content-layout">
          <aside>
            <workout-form
              :editing-workout="editingWorkout"
              @add="addWorkout"
              @update="updateWorkout"
              @cancel="editingWorkout = null"
            />
          </aside>

          <div id="workouts" class="collection-column">
            <div class="filter-bar">
              <ion-searchbar
                v-model="searchText"
                placeholder="Search exercise or muscle"
                :debounce="150"
              />

              <ion-segment v-model="filter">
                <ion-segment-button value="all"><ion-label>All</ion-label></ion-segment-button>
                <ion-segment-button value="planned"><ion-label>Planned</ion-label></ion-segment-button>
                <ion-segment-button value="completed"><ion-label>Done</ion-label></ion-segment-button>
              </ion-segment>
            </div>

            <workout-list
              :workouts="filteredWorkouts"
              @toggle="toggleCompleted"
              @edit="startEditing"
              @remove="removeWorkout"
            />
          </div>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, onMounted, ref } from 'vue';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
} from '@ionic/vue';
import {
  arrowForwardOutline,
  barbell,
  barbellOutline,
  calendarOutline,
  checkmarkDoneOutline,
  flashOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import WorkoutForm from '../components/WorkoutForm.vue';
import WorkoutList from '../components/WorkoutList.vue';
import type { Workout } from '../types/workout';
import { database } from '../firebase';
import { onValue, push, ref as databaseRef, remove, update } from 'firebase/database';

const workouts = ref<Workout[]>([]);
const searchText = ref('');
const filter = ref<'all' | 'planned' | 'completed'>('all');
const editingWorkout = ref<Workout | null>(null);
const workoutsRef = databaseRef(database, 'workouts');

const unsubscribe = onValue(workoutsRef, (snapshot) => {
  const data = snapshot.val() as Record<string, Omit<Workout, 'id'>> | null;
  workouts.value = data
    ? Object.entries(data).map(([id, workout]) => ({ id, ...workout }))
    : [];
});

onUnmounted(unsubscribe);

const completedCount = computed(() => workouts.value.filter((workout) => workout.completed).length);
const totalVolume = computed(() =>
  workouts.value
    .filter((workout) => workout.completed)
    .reduce((total, workout) => total + workout.sets * workout.reps * workout.weight, 0),
);

const filteredWorkouts = computed(() => {
  const query = searchText.value.trim().toLowerCase();

  return workouts.value.filter((workout) => {
    const matchesSearch =
      workout.exercise.toLowerCase().includes(query) ||
      workout.category.toLowerCase().includes(query);

    const matchesFilter =
      filter.value === 'all' ||
      (filter.value === 'completed' && workout.completed) ||
      (filter.value === 'planned' && !workout.completed);

    return matchesSearch && matchesFilter;
  });
});

const addWorkout = async (workoutData: Omit<Workout, 'id' | 'completed'>) => {
  const workoutRef = push(workoutsRef);
  await update(workoutRef, { ...workoutData, completed: false });
};

const startEditing = async (id: string | number) => {
  const workout = workouts.value.find((item) => item.id === id);
  if (!workout) return;

  editingWorkout.value = { ...workout };
  await nextTick();
  document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const updateWorkout = async (updatedWorkout: Workout) => {
  await update(databaseRef(database, `workouts/${updatedWorkout.id}`), {
    exercise: updatedWorkout.exercise,
    category: updatedWorkout.category,
    sets: updatedWorkout.sets,
    reps: updatedWorkout.reps,
    weight: updatedWorkout.weight,
    date: updatedWorkout.date,
    photo: updatedWorkout.photo ?? null,
    icon: updatedWorkout.icon ?? 'barbell',
    completed: updatedWorkout.completed,
  });
  editingWorkout.value = null;
};

const toggleCompleted = async (id: string | number) => {
  const workout = workouts.value.find((item) => item.id === id);
  if (workout) {
    await update(databaseRef(database, `workouts/${id}`), { completed: !workout.completed });
  }
};

const removeWorkout = async (id: string | number) => {
  await remove(databaseRef(database, `workouts/${id}`));
  if (editingWorkout.value?.id === id) editingWorkout.value = null;
};
</script>
