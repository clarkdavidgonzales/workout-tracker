# RepLog - Ionic Vue Workout Tracker

A modern and responsive workout tracking application built with Ionic Vue.

## Features

- Add exercises with muscle group, date, sets, reps, and weight
- Add an optional exercise photo from the device
- Choose from six built-in workout icons when no photo is used
- Automatically resize photos before saving
- Mark workouts as completed or planned
- Edit every saved workout field, icon, or photo
- Search exercises and muscle groups
- Filter All / Planned / Done
- Track completed training volume
- Save workout records and photos in browser `localStorage`
- Responsive desktop and mobile interface

## Run the project

```bash
npm install
npm run dev
```

Then open the local address shown by Vite.

## Build

```bash
npm run build
```

## Main files

- `src/views/HomePage.vue` - main dashboard and data handling
- `src/components/WorkoutForm.vue` - add-workout form and photo picker
- `src/components/WorkoutCard.vue` - individual workout card
- `src/components/WorkoutList.vue` - workout grid
- `src/types/workout.ts` - Workout interface
- `src/theme/app.css` - responsive modern design
