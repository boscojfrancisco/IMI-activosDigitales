import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.ts';
import path from 'path';

// Create SQLite database in the app folder so it persists across dev reloads
const sqlite = new Database(path.join(process.cwd(), 'sqlite.db'));
sqlite.pragma('journal_mode = WAL');

// Initialize Drizzle with the sqlite instance and schema.
export const db = drizzle(sqlite, { schema });
