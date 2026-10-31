import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import { AppError } from '../errors';
import type { UserRole } from '../modules/users/users.model';

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresInSeconds };

  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  let decoded: unknown;

  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError(401, 'Token inválido ou expirado.', 'INVALID_TOKEN');
  }

  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof (decoded as TokenPayload).sub !== 'string'
  ) {
    throw new AppError(401, 'Token inválido ou expirado.', 'INVALID_TOKEN');
  }

  const { sub, role } = decoded as TokenPayload;

  return { sub, role };
}
