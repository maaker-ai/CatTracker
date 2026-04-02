export type HydrationLevel = 'Low' | 'Normal' | 'High';
export type ActivityLevel = 'Calm' | 'Normal' | 'Active' | 'Hyper';
export type Gender = 'Male' | 'Female';

export interface Cat {
  id: number;
  name: string;
  breed: string;
  birthday: string; // ISO date string
  gender: Gender;
  neutered: boolean;
  photoUri?: string;
}

export interface WeightRecord {
  id: number;
  catId: number;
  weight: number; // in kg
  date: string; // ISO date string
}

export interface DailyLog {
  id: number;
  catId: number;
  date: string; // ISO date string
  time: string; // HH:mm format
  litterVisits: number;
  appetite: number; // 1-5
  hydration: HydrationLevel;
  activity: ActivityLevel;
  notes: string;
  tags: string; // comma separated behavior tags
  createdAt: string; // ISO datetime string
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  enabled: boolean;
  iconBg: string;
}
