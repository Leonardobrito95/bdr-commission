import pool from '../../config/mysql';
import logger from '../../config/logger';
import { RowDataPacket } from 'mysql2';

/**
 * Serviço de Financeiro (IXC — fn_areceber)
 * ─────────────────────────────────────────────────────────────────────────────
 * Para liberar comissão o contrato precisa ter ao menos um boleto recebido.
 * Consulta a tabela fn_areceber filtrando status = 'R' (recebido) e
 * liberado = 'S', usando GREATEST para normalizar as três colunas de contrato
 * (id_contrato, id_contrato_avulso, id_contrato_principal) — mesma lógica
 * usada no Power BI.
 *
 * Mantém um Set<id_contrato> em memória com TTL 15 min.
 */

interface FinanceiroCache {
  set:       Set<string>;
  expiresAt: number;
}

let cache:          FinanceiroCache | null = null;
let refreshPromise: Promise<void>  | null = null;

// ── Público ───────────────────────────────────────────────────────────────────

export async function getFinanceiroSet(): Promise<Set<string>> {
  if (!cache || Date.now() > cache.expiresAt) {
    if (!refreshPromise) {
      refreshPromise = refreshCache().finally(() => { refreshPromise = null; });
    }
    await refreshPromise;
  }
  return cache?.set ?? new Set();
}

export async function forceRefreshFinanceiro(): Promise<{ size: number }> {
  cache = null;
  if (!refreshPromise) {
    refreshPromise = refreshCache().finally(() => { refreshPromise = null; });
  }
  await refreshPromise;
  return { size: (cache as FinanceiroCache | null)?.set.size ?? 0 };
}

// ── Interno ───────────────────────────────────────────────────────────────────

async function refreshCache(): Promise<void> {
  const startMs = Date.now();
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT
         GREATEST(
           IFNULL(id_contrato, 0),
           IFNULL(id_contrato_avulso, 0),
           IFNULL(id_contrato_principal, 0)
         ) AS id_contrato
       FROM fn_areceber
       WHERE status    = 'R'
         AND liberado  = 'S'
       HAVING id_contrato > 0`
    );

    const set = new Set<string>(rows.map((r) => String(r.id_contrato)));
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

    cache = { set, expiresAt: Date.now() + 15 * 60 * 1000 };
    logger.info(`[Financeiro] Cache atualizado — ${set.size} contratos com boleto recebido em ${elapsed}s.`);
  } catch (err) {
    const e = err as { message?: string };
    logger.error('[Financeiro] Falha ao atualizar cache', { message: e.message });
    if (!cache) {
      cache = { set: new Set(), expiresAt: Date.now() + 2 * 60 * 1000 };
    } else {
      cache.expiresAt = Date.now() + 2 * 60 * 1000;
    }
  }
}

// Aquece o cache imediatamente ao iniciar o servidor
refreshPromise = refreshCache().finally(() => { refreshPromise = null; });
