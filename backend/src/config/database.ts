import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { env } from './env';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
`;

let database: DatabaseSync | undefined;

/**
 * Abre (ou cria) o banco SQLite. Usa `node:sqlite`, nativo do Node 22+,
 * para não depender de módulos compilados.
 */
export function createDatabase(file: string): DatabaseSync {
  if (file !== ':memory:') {
    mkdirSync(dirname(file), { recursive: true });
  }

  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);

  return db;
}

export function getDatabase(): DatabaseSync {
  if (!database) {
    database = createDatabase(env.databaseFile);
  }

  return database;
}

export function closeDatabase(): void {
  database?.close();
  database = undefined;
}
