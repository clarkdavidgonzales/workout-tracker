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
import { computed, nextTick, onMounted, ref, watch } from 'vue';
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

const STORAGE_KEY = 'ionic-workout-tracker';

const dateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const defaultWorkouts: Workout[] = [
  { id: 1, exercise: 'Bench Press', category: 'Chest', sets: 4, reps: 8, weight: 50, date: dateOffset(0), completed: true, icon: 'barbell' },
  { id: 2, exercise: 'Barbell Squat', category: 'Legs', sets: 4, reps: 10, weight: 60, date: dateOffset(1), completed: false, icon: 'fitness' },
  { id: 3, exercise: 'Morning Run', category: 'Cardio', sets: 3, reps: 10, weight: 0, date: dateOffset(2), completed: false, icon: 'walk' },
];

const workouts = ref<Workout[]>([]);
const searchText = ref('');
const filter = ref<'all' | 'planned' | 'completed'>('all');
const editingWorkout = ref<Workout | null>(null);

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    try {
      workouts.value = JSON.parse(saved) as Workout[];
      return;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  workouts.value = defaultWorkouts;
});

watch(
  workouts,
  (newWorkouts) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWorkouts));
    } catch {
      // Uploaded images can fill browser storage. The app remains usable for this session.
    }
  },
  { deep: true },
);

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

const addWorkout = (workoutData: Omit<Workout, 'id' | 'completed'>) => {
  workouts.value.unshift({
    id: Date.now(),
    ...workoutData,
    completed: false,
  });
};

const startEditing = async (id: number) => {
  const workout = workouts.value.find((item) => item.id === id);
  if (!workout) return;

  editingWorkout.value = { ...workout };
  await nextTick();
  document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const updateWorkout = (updatedWorkout: Workout) => {
  const index = workouts.value.findIndex((item) => item.id === updatedWorkout.id);
  if (index !== -1) workouts.value[index] = updatedWorkout;
  editingWorkout.value = null;
};

const toggleCompleted = (id: number) => {
  const workout = workouts.value.find((item) => item.id === id);
  if (workout) workout.completed = !workout.completed;
};

const removeWorkout = (id: number) => {
  workouts.value = workouts.value.filter((workout) => workout.id !== id);
  if (editingWorkout.value?.id === id) editingWorkout.value = null;
};
</script>
