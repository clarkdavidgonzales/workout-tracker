import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';

export const authReady = new Promise<User | null>((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    resolve(user);
    unsubscribe();
  });
});