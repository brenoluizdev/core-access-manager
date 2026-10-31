import { existsSync } from 'node:fs';

/**
 * Centraliza a leitura de variáveis de ambiente.
 * Falha rápido quando uma configuração obrigatória está ausente em produção.
 */

// Carrega .env quando presente, sem exigir a dependência dotenv.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

function readInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Valor numérico inválido para variável de ambiente: "${value}"`);
  }

  return parsed;
}

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret =
  process.env.JWT_SECRET ?? (isProduction ? '' : 'dev-only-secret-change-me');

if (!jwtSecret) {
  throw new Error('JWT_SECRET é obrigatório quando NODE_ENV=production.');
}

export const env = {
  isProduction,
  port: readInt(process.env.PORT, 3333),
  jwtSecret,
  jwtExpiresInSeconds: readInt(process.env.JWT_EXPIRES_IN_SECONDS, 60 * 60 * 8),
  databaseFile: process.env.DATABASE_FILE ?? 'data/core-access.db',
} as const;
