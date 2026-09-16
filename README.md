# SpartanLog - Ionic Vue Workout Tracker

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
- Save workout records and photos in Firebase Realtime Database
- Email/password authentication with persistent login sessions
- Private user profiles with personalized calorie estimates
- Daily analysis for completed time, volume, and estimated calories
- Responsive desktop and mobile interface

## Run the project

```bash
npm install
npm run dev
```

Then open the local address shown by Vite.

## Firebase setup

Create a `.env` file from the Firebase project values used by `src/firebase.ts`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

In Firebase Console, enable **Authentication > Sign-in method > Email/Password** and use Realtime Database rules that scope data to the signed-in user:

The same rules are committed in `database.rules.json`. Deploy them with the Firebase CLI from this directory:

```bash
firebase login
firebase use workoutcrud
firebase deploy --only database
```

```json
{
	"rules": {
		"users": {
			"$uid": {
				".read": "auth != null && auth.uid === $uid",
				".write": "auth != null && auth.uid === $uid"
			}
		}
	}
}
```

Calorie estimates use the Mifflin-St Jeor maintenance formula and category MET values. They are estimates for tracking, not medical advice.

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
