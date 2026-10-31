import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { AppError } from '../errors';

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function notFoundHandler(_req: Request, res: Response): void {
  const body: ErrorBody = {
    error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' },
  };

  res.status(404).json(body);
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    const body: ErrorBody = {
      error: { code: error.code, message: error.message, details: error.details },
    };

    res.status(error.status).json(body);
    return;
  }

  // JSON malformado enviado pelo cliente.
  if (typeof error === 'object' && error !== null && 'type' in error) {
    const { type } = error as { type?: string };

    if (type === 'entity.parse.failed') {
      res.status(400).json({
        error: { code: 'INVALID_JSON', message: 'Corpo da requisição inválido.' },
      });
      return;
    }
  }

  if (!env.isProduction) {
    console.error(error);
  }

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' },
  });
}
