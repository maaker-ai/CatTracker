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

// --- Seed data for first launch ---

export async function seedDefaultCat(): Promise<number> {
  const cats = await getCats();
  if (cats.length > 0) return cats[0].id;

  const catId = await insertCat({
    name: 'Mochi',
    breed: 'Scottish Fold',
    birthday: '2022-05-12',
    gender: 'Female',
    neutered: true,
  });

  return catId;
}
