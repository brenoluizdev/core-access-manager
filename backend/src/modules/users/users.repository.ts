import { randomUUID } from 'node:crypto';

import { getDatabase } from '../../config/database';
import { type UserRecord, type UserRole, rowToUser } from './users.model';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ListOptions {
  page: number;
  perPage: number;
  search?: string;
}

export interface PaginatedUsers {
  items: UserRecord[];
  total: number;
}

const COLUMNS = 'id, name, email, password_hash, role, is_active, created_at, updated_at';

export const usersRepository = {
  create(data: CreateUserData): UserRecord {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = randomUUID();

    db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(id, data.name, data.email, data.passwordHash, data.role, now, now);

    const created = this.findById(id);

    if (!created) {
      throw new Error('Falha ao persistir o usuário.');
    }

    return created;
  },

  findById(id: string): UserRecord | null {
    const row = getDatabase().prepare(`SELECT ${COLUMNS} FROM users WHERE id = ?`).get(id);

    return row ? rowToUser(row) : null;
  },

  findByEmail(email: string): UserRecord | null {
    const row = getDatabase()
      .prepare(`SELECT ${COLUMNS} FROM users WHERE email = ? COLLATE NOCASE`)
      .get(email);

    return row ? rowToUser(row) : null;
  },

  countAll(): number {
    const row = getDatabase().prepare('SELECT COUNT(*) AS total FROM users').get() as {
      total: number;
    };

    return Number(row.total);
  },

  list({ page, perPage, search }: ListOptions): PaginatedUsers {
    const db = getDatabase();
    const term = search ? `%${search}%` : null;
    const where = term ? 'WHERE name LIKE ? OR email LIKE ?' : '';
    const params = term ? [term, term] : [];

    const totalRow = db
      .prepare(`SELECT COUNT(*) AS total FROM users ${where}`)
      .get(...params) as { total: number };

    const rows = db
      .prepare(
        `SELECT ${COLUMNS} FROM users ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, perPage, (page - 1) * perPage);

    return {
      items: rows.map(rowToUser),
      total: Number(totalRow.total),
    };
  },

  update(id: string, data: UpdateUserData): UserRecord | null {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }

    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }

    if (data.passwordHash !== undefined) {
      fields.push('password_hash = ?');
      values.push(data.passwordHash);
    }

    if (data.role !== undefined) {
      fields.push('role = ?');
      values.push(data.role);
    }

    if (data.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    getDatabase()
      .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
      .run(...values, id);

    return this.findById(id);
  },

  remove(id: string): boolean {
    const result = getDatabase().prepare('DELETE FROM users WHERE id = ?').run(id);

    return Number(result.changes) > 0;
  },
};
