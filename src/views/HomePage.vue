<template>
  <ion-page>
    <ion-header class="app-header">
      <ion-toolbar>
        <div class="toolbar-inner">
          <a class="brand" href="#">
            <span class="brand-mark"><ion-icon :icon="barbell" /></span>
            <span>Spartan<span>Log</span></span>
          </a>
          <div class="profile-actions">
            <span class="profile-email">{{ user?.email }}</span>
            <div class="profile-dot">
              <img v-if="profile.avatar" :src="profile.avatar" alt="Profile" />
              <span v-else>{{ initials }}</span>
            </div>
            <ion-button class="header-settings" fill="clear" aria-label="Open settings" title="Settings" @click="settingsOpen = !settingsOpen">
              <ion-icon slot="icon-only" :icon="settingsOutline" />
            </ion-button>
            <ion-button class="header-analyze" fill="clear" aria-label="Open analysis" title="Analyze progress" @click="analysisOpen = !analysisOpen">
              <ion-icon slot="icon-only" :icon="analyticsOutline" />
            </ion-button>
            <ion-button class="header-plan" fill="clear" aria-label="Open smart plan" title="Smart plan" @click="planOpen = !planOpen">
              <ion-icon slot="icon-only" :icon="sparklesOutline" />
            </ion-button>
            <ion-button class="header-sign-out" fill="clear" aria-label="Sign out" title="Sign out" @click="signOut">
              <ion-icon slot="icon-only" :icon="logOutOutline" />
            </ion-button>
          </div>
        </div>
      </ion-toolbar>
      <div v-if="settingsOpen" class="settings-dropdown">
        <profile-panel :profile="profile" @save="saveProfile" @signout="signOut" />
      </div>
      <div v-if="analysisOpen" class="analysis-dropdown">
        <progress-analysis :profile="profile" :workouts="workouts" :body-weight-entries="bodyWeightEntries" />
      </div>
      <div v-if="planOpen" class="plan-dropdown">
        <weekly-recommendation
          :profile="profile"
          :selected-date="selectedDate"
          :body-weight="recommendationBodyWeight"
          :body-weight-source="recommendationBodyWeightSource"
          :body-weight-entries="bodyWeightEntries"
          @use-plan="useRecommendedPlan"
          @save-criteria="saveProfile"
        />
      </div>
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

        <p v-if="databaseError" class="database-error">{{ databaseError }}</p>

        <daily-analysis
          :workouts="workouts"
          :profile="profile"
          :selected-date="selectedDate"
          @update:selected-date="selectedDate = $event"
        />

        <week-planner
          :workouts="workouts"
          :selected-date="selectedDate"
          :can-paste="weekClipboard.length > 0"
          @select="selectedDate = $event"
          @copy="copyWeek"
          @paste="pasteWeek"
          @clear="clearWeek"
        />
        <p v-if="plannerNotice" class="planner-notice">{{ plannerNotice }}</p>

        <weekly-progress-chart
          :workouts="workouts"
          :profile="profile"
          :selected-date="selectedDate"
        />

        <progress-history :workouts="workouts" :profile="profile" />

        <body-weight-log :selected-date="selectedDate" :entries="bodyWeightEntries" @save="saveBodyWeight" @remove="removeBodyWeight" />

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
              :default-date="selectedDate"
              @add="addWorkout"
              @update="updateWorkout"
              @cancel="editingWorkout = null"
            />
          </aside>

          <div id="workouts" class="collection-column">
            <div class="workout-tools">
              <button type="button" @click="planOpen = !planOpen">
                <ion-icon :icon="sparklesOutline" /> Smart plan
              </button>
              <button type="button" @click="analysisOpen = !analysisOpen">
                <ion-icon :icon="analyticsOutline" /> Analyze
              </button>
            </div>
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
import { computed, nextTick, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
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
  logOutOutline,
  analyticsOutline,
  sparklesOutline,
  settingsOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import WorkoutForm from '../components/WorkoutForm.vue';
import WorkoutList from '../components/WorkoutList.vue';
import ProfilePanel from '../components/ProfilePanel.vue';
import ProgressAnalysis from '../components/ProgressAnalysis.vue';
import DailyAnalysis from '../components/DailyAnalysis.vue';
import WeekPlanner from '../components/WeekPlanner.vue';
import WeeklyProgressChart from '../components/WeeklyProgressChart.vue';
import ProgressHistory from '../components/ProgressHistory.vue';
import BodyWeightLog from '../components/BodyWeightLog.vue';
import WeeklyRecommendation from '../components/WeeklyRecommendation.vue';
import type { UserProfile, Workout } from '../types/workout';
import { auth, database } from '../firebase';
import { onValue, push, ref as databaseRef, remove, update } from 'firebase/database';
import { signOut as firebaseSignOut } from 'firebase/auth';

const workouts = ref<Workout[]>([]);
const searchText = ref('');
const filter = ref<'all' | 'planned' | 'completed'>('all');
const editingWorkout = ref<Workout | null>(null);
const databaseError = ref('');
const selectedDate = ref(new Date().toISOString().slice(0, 10));
const settingsOpen = ref(false);
const analysisOpen = ref(false);
const planOpen = ref(false);
const weekClipboard = ref<Workout[]>([]);
const plannerNotice = ref('');
const user = auth.currentUser;
const router = useRouter();
const profile = ref<UserProfile>({
  displayName: user?.displayName ?? '',
  email: user?.email ?? '',
  sex: 'other',
  age: 30,
  height: 175,
  weight: 70,
  activityLevel: 'moderate',
  experienceLevel: 'beginner',
  availableMinutes: 45,
  busyDays: [],
  targetMuscleGroups: ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Calves'],
});
const workoutsRef = databaseRef(database, `users/${user?.uid}/workouts`);
const profileRef = databaseRef(database, `users/${user?.uid}/profile`);
const bodyWeightRef = databaseRef(database, `users/${user?.uid}/bodyWeightLogs`);
const bodyWeightEntries = ref<Record<string, { date: string; weight: number }>>({});
const recommendationBodyWeight = computed(() => bodyWeightEntries.value[selectedDate.value]?.weight ?? latestBodyWeight.value);
const recommendationBodyWeightSource = computed(() => bodyWeightEntries.value[selectedDate.value] ? `from ${selectedDate.value}` : latestBodyWeight.value ? 'from latest measurement' : 'from profile criteria');
const latestBodyWeight = computed(() => Object.values(bodyWeightEntries.value).sort((a, b) => b.date.localeCompare(a.date))[0]?.weight);

const unsubscribe = onValue(workoutsRef, (snapshot) => {
  databaseError.value = '';
  const data = snapshot.val() as Record<string, Omit<Workout, 'id'>> | null;
  workouts.value = data
  ? Object.entries(data).map(([id, workout]) => ({ id, ...workout, duration: workout.duration ?? 45 }))
    : [];
}, (error) => {
  databaseError.value = `Unable to read workouts: ${error.message}`;
});

const unsubscribeProfile = onValue(profileRef, (snapshot) => {
  if (snapshot.exists()) profile.value = { ...profile.value, ...snapshot.val() };
});

const unsubscribeBodyWeight = onValue(bodyWeightRef, (snapshot) => {
  bodyWeightEntries.value = snapshot.val() ?? {};
});

onUnmounted(() => { unsubscribe(); unsubscribeProfile(); unsubscribeBodyWeight(); });

const initials = computed(() => (profile.value.displayName || user?.email || 'U').slice(0, 2).toUpperCase());

const completedCount = computed(() => workouts.value.filter((workout) => workout.completed).length);
const totalVolume = computed(() =>
  workouts.value
    .filter((workout) => workout.completed)
    .reduce((total, workout) => total + workout.sets * workout.reps * workout.weight, 0),
);

const filteredWorkouts = computed(() => {
  const query = searchText.value.trim().toLowerCase();

  return workouts.value.filter((workout) => {
    const matchesSelectedDate = workout.date === selectedDate.value;
    const matchesSearch =
      workout.exercise.toLowerCase().includes(query) ||
      workout.category.toLowerCase().includes(query);

    const matchesFilter =
      filter.value === 'all' ||
      (filter.value === 'completed' && workout.completed) ||
      (filter.value === 'planned' && !workout.completed);

    return matchesSelectedDate && matchesSearch && matchesFilter;
  });
});

const getWeekStart = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const copyWeek = () => {
  const weekStart = getWeekStart(selectedDate.value);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const startKey = toDateKey(weekStart);
  const endKey = toDateKey(weekEnd);
  weekClipboard.value = workouts.value
    .filter((workout) => workout.date >= startKey && workout.date < endKey)
    .map((workout) => ({ ...workout }));
  plannerNotice.value = weekClipboard.value.length
    ? `${weekClipboard.value.length} session${weekClipboard.value.length === 1 ? '' : 's'} copied. Select Paste next to plan them for the following week.`
    : 'There are no workouts in this week to copy.';
};

const clearWeek = async () => {
  const weekStart = getWeekStart(selectedDate.value);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const startKey = toDateKey(weekStart);
  const endKey = toDateKey(weekEnd);
  const weekWorkouts = workouts.value.filter((workout) => workout.date >= startKey && workout.date < endKey);
  if (!weekWorkouts.length || !window.confirm(`Clear ${weekWorkouts.length} session${weekWorkouts.length === 1 ? '' : 's'} from this week?`)) return;
  try {
    await Promise.all(weekWorkouts.map((workout) => remove(databaseRef(database, `users/${user?.uid}/workouts/${workout.id}`))));
    if (editingWorkout.value && weekWorkouts.some((workout) => workout.id === editingWorkout.value?.id)) editingWorkout.value = null;
    plannerNotice.value = `${weekWorkouts.length} session${weekWorkouts.length === 1 ? '' : 's'} cleared from this week.`;
  } catch (error) {
    databaseError.value = `Unable to clear week: ${error instanceof Error ? error.message : 'Firebase rejected the delete.'}`;
  }
};

const pasteWeek = async () => {
  if (!weekClipboard.value.length) return;
  try {
    const targetStart = getWeekStart(selectedDate.value);
    targetStart.setDate(targetStart.getDate() + 7);
    await Promise.all(weekClipboard.value.map((workout) => {
      const { id: _sourceId, ...workoutData } = workout;
      const sourceDate = new Date(`${workout.date}T00:00:00`);
      const dayOffset = Math.round((sourceDate.getTime() - getWeekStart(selectedDate.value).getTime()) / 86400000);
      const targetDate = new Date(targetStart);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      const newWorkout = push(workoutsRef);
      return update(newWorkout, { ...workoutData, date: toDateKey(targetDate), completed: false });
    }));
    plannerNotice.value = `${weekClipboard.value.length} session${weekClipboard.value.length === 1 ? '' : 's'} pasted into next week.`;
  } catch (error) {
    databaseError.value = `Unable to paste week: ${error instanceof Error ? error.message : 'Firebase rejected the write.'}`;
  }
};

const useRecommendedPlan = async (recommendedWorkouts: Array<Omit<Workout, 'id' | 'completed'>>) => {
  try {
    const newWorkouts = recommendedWorkouts.filter((workout) =>
      !workouts.value.some((existing) => existing.date === workout.date && existing.exercise === workout.exercise),
    );
    await Promise.all(newWorkouts.map((workout) => {
      const workoutRef = push(workoutsRef);
      return update(workoutRef, { ...workout, photo: null, completed: false });
    }));
    const skipped = recommendedWorkouts.length - newWorkouts.length;
    plannerNotice.value = `${newWorkouts.length} session${newWorkouts.length === 1 ? '' : 's'} added${skipped ? `, ${skipped} already planned` : ''}.`;
  } catch (error) {
    databaseError.value = `Unable to add recommended plan: ${error instanceof Error ? error.message : 'Firebase rejected the write.'}`;
  }
};

const addWorkout = async (workoutData: Omit<Workout, 'id' | 'completed'>) => {
  try {
    const workoutRef = push(workoutsRef);
    await update(workoutRef, { ...workoutData, photo: workoutData.photo ?? null, completed: false });
  } catch (error) {
    databaseError.value = `Unable to add workout: ${error instanceof Error ? error.message : 'Firebase rejected the write.'}`;
  }
};

const startEditing = async (id: string | number) => {
  const workout = workouts.value.find((item) => item.id === id);
  if (!workout) return;

  editingWorkout.value = { ...workout };
  await nextTick();
  document.querySelector('.form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const updateWorkout = async (updatedWorkout: Workout) => {
  try {
    await update(databaseRef(database, `users/${user?.uid}/workouts/${updatedWorkout.id}`), {
      exercise: updatedWorkout.exercise,
      category: updatedWorkout.category,
      sets: updatedWorkout.sets,
      reps: updatedWorkout.reps,
      weight: updatedWorkout.weight,
      duration: updatedWorkout.duration,
      date: updatedWorkout.date,
      photo: updatedWorkout.photo ?? null,
      icon: updatedWorkout.icon ?? 'barbell',
      completed: updatedWorkout.completed,
    });
    editingWorkout.value = null;
  } catch (error) {
    databaseError.value = `Unable to update workout: ${error instanceof Error ? error.message : 'Firebase rejected the write.'}`;
  }
};

const toggleCompleted = async (id: string | number) => {
  const workout = workouts.value.find((item) => item.id === id);
  if (workout) {
    try {
      await update(databaseRef(database, `users/${user?.uid}/workouts/${id}`), { completed: !workout.completed });
    } catch (error) {
      databaseError.value = `Unable to update workout: ${error instanceof Error ? error.message : 'Firebase rejected the write.'}`;
    }
  }
};

const removeWorkout = async (id: string | number) => {
  try {
    await remove(databaseRef(database, `users/${user?.uid}/workouts/${id}`));
    if (editingWorkout.value?.id === id) editingWorkout.value = null;
  } catch (error) {
    databaseError.value = `Unable to delete workout: ${error instanceof Error ? error.message : 'Firebase rejected the write.'}`;
  }
};

const saveProfile = async (updatedProfile: UserProfile) => {
  try {
    profile.value = updatedProfile;
    await update(profileRef, updatedProfile);
  } catch (error) {
    databaseError.value = `Unable to save profile: ${error instanceof Error ? error.message : 'Firebase rejected the write.'}`;
  }
};

const saveBodyWeight = async (entry: { date: string; weight: number }) => {
  try {
    await update(databaseRef(database, `users/${user?.uid}/bodyWeightLogs/${entry.date}`), entry);
  } catch (error) {
    databaseError.value = `Unable to save body weight: ${error instanceof Error ? error.message : 'Firebase rejected the write.'}`;
  }
};

const removeBodyWeight = async (date: string) => {
  try {
    await remove(databaseRef(database, `users/${user?.uid}/bodyWeightLogs/${date}`));
  } catch (error) {
    databaseError.value = `Unable to delete body weight: ${error instanceof Error ? error.message : 'Firebase rejected the delete.'}`;
  }
};

const signOut = async () => {
  await firebaseSignOut(auth);
  settingsOpen.value = false;
  await router.replace({ name: 'Login' });
};
</script>
