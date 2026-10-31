import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors';
import { type PublicUser, type UserRole, toPublicUser } from '../modules/users/users.model';
import { usersRepository } from '../modules/users/users.repository';
import { verifyToken } from '../utils/jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

function extractToken(header: string | undefined): string | null {
  if (!header) return null;

  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  return token;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    throw new AppError(401, 'Token de acesso ausente.', 'MISSING_TOKEN');
  }

  const payload = verifyToken(token);
  const user = usersRepository.findById(payload.sub);

  if (!user) {
    throw new AppError(401, 'Token inválido ou expirado.', 'INVALID_TOKEN');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Esta conta está desativada.', 'ACCOUNT_DISABLED');
  }

  req.user = toPublicUser(user);
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Token de acesso ausente.', 'MISSING_TOKEN');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Sem permissão para esta operação.', 'FORBIDDEN');
    }

    next();
  };
}
