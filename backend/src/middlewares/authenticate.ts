import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload } from '../modules/auth/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token não fornecido.' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ message: 'Sessão expirada. Faça login novamente.' });
  }
}
