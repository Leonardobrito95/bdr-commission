import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export function errorHandler(
  err: Error & { status?: number; statusCode?: number; type?: string; expose?: boolean },
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error('[ERROR]', { message: err.message, stack: err.stack });
  const status = Number(err.statusCode || err.status || 500);
  const message =
    err.type === 'entity.too.large'
      ? 'Payload da requisicao excede o limite permitido.'
      : err.message || 'Erro interno do servidor.';

  res.status(Number.isInteger(status) && status >= 400 ? status : 500).json({ message });
}
