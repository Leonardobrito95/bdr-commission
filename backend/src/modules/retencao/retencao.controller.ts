import { Request, Response, NextFunction } from 'express';
import { AuthPayload } from '../auth/auth.service';
import { getRetencao, getRetencaoDetalhe } from './retencao.service';

type AuthRequest = Request & { user: AuthPayload };

export async function listRetencao(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil, nome } = (req as AuthRequest).user;
    const { dateFrom, dateTo, operador } = req.query as Record<string, string>;
    const result = await getRetencao(perfil, nome, { dateFrom, dateTo, operador });
    res.json(result);
  } catch (err) { next(err); }
}

export async function listRetencaoDetalhe(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil, nome } = (req as AuthRequest).user;
    const { dateFrom, dateTo, operador } = req.query as Record<string, string>;
    const result = await getRetencaoDetalhe(perfil, nome, { dateFrom, dateTo, operador });
    res.json(result);
  } catch (err) { next(err); }
}
