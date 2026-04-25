import { Request, Response, NextFunction } from 'express';
import { getContracts } from './vendas.service';
import { AuthPayload } from '../auth/auth.service';
import { debugContractStatus, forceRefreshCache } from './zapsign.service';
import { gerarSnapshot, enviarParaPagamento, listarMesesSnapshot, buscarSnapshot, getComissoesMes } from './snapshot.service';
import { forceRefreshGov } from './govsign.service';
import { forceRefreshFinanceiro } from './financeiro.service';
import { statusEnvio, enviarRelatorioFinanceiro } from './comissao-envio.service';

type AuthRequest = Request & { user: AuthPayload };

export async function listContracts(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil, nome } = (req as AuthRequest).user;
    const { dateFrom, dateTo, vendedor } = req.query as Record<string, string>;

    const result = await getContracts(perfil, nome, {
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      vendedor: vendedor || undefined,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /contracts/zapsign/debug/:contractId — retorna status ZapSign do contrato (gestores) */
export async function debugZapSign(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil } = (req as AuthRequest).user;
    if (perfil !== 'gestor') return res.status(403).json({ message: 'Acesso negado.' });

    const result = await debugContractStatus(req.params.contractId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /comissoes/:mes — retorna contratos de um mês (snapshot Postgres ou live IXC) */
export async function getComissoesPorMes(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil, nome } = (req as AuthRequest).user;
    const { vendedor } = req.query as Record<string, string>;

    const vendedorFilter = (perfil === 'consultor' || perfil === 'cs') ? nome : (vendedor || undefined);
    const result = await getComissoesMes(req.params.mes, vendedorFilter);
    res.json(result);
  } catch (err) { next(err); }
}

/** GET  /snapshots — lista meses com snapshot salvo */
export async function listSnapshots(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil } = (req as AuthRequest).user;
    if (perfil !== 'gestor') return res.status(403).json({ message: 'Acesso negado.' });
    res.json(await listarMesesSnapshot());
  } catch (err) { next(err); }
}

/** GET  /snapshots/:mes — retorna contratos do snapshot de um mês (YYYY-MM) */
export async function getSnapshotMes(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil } = (req as AuthRequest).user;
    if (perfil !== 'gestor') return res.status(403).json({ message: 'Acesso negado.' });
    res.json(await buscarSnapshot(req.params.mes));
  } catch (err) { next(err); }
}

/** POST /snapshots/:mes — gera/atualiza snapshot do mês consultando o IXC */
export async function criarSnapshot(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil } = (req as AuthRequest).user;
    if (perfil !== 'gestor') return res.status(403).json({ message: 'Acesso negado.' });
    const result = await gerarSnapshot(req.params.mes);
    res.json(result);
  } catch (err) { next(err); }
}

/** POST /snapshots/:mes/pagar — marca comissões liberadas como enviadas para pagamento */
export async function enviarPagamento(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil, nome } = (req as AuthRequest).user;
    if (perfil !== 'gestor') return res.status(403).json({ message: 'Acesso negado.' });
    const result = await enviarParaPagamento(req.params.mes, nome);
    res.json(result);
  } catch (err) { next(err); }
}

/** GET /relatorio/:mes/status — retorna status de envio ao comercial/financeiro */
export async function getStatusRelatorio(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil } = (req as AuthRequest).user;
    if (perfil !== 'gestor') return res.status(403).json({ message: 'Acesso negado.' });
    const status = await statusEnvio(req.params.mes);
    res.json(status);
  } catch (err) { next(err); }
}

/** POST /relatorio/:mes/enviar-financeiro — envia relatório ao financeiro */
export async function enviarFinanceiro(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil, nome } = (req as AuthRequest).user;
    if (perfil !== 'gestor') return res.status(403).json({ message: 'Acesso negado.' });
    const result = await enviarRelatorioFinanceiro(req.params.mes, nome);
    if (!result.ok) return res.status(400).json({ message: result.mensagem });
    res.json({ message: result.mensagem });
  } catch (err) { next(err); }
}

/** POST /contracts/zapsign/refresh — força recarga dos caches ZapSign + GOV (gestores) */
export async function refreshZapSign(req: Request, res: Response, next: NextFunction) {
  try {
    const { perfil } = (req as AuthRequest).user;
    if (perfil !== 'gestor') return res.status(403).json({ message: 'Acesso negado.' });

    const [zap, gov, fin] = await Promise.all([
      forceRefreshCache(),
      forceRefreshGov(),
      forceRefreshFinanceiro(),
    ]);
    res.json({
      message:     'Caches ZapSign, GOV e Financeiro atualizados.',
      zapsign:     zap.size,
      gov:         gov.size,
      financeiro:  fin.size,
    });
  } catch (err) {
    next(err);
  }
}
