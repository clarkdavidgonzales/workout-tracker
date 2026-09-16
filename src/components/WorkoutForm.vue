<template>
  <ion-card class="form-card">
    <ion-card-header>
      <div class="form-title-row">
        <div class="form-title-icon"><ion-icon :icon="addOutline" /></div>
        <div>
          <ion-card-title>{{ editingWorkout ? 'Edit workout' : 'Log a workout' }}</ion-card-title>
          <ion-card-subtitle>{{ editingWorkout ? 'Update this personalized session' : 'Customize your personal workout plan' }}</ion-card-subtitle>
        </div>
      </div>
    </ion-card-header>

    <ion-card-content>
      <button class="photo-picker" type="button" @click="openFilePicker">
        <img v-if="photo" :src="photo" alt="Exercise preview" />
        <span v-else class="photo-picker-empty">
          <ion-icon :icon="cameraOutline" />
          <strong>Add exercise photo</strong>
          <small>JPG, PNG, or WebP</small>
        </span>
        <span v-if="photo" class="change-photo">Change photo</span>
      </button>

      <button v-if="photo" type="button" class="remove-photo" @click="removePhoto">
        <ion-icon :icon="closeCircleOutline" /> Remove photo
      </button>

      <input
        ref="fileInput"
        class="hidden-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="handleImage"
      />

      <div class="icon-picker">
        <div class="icon-picker-label">
          <span>Choose a default icon</span>
          <small>Used when there is no photo</small>
        </div>
        <div class="icon-options">
          <button
            v-for="option in iconOptions"
            :key="option.value"
            type="button"
            class="icon-option"
            :class="{ selected: selectedIcon === option.value }"
            :aria-label="option.label"
            :title="option.label"
            @click="selectedIcon = option.value"
          >
            <ion-icon :icon="option.icon" />
          </button>
        </div>
      </div>

      <div class="form-fields">
        <ion-item>
          <ion-input
            v-model="exercise"
            label="Exercise"
            label-placement="stacked"
            placeholder="Example: Bench Press"
            clear-input
          />
        </ion-item>

        <ion-item v-if="editingWorkout">
          <ion-input
            v-model="date"
            type="date"
            label="Workout date"
            label-placement="stacked"
          />
        </ion-item>

        <div class="exercise-examples">
          <div class="examples-heading">
            <span>Quick exercise examples</span>
            <small>Tap to use one</small>
          </div>
          <div class="example-chips">
            <button
              v-for="example in exerciseExamples"
              :key="example"
              type="button"
              class="example-chip"
              @click="exercise = example"
            >
              {{ example }}
            </button>
          </div>
        </div>

        <div class="field-row two">
          <ion-item>
            <ion-select
              v-model="category"
              label="Muscle group"
              label-placement="stacked"
              interface="popover"
            >
              <ion-select-option value="Chest">Chest</ion-select-option>
              <ion-select-option value="Back">Back</ion-select-option>
              <ion-select-option value="Shoulders">Shoulders</ion-select-option>
              <ion-select-option value="Arms">Arms</ion-select-option>
              <ion-select-option value="Legs">Legs</ion-select-option>
              <ion-select-option value="Glutes">Glutes</ion-select-option>
              <ion-select-option value="Hamstrings">Hamstrings</ion-select-option>
              <ion-select-option value="Core">Core</ion-select-option>
              <ion-select-option value="Cardio">Cardio</ion-select-option>
              <ion-select-option value="Mobility">Mobility</ion-select-option>
              <ion-select-option value="Full Body">Full Body</ion-select-option>
            </ion-select>
          </ion-item>

        </div>

        <div class="field-row three">
          <ion-item>
            <ion-input v-model.number="sets" type="number" label="Sets" label-placement="stacked" :min="1" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="reps" type="number" label="Reps" label-placement="stacked" :min="1" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="weight" type="number" label="Kg" label-placement="stacked" :min="0" />
          </ion-item>
          <ion-item>
            <ion-input v-model.number="duration" type="number" label="Minutes" label-placement="stacked" :min="1" />
          </ion-item>
        </div>
      </div>

      <ion-text color="danger" v-if="errorMessage">
        <p class="error-message">{{ errorMessage }}</p>
      </ion-text>

      <div class="form-actions">
        <ion-button
          v-if="editingWorkout"
          class="cancel-button"
          fill="clear"
          @click="cancelEdit"
        >
          Cancel
        </ion-button>
        <ion-button class="add-button" :expand="editingWorkout ? undefined : 'block'" @click="submitWorkout">
          <ion-icon slot="start" :icon="editingWorkout ? saveOutline : addCircleOutline" />
          {{ editingWorkout ? 'Save changes' : 'Add workout' }}
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonText,
} from '@ionic/vue';
import {
  addCircleOutline,
  addOutline,
  barbellOutline,
  bicycleOutline,
  bodyOutline,
  cameraOutline,
  closeCircleOutline,
  fitnessOutline,
  footballOutline,
  saveOutline,
  walkOutline,
} from 'ionicons/icons';
import type { Workout } from '../types/workout';

const today = () => new Date().toISOString().slice(0, 10);

const props = defineProps<{
  editingWorkout: Workout | null;
  defaultDate: string;
}>();

const emit = defineEmits<{
  add: [workout: {
    exercise: string;
    category: string;
    sets: number;
    reps: number;
    weight: number;
    duration: number;
    date: string;
    photo?: string;
    icon: string;
  }];
  update: [workout: Workout];
  cancel: [];
}>();

const iconOptions = [
  { value: 'barbell', label: 'Weights', icon: barbellOutline },
  { value: 'body', label: 'Bodyweight', icon: bodyOutline },
  { value: 'fitness', label: 'Fitness', icon: fitnessOutline },
  { value: 'walk', label: 'Walking or running', icon: walkOutline },
  { value: 'bicycle', label: 'Cycling', icon: bicycleOutline },
  { value: 'football', label: 'Sports', icon: footballOutline },
];

const exercise = ref('');
const category = ref('Chest');
const sets = ref(3);
const reps = ref(10);
const weight = ref(0);
const duration = ref(45);
const date = ref(today());
const photo = ref('');
const selectedIcon = ref('barbell');
const fileInput = ref<HTMLInputElement | null>(null);
const errorMessage = ref('');

const examplesByCategory: Record<string, string[]> = {
  Chest: ['Bench Press', 'Incline Dumbbell Press', 'Push-ups', 'Chest Fly'],
  Back: ['Lat Pulldown', 'Pull-ups', 'Seated Cable Row', 'Barbell Row'],
  Shoulders: ['Lateral Raises', 'Overhead Press', 'Front Raises', 'Face Pulls'],
  Arms: ['Bicep Curls', 'Hammer Curls', 'Tricep Pushdown', 'Skull Crushers'],
  Legs: ['Back Squat', 'Leg Press', 'Walking Lunges', 'Leg Extension'],
  Glutes: ['Hip Thrust', 'Glute Bridge', 'Cable Kickbacks', 'Bulgarian Split Squat'],
  Hamstrings: ['Romanian Deadlift', 'Leg Curl', 'Good Mornings', 'Kettlebell Swing'],
  Core: ['Plank', 'Russian Twists', 'Hanging Knee Raises', 'Cable Crunches'],
  Cardio: ['Treadmill Run', 'Cycling', 'Rowing', 'Jump Rope'],
  Mobility: ['Hip Flexor Stretch', "World's Greatest Stretch", 'Shoulder Dislocates', 'Deep Squat Hold'],
  'Full Body': ['Burpees', 'Clean and Press', 'Turkish Get-up', 'Mountain Climbers'],
};
const exerciseExamples = computed(() => examplesByCategory[category.value] ?? examplesByCategory.Chest);

const openFilePicker = () => fileInput.value?.click();
const removePhoto = () => {
  photo.value = '';
  if (fileInput.value) fileInput.value.value = '';
};

const handleImage = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Please choose an image smaller than 5 MB.';
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(900 / image.width, 900 / image.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      photo.value = canvas.toDataURL('image/jpeg', 0.8);
      errorMessage.value = '';
    };
    image.onerror = () => { errorMessage.value = 'That image could not be opened.'; };
    image.src = String(reader.result ?? '');
  };
  reader.readAsDataURL(file);
};

const resetForm = () => {
  exercise.value = '';
  category.value = 'Chest';
  sets.value = 3;
  reps.value = 10;
  weight.value = 0;
  duration.value = 45;
  date.value = props.defaultDate || today();
  photo.value = '';
  selectedIcon.value = 'barbell';
  if (fileInput.value) fileInput.value.value = '';
  errorMessage.value = '';
};

watch(
  () => props.editingWorkout,
  (workout) => {
    if (!workout) {
      resetForm();
      return;
    }

    exercise.value = workout.exercise;
    category.value = workout.category;
    sets.value = workout.sets;
    reps.value = workout.reps;
    weight.value = workout.weight;
    duration.value = workout.duration ?? 45;
    date.value = workout.date;
    photo.value = workout.photo ?? '';
    selectedIcon.value = workout.icon ?? 'barbell';
    errorMessage.value = '';
  },
);

watch(() => props.defaultDate, (value) => {
  if (!props.editingWorkout && value) date.value = value;
});

const cancelEdit = () => {
  emit('cancel');
  resetForm();
};

const submitWorkout = () => {
  const cleanExercise = exercise.value.trim();
  const numericSets = Number(sets.value);
  const numericReps = Number(reps.value);
  const numericWeight = Number(weight.value);
  const numericDuration = Number(duration.value);

  if (!cleanExercise) {
    errorMessage.value = 'Please enter an exercise name.';
    return;
  }

  if (numericSets < 1 || numericReps < 1 || numericWeight < 0 || numericDuration < 1 || !date.value) {
    errorMessage.value = 'Please enter valid workout details.';
    return;
  }

  const workoutData = {
    exercise: cleanExercise,
    category: category.value,
    sets: numericSets,
    reps: numericReps,
    weight: numericWeight,
    duration: numericDuration,
    date: date.value,
    photo: photo.value || undefined,
    icon: selectedIcon.value,
  };

  if (props.editingWorkout) {
    emit('update', {
      ...props.editingWorkout,
      ...workoutData,
    });
  } else {
    emit('add', workoutData);
  }

  resetForm();
};
</script>
