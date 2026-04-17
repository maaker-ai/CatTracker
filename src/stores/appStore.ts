import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback in-memory storage in case AsyncStorage native module is unavailable
const memoryStorage = new Map<string, string>();
const fallbackStorage: StateStorage = {
  getItem: (name) => memoryStorage.get(name) ?? null,
  setItem: (name, value) => { memoryStorage.set(name, value); },
  removeItem: (name) => { memoryStorage.delete(name); },
};

function getSafeStorage(): StateStorage {
  try {
    // Quick check: if the native module is available, AsyncStorage will work
    if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      return AsyncStorage;
    }
  } catch {
    // Native module not available
  }
  console.warn('AsyncStorage unavailable, using in-memory fallback');
  return fallbackStorage;
}

interface Reminder {
  id: string;
  title: string;
  date: string;
  enabled: boolean;
}

interface AppState {
  activeCatId: number | null;
  reminders: Reminder[];

  setActiveCatId: (id: number) => void;
  toggleReminder: (id: string) => void;
  setReminders: (reminders: Reminder[]) => void;
  updateReminderDate: (id: string, date: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeCatId: null,
      reminders: [
        { id: 'feeding', title: 'Feeding Reminder', date: '', enabled: true },
        { id: 'waterChange', title: 'Water Change Reminder', date: '', enabled: false },
      ],

      setActiveCatId: (id) => set({ activeCatId: id }),
      toggleReminder: (id) => {
        const reminders = get().reminders.map((r) =>
          r.id === id ? { ...r, enabled: !r.enabled } : r
        );
        set({ reminders });
      },
      setReminders: (reminders) => set({ reminders }),
      updateReminderDate: (id, date) => {
        const reminders = get().reminders.map((r) =>
          r.id === id ? { ...r, date } : r
        );
        set({ reminders });
      },
    }),
    {
      name: 'cattracker-app-store',
      version: 2,
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => ({
        activeCatId: state.activeCatId,
        reminders: state.reminders,
      }),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0) {
          // v0 → v1: replace vaccine/deworming/checkup reminders with feeding/waterChange
          state.reminders = [
            { id: 'feeding', title: 'Feeding Reminder', date: '', enabled: true },
            { id: 'waterChange', title: 'Water Change Reminder', date: '', enabled: false },
          ];
        }
        if (version < 2) {
          // v1 → v2: removed isPro (paid app model, all features unlocked)
          delete state.isPro;
        }
        return state as unknown as AppState;
      },
    }
  )
);
