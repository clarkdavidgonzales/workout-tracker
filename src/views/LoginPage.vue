<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <main class="auth-shell">
        <section class="auth-intro">
          <a class="brand" href="#">
            <span class="brand-mark"><ion-icon :icon="barbell" /></span>
            <span>Spartan<span>Log</span></span>
          </a>
          <div>
            <p class="eyebrow"><ion-icon :icon="flashOutline" /> TRAIN WITH INTENTION</p>
            <h1>Your training, <em>made visible.</em></h1>
            <p>Keep every session, set, and improvement in one calm place.</p>
          </div>
          <div class="auth-stat"><strong>01</strong><span>private training log<br />for your next best set</span></div>
        </section>

        <section class="auth-panel">
          <div class="auth-panel-heading">
            <p class="section-kicker">{{ isRegistering ? 'NEW ATHLETE' : 'WELCOME BACK' }}</p>
            <h2>{{ isRegistering ? 'Create your account' : 'Sign in to SpartanLog' }}</h2>
            <p>{{ isRegistering ? 'Start making your training data work for you.' : 'Your sessions are waiting.' }}</p>
          </div>

          <form @submit.prevent="submit">
            <ion-item v-if="isRegistering">
              <ion-input v-model="displayName" label="Name" label-placement="stacked" autocomplete="name" required />
            </ion-item>
            <ion-item>
              <ion-input v-model="email" type="email" label="Email" label-placement="stacked" autocomplete="email" required />
            </ion-item>
            <ion-item>
              <ion-input v-model="password" type="password" label="Password" label-placement="stacked" :minlength="6" autocomplete="current-password" required />
            </ion-item>
            <button v-if="!isRegistering" type="button" class="forgot-password" :disabled="loading" @click="forgotPassword">
              Forgot password?
            </button>
            <div v-if="verificationMessage" class="verification-message">
              <strong>Check your inbox</strong>
              <span>{{ verificationMessage }}</span>
              <button v-if="verificationSent && !isRegistering" type="button" @click="resendVerification">Resend verification email</button>
            </div>
            <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
            <ion-button type="submit" expand="block" class="auth-submit" :disabled="loading">
              {{ loading ? 'Please wait...' : isRegistering ? 'Create account' : 'Sign in' }}
              <ion-icon slot="end" :icon="arrowForwardOutline" />
            </ion-button>
          </form>

          <button class="mode-toggle" type="button" @click="toggleMode">
            {{ isRegistering ? 'Already have an account? Sign in' : 'New here? Create an account' }}
          </button>
        </section>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonPage } from '@ionic/vue';
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { arrowForwardOutline, barbell, flashOutline } from 'ionicons/icons';
import { auth } from '../firebase';

const router = useRouter();
const route = useRoute();
const isRegistering = ref(false);
const loading = ref(false);
const email = ref('');
const password = ref('');
const displayName = ref('');
const errorMessage = ref('');
const verificationMessage = ref('');
const verificationSent = ref(false);

onMounted(() => {
  if (route.query.verify) {
    verificationMessage.value = 'Verify your email before entering SpartanLog. Check your inbox, then sign in again.';
  }
});

const toggleMode = () => {
  isRegistering.value = !isRegistering.value;
  errorMessage.value = '';
  verificationMessage.value = '';
};

const submit = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    if (isRegistering.value) {
      const credential = await createUserWithEmailAndPassword(auth, email.value.trim(), password.value);
      await updateProfile(credential.user, { displayName: displayName.value.trim() });
      await sendEmailVerification(credential.user);
      verificationSent.value = true;
      verificationMessage.value = `Verification email sent to ${email.value.trim()}. Open it, then return here to sign in.`;
      await signOut(auth);
      isRegistering.value = false;
      password.value = '';
    } else {
      const credential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        verificationSent.value = true;
        verificationMessage.value = 'Your email is not verified yet. We sent another verification email.';
        await signOut(auth);
        return;
      }
      await router.replace({ name: 'Home' });
    }
  } catch (error) {
    const authCode = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (authCode === 'auth/configuration-not-found') {
      errorMessage.value = 'Firebase Authentication is not enabled for this project. Enable it in Firebase Console, then restart the app.';
    } else {
      errorMessage.value = error instanceof Error ? error.message.replace('Firebase: ', '') : 'Unable to authenticate.';
    }
  } finally {
    loading.value = false;
  }
};

const resendVerification = async () => {
  const credential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
  await sendEmailVerification(credential.user);
  await signOut(auth);
  verificationSent.value = true;
  verificationMessage.value = `Verification email sent to ${email.value.trim()}.`;
};

const forgotPassword = async () => {
  const address = email.value.trim();
  if (!address) {
    errorMessage.value = 'Enter your email address first.';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  verificationMessage.value = '';
  try {
    await sendPasswordResetEmail(auth, address);
    verificationMessage.value = `Password reset email sent to ${address}. Check your inbox.`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message.replace('Firebase: ', '') : 'Unable to send password reset email.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-shell { min-height: 100%; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(360px, .9fr); background: #f8f8f6; }
.auth-intro { min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 48px clamp(28px, 8vw, 120px); color: white; background: linear-gradient(135deg, #17191b, #313639); }
.brand { display: flex; align-items: center; gap: 10px; color: white; font: 800 1.2rem 'Manrope', sans-serif; text-decoration: none; }
.brand > span:last-child span { color: #ff7949; }
.brand-mark { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 11px; color: white; background: #ff6b35; }
.eyebrow, .section-kicker { color: #ff936d; font-size: .7rem; font-weight: 700; letter-spacing: .16em; }
.eyebrow { display: flex; align-items: center; gap: 7px; }
.auth-intro h1 { max-width: 600px; margin: 16px 0; font: 800 clamp(2.6rem, 6vw, 5.6rem)/1.02 'Manrope', sans-serif; letter-spacing: -.05em; }
.auth-intro h1 em { color: #ff7949; font-style: normal; }
.auth-intro p:not(.eyebrow) { max-width: 420px; color: rgba(255,255,255,.63); font-size: 1.05rem; line-height: 1.6; }
.auth-stat { display: flex; align-items: center; gap: 14px; color: rgba(255,255,255,.62); font-size: .8rem; line-height: 1.4; }
.auth-stat strong { color: #ff7949; font: 800 2.1rem 'Manrope', sans-serif; }
.auth-panel { width: min(430px, calc(100% - 48px)); align-self: center; justify-self: center; }
.auth-panel-heading { margin-bottom: 30px; }
.auth-panel-heading p { color: #74777e; line-height: 1.5; }
.auth-panel-heading h2 { margin: 7px 0 8px; color: #17191d; font: 800 2rem 'Manrope', sans-serif; letter-spacing: -.04em; }
.auth-panel ion-item { --background: #fff; --border-color: #e6e5e1; --border-radius: 13px; --highlight-color: #ff6b35; margin-bottom: 11px; }
.auth-submit { height: 50px; margin: 19px 0 0; --border-radius: 13px; --background: #ff6b35; font-weight: 700; text-transform: none; }
.auth-error { margin: 14px 2px 0; color: #bd4d2d; font-size: .78rem; }
.forgot-password { display: block; margin: 5px 2px 0 auto; padding: 0; border: 0; color: #e75221; background: transparent; font-size: .72rem; cursor: pointer; }
.forgot-password:disabled { opacity: .55; cursor: not-allowed; }
.verification-message { display: grid; gap: 5px; margin: 14px 2px 0; padding: 12px; border-radius: 12px; color: #17644a; background: #e6f7f0; font-size: .75rem; line-height: 1.4; }
.verification-message button { width: fit-content; padding: 0; border: 0; color: #17644a; background: transparent; font-size: .72rem; font-weight: 700; text-decoration: underline; cursor: pointer; }
.mode-toggle { display: block; margin: 22px auto 0; padding: 0; border: 0; color: #e75221; background: transparent; font-size: .8rem; cursor: pointer; }
@media (max-width: 760px) { .auth-shell { display: block; } .auth-intro { min-height: 330px; padding: 28px 25px; } .auth-intro h1 { font-size: 3rem; } .auth-stat { display: none; } .auth-panel { padding: 48px 0; } }
</style>