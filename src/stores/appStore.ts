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
  isPro: boolean;
  activeCatId: number | null;
  reminders: Reminder[];

  setIsPro: (val: boolean) => void;
  setActiveCatId: (id: number) => void;
  toggleReminder: (id: string) => void;
  setReminders: (reminders: Reminder[]) => void;
  updateReminderDate: (id: string, date: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isPro: false,
      activeCatId: null,
      reminders: [
        { id: 'vaccine', title: 'Vaccine Reminder', date: 'Apr 15, 2026', enabled: true },
        { id: 'deworming', title: 'Deworming', date: 'Jun 1, 2026', enabled: false },
        { id: 'checkup', title: 'Annual Checkup', date: 'Aug 20, 2026', enabled: true },
      ],

      setIsPro: (val) => set({ isPro: val }),
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
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => ({
        isPro: state.isPro,
        activeCatId: state.activeCatId,
        reminders: state.reminders,
      }),
    }
  )
);
