import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import type { Phase, SpecFlowState } from './types';

export type VersionSummary = {
  id: number;
  createdAt: string;
  label: string;
  trigger: string;
  phase: Phase;
};

export type VersionFull = VersionSummary & {
  state: SpecFlowState;
};

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(path.join(dataDir, 'specflow.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      label TEXT NOT NULL,
      trigger TEXT NOT NULL,
      phase TEXT NOT NULL,
      state_json TEXT NOT NULL
    )
  `);

  return db;
}

export function createVersion(
  label: string,
  trigger: string,
  state: SpecFlowState,
): number {
  const d = getDb();
  const stmt = d.prepare(
    'INSERT INTO versions (label, trigger, phase, state_json) VALUES (?, ?, ?, ?)',
  );
  const result = stmt.run(label, trigger, state.phase, JSON.stringify(state));
  return Number(result.lastInsertRowid);
}

export function listVersions(): VersionSummary[] {
  const d = getDb();
  const rows = d
    .prepare(
      'SELECT id, created_at, label, trigger, phase FROM versions ORDER BY id DESC',
    )
    .all() as { id: number; created_at: string; trigger: string; label: string; phase: Phase }[];

  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    label: r.label,
    trigger: r.trigger,
    phase: r.phase,
  }));
}

export function getVersion(id: number): VersionFull | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM versions WHERE id = ?').get(id) as
    | { id: number; created_at: string; label: string; trigger: string; phase: Phase; state_json: string }
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    createdAt: row.created_at,
    label: row.label,
    trigger: row.trigger,
    phase: row.phase,
    state: JSON.parse(row.state_json) as SpecFlowState,
  };
}
