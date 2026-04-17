import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type ConfirmationResult,
  type Auth,
} from "firebase/auth";

export type { ConfirmationResult };

// ── Firebase Configuration ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);

export const isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

// ── reCAPTCHA Setup ─────────────────────────────────────────────────────
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  // Clean up existing verifier
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore cleanup errors
    }
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved — will proceed with phone sign-in
    },
    "expired-callback": () => {
      // reCAPTCHA expired — reset
      recaptchaVerifier = null;
    },
  });

  return recaptchaVerifier;
}

// ── Phone Authentication ────────────────────────────────────────────────
export async function sendOtp(
  phoneNumber: string,
  recaptcha: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, recaptcha);
}

export async function verifyOtp(
  confirmationResult: ConfirmationResult,
  otp: string
) {
  return confirmationResult.confirm(otp);
}

// ── Email/Password Authentication ───────────────────────────────────────
export async function emailSignIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function emailSignUp(
  email: string,
  password: string,
  displayName?: string
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential;
}

// ── Sign Out ────────────────────────────────────────────────────────────
export async function firebaseSignOut() {
  return signOut(auth);
}
