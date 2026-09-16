import { createRouter, createWebHistory } from '@ionic/vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { authReady } from '../auth';
import { auth } from '../firebase';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
  },
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/HomePage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  await authReady;
  const user = auth.currentUser;
  if (to.name !== 'Login' && !user) return { name: 'Login' };
  if (to.name !== 'Login' && user && !user.emailVerified) return { name: 'Login', query: { verify: '1' } };
  if (to.name === 'Login' && user?.emailVerified) return { name: 'Home' };
  return true;
});

export default router;
