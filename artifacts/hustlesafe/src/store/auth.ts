import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Worker } from '@workspace/api-client-react';

export type UserRole = 'worker' | 'insurer' | null;

interface FirebaseUserInfo {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
}

interface AuthState {
  role: UserRole;
  worker: Worker | null;
  firebaseUser: FirebaseUserInfo | null;
  isAuthenticated: boolean;
  loginWorker: (worker: Worker, fbUser?: FirebaseUserInfo) => void;
  loginInsurer: (fbUser?: FirebaseUserInfo) => void;
  setFirebaseUser: (user: FirebaseUserInfo | null) => void;
  updateWorker: (updates: Partial<Worker>) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      role: null,
      worker: null,
      firebaseUser: null,
      isAuthenticated: false,
      loginWorker: (worker, fbUser) =>
        set({
          role: 'worker',
          worker,
          firebaseUser: fbUser ?? null,
          isAuthenticated: true,
        }),
      loginInsurer: (fbUser) =>
        set({
          role: 'insurer',
          worker: null,
          firebaseUser: fbUser ?? null,
          isAuthenticated: true,
        }),
      setFirebaseUser: (user) => set({ firebaseUser: user }),
      updateWorker: (updates) =>
        set((state) => ({
          worker: state.worker ? { ...state.worker, ...updates } : null,
        })),
      logout: () =>
        set({
          role: null,
          worker: null,
          firebaseUser: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'hustlesafe-auth',
    }
  )
);
