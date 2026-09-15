import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const requiredEnv = (name: keyof ImportMetaEnv): string => {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  databaseURL: requiredEnv("VITE_FIREBASE_DATABASE_URL"),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: requiredEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requiredEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requiredEnv("VITE_FIREBASE_APP_ID")
};

export const firebaseApp = initializeApp(firebaseConfig);
export const database = getDatabase(firebaseApp);