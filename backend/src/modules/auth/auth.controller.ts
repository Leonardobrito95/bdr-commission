import { Request, Response, NextFunction } from 'express';
import { login } from './auth.service';

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
