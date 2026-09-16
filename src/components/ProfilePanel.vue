<template>
  <ion-card class="profile-card">
    <ion-card-header>
      <div class="profile-heading">
        <div>
          <p class="section-kicker">YOUR CRITERIA</p>
          <ion-card-title>Calorie profile</ion-card-title>
        </div>
        <ion-button fill="clear" class="sign-out" @click="$emit('signout')">Sign out</ion-button>
      </div>
      <ion-card-subtitle>Adjust these criteria to update your recommendations and daily estimates.</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <div class="profile-fields">
        <div class="avatar-editor">
          <div class="profile-preview">
            <img v-if="draft.avatar" :src="draft.avatar" alt="Profile preview" />
            <span v-else>{{ initials }}</span>
          </div>
          <div>
            <strong>Profile picture</strong>
            <small>Optional JPG, PNG, or WebP</small>
            <label class="avatar-upload">
              Change image
              <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleAvatar" />
            </label>
            <button v-if="draft.avatar" type="button" class="remove-avatar" @click="draft.avatar = ''">Remove image</button>
          </div>
        </div>
        <ion-item><ion-input v-model="draft.displayName" label="Name" label-placement="stacked" /></ion-item>
        <ion-item><ion-input v-model.number="draft.age" type="number" label="Age" label-placement="stacked" :min="13" /></ion-item>
        <ion-item><ion-input v-model.number="draft.height" type="number" label="Height (cm)" label-placement="stacked" :min="100" /></ion-item>
        <ion-item><ion-input v-model.number="draft.weight" type="number" label="Weight (kg)" label-placement="stacked" :min="30" /></ion-item>
        <ion-item>
          <ion-select v-model="draft.sex" label="Sex" label-placement="stacked" interface="popover">
            <ion-select-option value="female">Female</ion-select-option>
            <ion-select-option value="male">Male</ion-select-option>
            <ion-select-option value="other">Other</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select v-model="draft.activityLevel" label="Daily activity" label-placement="stacked" interface="popover">
            <ion-select-option value="sedentary">Mostly seated</ion-select-option>
            <ion-select-option value="light">Lightly active</ion-select-option>
            <ion-select-option value="moderate">Moderately active</ion-select-option>
            <ion-select-option value="high">Very active</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select v-model="draft.experienceLevel" label="Training experience" label-placement="stacked" interface="popover">
            <ion-select-option value="beginner">Beginner</ion-select-option>
            <ion-select-option value="intermediate">Intermediate</ion-select-option>
            <ion-select-option value="advanced">Advanced</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-select v-model.number="draft.availableMinutes" label="Time available per workout" label-placement="stacked" interface="popover">
            <ion-select-option :value="30">30 minutes</ion-select-option>
            <ion-select-option :value="45">45 minutes</ion-select-option>
            <ion-select-option :value="60">1 hour</ion-select-option>
            <ion-select-option :value="90">1.5 hours</ion-select-option>
          </ion-select>
        </ion-item>
        <div class="profile-choice-group">
          <span>Busy days</span>
          <div class="busy-day-options">
            <button v-for="day in weekDays" :key="day" type="button" :class="{ active: draft.busyDays.includes(day) }" @click="toggleBusyDay(day)">{{ day }}</button>
          </div>
        </div>
        <div class="profile-choice-group">
          <span>Recommended muscle groups</span>
          <div class="busy-day-options">
            <button v-for="group in muscleGroups" :key="group" type="button" :class="{ active: draft.targetMuscleGroups.includes(group) }" @click="toggleMuscleGroup(group)">{{ group }}</button>
          </div>
        </div>
      </div>
      <ion-button expand="block" class="save-profile" @click="save">Save criteria</ion-button>
      <p v-if="saved" class="saved-message">Profile updated.</p>

      <div class="account-settings">
        <p class="settings-label">ACCOUNT SETTINGS</p>
        <ion-item><ion-input v-model="currentPassword" type="password" label="Current password" label-placement="stacked" autocomplete="current-password" /></ion-item>
        <ion-item><ion-input v-model="newPassword" type="password" label="New password" label-placement="stacked" autocomplete="new-password" :minlength="6" /></ion-item>
        <ion-button expand="block" fill="outline" class="change-password" :disabled="accountLoading" @click="changePassword">Change password</ion-button>
        <p v-if="accountMessage" class="account-message">{{ accountMessage }}</p>
        <ion-button expand="block" fill="clear" class="delete-account" :disabled="accountLoading" @click="deleteAccount">Delete account</ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonInput, IonItem, IonSelect, IonSelectOption } from '@ionic/vue';
import { EmailAuthProvider, deleteUser, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ref as databaseRef, remove } from 'firebase/database';
import type { UserProfile } from '../types/workout';
import { auth, database } from '../firebase';

const props = defineProps<{ profile: UserProfile }>();
const emit = defineEmits<{ save: [profile: UserProfile]; signout: [] }>();
const draft = reactive<UserProfile>({ ...props.profile });
const saved = ref(false);
const currentPassword = ref('');
const newPassword = ref('');
const accountLoading = ref(false);
const accountMessage = ref('');
const initials = computed(() => (draft.displayName || draft.email || 'U').slice(0, 2).toUpperCase());
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core', 'Calves'];

watch(() => props.profile, (profile) => Object.assign(draft, profile), { deep: true });

const save = () => {
  emit('save', { ...draft, age: Number(draft.age), height: Number(draft.height), weight: Number(draft.weight) });
  saved.value = true;
  window.setTimeout(() => { saved.value = false; }, 1800);
};

const toggleBusyDay = (day: string) => {
  draft.busyDays = draft.busyDays.includes(day) ? draft.busyDays.filter((item) => item !== day) : [...draft.busyDays, day];
};

const toggleMuscleGroup = (group: string) => {
  if (draft.targetMuscleGroups.includes(group)) {
    if (draft.targetMuscleGroups.length > 1) draft.targetMuscleGroups = draft.targetMuscleGroups.filter((item) => item !== group);
  } else {
    draft.targetMuscleGroups = [...draft.targetMuscleGroups, group];
  }
};

const handleAvatar = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    accountMessage.value = 'Please choose an image smaller than 5 MB.';
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(256 / image.width, 256 / image.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      draft.avatar = canvas.toDataURL('image/jpeg', 0.82);
      accountMessage.value = '';
    };
    image.src = String(reader.result ?? '');
  };
  reader.readAsDataURL(file);
};

const reauthenticate = async () => {
  const user = auth.currentUser;
  if (!user?.email) throw new Error('This account does not use email/password authentication.');
  if (!currentPassword.value) throw new Error('Enter your current password first.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword.value));
  return user;
};

const changePassword = async () => {
  if (newPassword.value.length < 6) {
    accountMessage.value = 'The new password must be at least 6 characters.';
    return;
  }
  accountLoading.value = true;
  accountMessage.value = '';
  try {
    await updatePassword(await reauthenticate(), newPassword.value);
    currentPassword.value = '';
    newPassword.value = '';
    accountMessage.value = 'Password changed successfully.';
  } catch (error) {
    accountMessage.value = error instanceof Error ? error.message.replace('Firebase: ', '') : 'Unable to change password.';
  } finally {
    accountLoading.value = false;
  }
};

const deleteAccount = async () => {
  if (!window.confirm('Delete your account and all workout data? This cannot be undone.')) return;
  accountLoading.value = true;
  accountMessage.value = '';
  try {
    const user = await reauthenticate();
    await remove(databaseRef(database, `users/${user.uid}`));
    await deleteUser(user);
    emit('signout');
  } catch (error) {
    accountMessage.value = error instanceof Error ? error.message.replace('Firebase: ', '') : 'Unable to delete account.';
    accountLoading.value = false;
  }
};
</script>