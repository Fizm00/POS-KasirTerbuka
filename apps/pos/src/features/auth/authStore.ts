import { create } from "zustand";
import type { User } from "../../db/schema";

export interface AuthState {
  currentUser: User | null;
  isLocked: boolean;
  autoLockMinutes: number;
  lastActivityTime: number;

  unlock: (user: User) => void;
  lock: () => void;
  recordActivity: () => void;
  setAutoLockMinutes: (minutes: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLocked: true,
  autoLockMinutes: 5,
  lastActivityTime: Date.now(),

  unlock: (user: User) =>
    set({
      currentUser: user,
      isLocked: false,
      lastActivityTime: Date.now(),
    }),

  lock: () =>
    set({
      currentUser: null,
      isLocked: true,
    }),

  recordActivity: () =>
    set({
      lastActivityTime: Date.now(),
    }),

  setAutoLockMinutes: (minutes: number) =>
    set({
      autoLockMinutes: minutes,
    }),
}));
