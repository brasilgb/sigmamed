import * as SQLite from 'expo-sqlite';

import { migrations } from '@/database/migrations';

const DATABASE_NAME = 'sigmamed.db';
const LATEST_VERSION = migrations.length;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function runMigrations(database: SQLite.SQLiteDatabase) {
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync(migrations[0]);

  const result = await database.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM schema_migrations'
  );

  const currentVersion = result?.version ?? 0;

  if (currentVersion >= LATEST_VERSION) {
    return;
  }

  await database.withTransactionAsync(async () => {
    for (let version = currentVersion + 1; version <= LATEST_VERSION; version += 1) {
      await database.execAsync(migrations[version - 1]);
      await database.runAsync('INSERT INTO schema_migrations (version) VALUES (?)', version);
    }
  });
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await runMigrations(database);
      return database;
    })();
  }

  return databasePromise;
}

export async function initDatabase() {
  return getDatabase();
}
