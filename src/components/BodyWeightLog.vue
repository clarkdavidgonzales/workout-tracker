<template>
  <section class="body-weight-panel">
    <div class="body-weight-heading">
      <div>
        <p class="section-kicker">BODY WEIGHT</p>
        <h2>Daily measurement</h2>
        <p class="body-weight-help">Enter your measured weight for the selected day only.</p>
      </div>
      <time :datetime="selectedDate">{{ formattedSelectedDate }}</time>
    </div>
    <div class="weight-status">
      <div class="weight-status-value">
        <strong>{{ selectedEntry?.weight.toFixed(1) ?? '--' }}</strong><span>kg logged</span>
      </div>
      <div v-if="change !== null" class="weight-change" :class="{ gain: change > 0, loss: change < 0 }">
        {{ change > 0 ? '+' : '' }}{{ change.toFixed(1) }} kg
        <small>from previous log</small>
      </div>
      <span v-else class="weight-change empty">No previous measurement</span>
    </div>
    <div class="body-weight-form">
      <label>Measured weight (kg)
        <input v-model.number="weight" type="number" min="30" max="500" step="0.1" placeholder="e.g. 70.5" />
      </label>
      <button type="button" @click="save">Save measurement</button>
    </div>
    <p v-if="message" class="body-weight-message">{{ message }}</p>
    <div v-if="recentEntries.length" class="weight-history">
      <div v-for="entry in recentEntries" :key="entry.date">
        <span>{{ entry.date }}</span><strong>{{ entry.weight.toFixed(1) }} kg</strong>
        <button type="button" aria-label="Delete weight log" title="Delete weight log" @click="remove(entry.date)">Delete</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface BodyWeightEntry {
  date: string;
  weight: number;
}

const props = defineProps<{ selectedDate: string; entries: Record<string, BodyWeightEntry> }>();
const emit = defineEmits<{ save: [entry: BodyWeightEntry]; remove: [date: string] }>();
const weight = ref<number | null>(props.entries[props.selectedDate]?.weight ?? null);
const message = ref('');

watch(() => props.selectedDate, (date) => {
  weight.value = props.entries[date]?.weight ?? null;
  message.value = '';
});

const recentEntries = computed(() => Object.values(props.entries).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5));
const selectedEntry = computed(() => props.entries[props.selectedDate]);
const orderedEntries = computed(() => Object.values(props.entries).sort((a, b) => a.date.localeCompare(b.date)));
const previousEntry = computed(() => orderedEntries.value.filter((entry) => entry.date < props.selectedDate).at(-1));
const change = computed(() => selectedEntry.value && previousEntry.value ? selectedEntry.value.weight - previousEntry.value.weight : null);
const formattedSelectedDate = computed(() => new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${props.selectedDate}T00:00:00`)));

const save = () => {
  const value = Number(weight.value);
  if (!Number.isFinite(value) || value < 30 || value > 500) {
    message.value = 'Enter a body weight between 30 and 500 kg.';
    return;
  }
  emit('save', { date: props.selectedDate, weight: Math.round(value * 10) / 10 });
  message.value = 'Measurement saved.';
};

const remove = (date: string) => {
  if (window.confirm(`Delete the body-weight measurement for ${date}?`)) emit('remove', date);
};
</script>
