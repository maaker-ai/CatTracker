import * as SQLite from 'expo-sqlite';
import type { Cat, DailyLog, WeightRecord } from '@/types';

interface CatRow {
  id: number;
  name: string;
  breed: string;
  birthday: string;
  gender: string;
  neutered: number;
  photoUri: string | null;
}

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('cattracker.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS cats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      breed TEXT NOT NULL DEFAULT '',
      birthday TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL DEFAULT 'Female',
      neutered INTEGER NOT NULL DEFAULT 0,
      photoUri TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS weight_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      catId INTEGER NOT NULL,
      weight REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (catId) REFERENCES cats(id)
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      catId INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      litterVisits INTEGER NOT NULL DEFAULT 0,
      appetite INTEGER NOT NULL DEFAULT 3,
      hydration TEXT NOT NULL DEFAULT 'Normal',
      activity TEXT NOT NULL DEFAULT 'Normal',
      notes TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (catId) REFERENCES cats(id)
    );

    CREATE TABLE IF NOT EXISTS quick_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      catId INTEGER NOT NULL,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (catId) REFERENCES cats(id)
    );
  `);
  return db;
}

// --- Cat CRUD ---

export async function getCats(): Promise<Cat[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<CatRow>('SELECT * FROM cats');
  return rows.map((r) => ({ ...r, gender: r.gender as Cat['gender'], neutered: Boolean(r.neutered), photoUri: r.photoUri ?? undefined }));
}

export async function getCatById(id: number): Promise<Cat | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CatRow>(
    'SELECT * FROM cats WHERE id = ?',
    [id]
  );
  if (!row) return null;
  return { ...row, gender: row.gender as Cat['gender'], neutered: Boolean(row.neutered), photoUri: row.photoUri ?? undefined };
}

export async function insertCat(cat: Omit<Cat, 'id'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO cats (name, breed, birthday, gender, neutered, photoUri) VALUES (?, ?, ?, ?, ?, ?)',
    [cat.name, cat.breed, cat.birthday, cat.gender, cat.neutered ? 1 : 0, cat.photoUri ?? null]
  );
  return result.lastInsertRowId;
}

export async function updateCat(cat: Cat): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE cats SET name = ?, breed = ?, birthday = ?, gender = ?, neutered = ?, photoUri = ? WHERE id = ?',
    [cat.name, cat.breed, cat.birthday, cat.gender, cat.neutered ? 1 : 0, cat.photoUri ?? null, cat.id]
  );
}

// --- Weight Records ---

export async function getWeightRecords(catId: number): Promise<WeightRecord[]> {
  const database = await getDatabase();
  return database.getAllAsync<WeightRecord>(
    'SELECT * FROM weight_records WHERE catId = ? ORDER BY date ASC',
    [catId]
  );
}

export async function insertWeightRecord(record: Omit<WeightRecord, 'id'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO weight_records (catId, weight, date) VALUES (?, ?, ?)',
    [record.catId, record.weight, record.date]
  );
  return result.lastInsertRowId;
}

// --- Daily Logs ---

export async function getLogs(catId: number, limit = 50): Promise<DailyLog[]> {
  const database = await getDatabase();
  return database.getAllAsync<DailyLog>(
    'SELECT * FROM logs WHERE catId = ? ORDER BY createdAt DESC LIMIT ?',
    [catId, limit]
  );
}

export async function getTodayLog(catId: number): Promise<DailyLog | null> {
  const database = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  return database.getFirstAsync<DailyLog>(
    'SELECT * FROM logs WHERE catId = ? AND date = ? ORDER BY createdAt DESC LIMIT 1',
    [catId, today]
  );
}

export async function insertLog(log: Omit<DailyLog, 'id'>): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO logs (catId, date, time, litterVisits, appetite, hydration, activity, notes, tags, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      log.catId,
      log.date,
      log.time,
      log.litterVisits,
      log.appetite,
      log.hydration,
      log.activity,
      log.notes,
      log.tags,
      log.createdAt,
    ]
  );
  return result.lastInsertRowId;
}

export async function getAppetiteTrend(catId: number, days = 7): Promise<{ date: string; appetite: number }[]> {
  const database = await getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const startStr = startDate.toISOString().slice(0, 10);
  return database.getAllAsync<{ date: string; appetite: number }>(
    'SELECT date, MAX(appetite) as appetite FROM logs WHERE catId = ? AND date >= ? GROUP BY date ORDER BY date ASC',
    [catId, startStr]
  );
}

// --- Seed data for first launch ---

// --- Quick Logs (bathroom / water tap tracking) ---

export async function insertQuickLog(catId: number, type: 'bathroom' | 'water'): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO quick_logs (catId, type, timestamp) VALUES (?, ?, ?)',
    [catId, type, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function getQuickLogCount(catId: number, type: 'bathroom' | 'water', date: string): Promise<number> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM quick_logs WHERE catId = ? AND type = ? AND date(timestamp) = ?",
    [catId, type, date]
  );
  return row?.count ?? 0;
}

export async function getQuickLogAverage(catId: number, type: 'bathroom' | 'water', days = 7): Promise<number> {
  const database = await getDatabase();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const row = await database.getFirstAsync<{ avg: number | null }>(
    "SELECT CAST(COUNT(*) AS REAL) / ? as avg FROM quick_logs WHERE catId = ? AND type = ? AND date(timestamp) > ? AND date(timestamp) <= ?",
    [days, catId, type, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]
  );
  return row?.avg ?? 0;
}

export async function getQuickLogHistory(catId: number, type: 'bathroom' | 'water', days = 7): Promise<{ date: string; count: number }[]> {
  const database = await getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const startStr = startDate.toISOString().slice(0, 10);
  return database.getAllAsync<{ date: string; count: number }>(
    "SELECT date(timestamp) as date, COUNT(*) as count FROM quick_logs WHERE catId = ? AND type = ? AND date(timestamp) >= ? GROUP BY date(timestamp) ORDER BY date ASC",
    [catId, type, startStr]
  );
}

export async function getLatestWeight(catId: number): Promise<number | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ weight: number }>(
    'SELECT weight FROM weight_records WHERE catId = ? ORDER BY date DESC LIMIT 1',
    [catId]
  );
  return row?.weight ?? null;
}

export async function deleteQuickLog(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM quick_logs WHERE id = ?', [id]);
}

// --- Seed data for first launch ---

export async function seedDefaultCat(): Promise<number> {
  const cats = await getCats();
  if (cats.length > 0) {
    // Already seeded; just return the first cat id
    return cats[0].id;
  }

  // If demo seed flag is set (build-time env), populate full demo dataset
  if (process.env.EXPO_PUBLIC_SEED_DEMO === '1') {
    const demoCatId = await seedDemoData();
    return demoCatId;
  }

  const catId = await insertCat({
    name: 'Mochi',
    breed: 'Orange Tabby',
    birthday: '2022-05-12',
    gender: 'Female',
    neutered: true,
  });

  return catId;
}

// Seed comprehensive demo dataset for screenshots / App Store listing
async function seedDemoData(): Promise<number> {
  const database = await getDatabase();

  // Helper: seeded-ish pseudo-random so runs are stable-ish
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const chance = (p: number) => rand() < p;

  // --- Two cats ---
  const mochiId = await insertCat({
    name: 'Mochi',
    breed: 'Orange Tabby',
    birthday: '2023-05-12',
    gender: 'Female',
    neutered: true,
  });

  const lunaId = await insertCat({
    name: 'Luna',
    breed: 'British Shorthair',
    birthday: '2024-02-08',
    gender: 'Male',
    neutered: true,
  });

  // --- Weight history (monthly, last 6 months) ---
  const today = new Date();
  const mochiWeights = [4.0, 4.1, 4.1, 4.2, 4.2, 4.2];
  const lunaWeights = [3.5, 3.6, 3.7, 3.8, 3.8, 3.8];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const idx = 5 - i;

    await insertWeightRecord({ catId: mochiId, weight: mochiWeights[idx], date: dateStr });
    await insertWeightRecord({ catId: lunaId, weight: lunaWeights[idx], date: dateStr });
  }

  // --- 30 days of daily logs for each cat ---
  const hydrationRoll = (): 'Low' | 'Normal' | 'High' => {
    const r = rand();
    if (r < 0.05) return 'Low';
    if (r < 0.20) return 'High';
    return 'Normal';
  };
  const activityRoll = (): 'Calm' | 'Normal' | 'Active' => {
    const r = rand();
    if (r < 0.10) return 'Calm';
    if (r < 0.30) return 'Active';
    return 'Normal';
  };
  const bathroomRoll = (): number => {
    const r = rand();
    if (r < 0.10) return 1;
    if (r < 0.85) return pick([2, 3]);
    return 4;
  };
  const appetiteRoll = (): number => {
    const r = rand();
    if (r < 0.15) return 3;
    return pick([4, 5]);
  };

  for (const catId of [mochiId, lunaId]) {
    for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      const dateStr = d.toISOString().slice(0, 10);
      const hh = String(18 + Math.floor(rand() * 4)).padStart(2, '0');
      const mm = String(Math.floor(rand() * 60)).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      // No notes in seed data — let i18n placeholder show in Recent Notes
      // (avoids hardcoded English on non-English locales).
      const notes = '';

      // Create per-day createdAt at the log's time
      const createdAt = new Date(d);
      createdAt.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);

      await insertLog({
        catId,
        date: dateStr,
        time: timeStr,
        litterVisits: bathroomRoll(),
        appetite: appetiteRoll(),
        hydration: hydrationRoll(),
        activity: activityRoll(),
        notes,
        tags: '',
        createdAt: createdAt.toISOString(),
      });
    }
  }

  // --- Today's quick logs (so Dashboard shows non-zero counts) ---
  for (const catId of [mochiId, lunaId]) {
    const bathroomCount = 3; // Dashboard hero number
    for (let i = 0; i < bathroomCount; i++) {
      await insertQuickLog(catId, 'bathroom');
      // Small jitter between inserts
      if (chance(0.5)) await insertQuickLog(catId, 'water');
    }
  }

  return mochiId;
}
