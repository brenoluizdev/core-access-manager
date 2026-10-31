import { AppError } from '../errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 80;

export function parseEmail(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(422, 'O e-mail é obrigatório.', 'VALIDATION_ERROR', {
      field: 'email',
    });
  }

  const email = value.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(422, 'Informe um e-mail válido.', 'VALIDATION_ERROR', {
      field: 'email',
    });
  }

  return email;
}

export function parseName(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(422, 'O nome é obrigatório.', 'VALIDATION_ERROR', {
      field: 'name',
    });
  }

  const name = value.trim().replace(/\s+/g, ' ');

  if (name.length > MAX_NAME_LENGTH) {
    throw new AppError(
      422,
      `O nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`,
      'VALIDATION_ERROR',
      { field: 'name' },
    );
  }

  return name;
}

export function parsePassword(value: unknown): string {
  if (typeof value !== 'string') {
    throw new AppError(422, 'A senha é obrigatória.', 'VALIDATION_ERROR', {
      field: 'password',
    });
  }

  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      422,
      `A senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`,
      'VALIDATION_ERROR',
      { field: 'password' },
    );
  }

  if (value.length > MAX_PASSWORD_LENGTH) {
    throw new AppError(
      422,
      `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`,
      'VALIDATION_ERROR',
      { field: 'password' },
    );
  }

  return value;
}

export function parseRole(value: unknown, fallback: 'ADMIN' | 'USER' = 'USER') {
  if (value === undefined) return fallback;

  if (value !== 'ADMIN' && value !== 'USER') {
    throw new AppError(422, 'Perfil inválido. Use ADMIN ou USER.', 'VALIDATION_ERROR', {
      field: 'role',
    });
  }

  return value;
}

export function parseId(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new AppError(422, 'Identificador inválido.', 'VALIDATION_ERROR', {
      field: 'id',
    });
  }

  return value;
}

export function parsePositiveInt(
  value: unknown,
  fallback: number,
  { min = 1, max = 100 }: { min?: number; max?: number } = {},
): number {
  if (value === undefined || value === '') return fallback;

  const parsed = Number.parseInt(String(value), 10);

  if (Number.isNaN(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
}

export function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();

  return trimmed === '' ? undefined : trimmed;
}

export function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;

  return undefined;
}
