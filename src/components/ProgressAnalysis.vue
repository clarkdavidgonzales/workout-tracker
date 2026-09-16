<template>
  <section class="analysis-dropdown-card">
    <div class="analysis-dropdown-heading">
      <div>
        <p class="section-kicker">SPARTAN ANALYZE</p>
        <h2>Your training readout</h2>
        <p>Based on your criteria, logs, and recent progress.</p>
      </div>
      <ion-icon :icon="analyticsOutline" />
    </div>

    <div class="analysis-metrics">
      <div><strong>{{ completedCount }}</strong><span>completed</span></div>
      <div><strong>{{ completionRate }}%</strong><span>completion</span></div>
      <div><strong>{{ totalVolume.toLocaleString() }}</strong><span>volume kg</span></div>
      <div><strong>{{ averageDuration }}</strong><span>avg min/session</span></div>
    </div>

    <div class="analysis-advice">
      <div v-for="advice in adviceItems" :key="advice.title" class="advice-item" :class="advice.tone">
        <strong>{{ advice.title }}</strong>
        <span>{{ advice.text }}</span>
      </div>
    </div>

    <p class="analysis-footnote">Keep logging consistently. Advice is an estimate, not medical guidance.</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon } from '@ionic/vue';
import { analyticsOutline } from 'ionicons/icons';
import type { UserProfile, Workout } from '../types/workout';

const props = defineProps<{ profile: UserProfile; workouts: Workout[]; bodyWeightEntries: Record<string, { date: string; weight: number }> }>();

const completedWorkouts = computed(() => props.workouts.filter((workout) => workout.completed));
const completedCount = computed(() => completedWorkouts.value.length);
const completionRate = computed(() => props.workouts.length ? Math.round((completedCount.value / props.workouts.length) * 100) : 0);
const totalVolume = computed(() => completedWorkouts.value.reduce((total, workout) => total + workout.sets * workout.reps * workout.weight, 0));
const totalSets = computed(() => completedWorkouts.value.reduce((total, workout) => total + workout.sets, 0));
const averageDuration = computed(() => completedCount.value ? Math.round(completedWorkouts.value.reduce((total, workout) => total + workout.duration, 0) / completedCount.value) : 0);
const averageVolume = computed(() => completedCount.value ? Math.round(totalVolume.value / completedCount.value) : 0);
const recentWeights = computed(() => Object.values(props.bodyWeightEntries).sort((a, b) => a.date.localeCompare(b.date)).slice(-2));
const weightChange = computed(() => recentWeights.value.length === 2 ? recentWeights.value[1].weight - recentWeights.value[0].weight : 0);
const activeGroups = computed(() => new Set(props.workouts.filter((workout) => workout.completed).map((workout) => workout.category)));

const adviceItems = computed(() => {
  const items: Array<{ title: string; text: string; tone: string }> = [];
  if (!props.workouts.length) items.push({ title: 'Start with consistency', text: `Plan ${Math.min(3, 7 - props.profile.busyDays.length)} short sessions around your busy days.`, tone: 'neutral' });
  else if (completionRate.value < 60) items.push({ title: 'Reduce the load', text: 'You are completing less than 60% of planned sessions. Use shorter workouts or fewer training days.', tone: 'warning' });
  else items.push({ title: 'Consistency is strong', text: 'Keep your current schedule and increase weight slowly when sessions feel manageable.', tone: 'positive' });

  if (completedCount.value && averageDuration.value > props.profile.availableMinutes) items.push({ title: 'Session time is high', text: `Average sessions are ${averageDuration.value} minutes, above your ${props.profile.availableMinutes}-minute target. Trim accessory work or rest periods.`, tone: 'warning' });
  else if (completedCount.value) items.push({ title: 'Training dose', text: `${totalSets.value} total sets logged at about ${averageVolume.value.toLocaleString()} kg volume per session.`, tone: 'neutral' });

  const missingGroups = (props.profile.targetMuscleGroups ?? []).filter((group) => !activeGroups.value.has(group));
  if (missingGroups.length) items.push({ title: 'Muscle groups to revisit', text: `${missingGroups.slice(0, 3).join(', ')} have no completed logged sessions yet.`, tone: 'warning' });
  else items.push({ title: 'Coverage looks balanced', text: 'Your completed logs include the selected muscle groups.', tone: 'positive' });

  if (recentWeights.value.length < 2) items.push({ title: 'Log more body weight', text: 'Add measurements on different days to estimate whether your Bulk or Cut goal is working.', tone: 'neutral' });
  else if (props.profile.experienceLevel === 'beginner' && Math.abs(weightChange.value) > 2) items.push({ title: 'Watch the rate of change', text: 'Your recent weight changed quickly. Keep the plan steady and review another week of data.', tone: 'warning' });
  else items.push({ title: 'Progress is being tracked', text: `${weightChange.value >= 0 ? '+' : ''}${weightChange.value.toFixed(1)} kg across recent measurements.`, tone: 'positive' });

  return items;
});
</script>
