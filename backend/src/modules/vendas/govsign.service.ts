import pool from '../../config/mysql';
import logger from '../../config/logger';
import { RowDataPacket } from 'mysql2';

/**
 * Serviço de Assinatura GOV (IXC)
 * ─────────────────────────────────────────────────────────────────────────────
 * Alguns clientes assinam o contrato via certificado digital GOV em vez do
 * ZapSign. O arquivo deve ser salvo no IXC com o nome no padrão:
 *
 *   {id_contrato}-GOV          →  ex.: "44925-GOV" ou "44925-GOV.pdf"
 *
 * Isso permite identificar exatamente qual contrato foi assinado, sem depender
 * de JOIN por id_cliente (que falha quando o cliente tem múltiplos contratos).
 *
 * Estratégia de matching:
 *   - Busca em cliente_arquivos todos os arquivos cujo nome começa com dígitos
 *     seguidos de "-GOV" (case-insensitive): REGEXP '^[0-9]+-[Gg][Oo][Vv]'
 *   - Extrai o id_contrato com SUBSTRING_INDEX(nome_arquivo, '-', 1)
 *   - Sem JOIN, sem janela de datas — matching exato pelo ID no nome.
 *
 * Mantém um Set<id_contrato> em memória com TTL 15 min.
 */

interface GovCache {
  set: Set<string>;
  expiresAt: number;
}

let cache: GovCache | null = null;
let refreshPromise: Promise<void> | null = null;

// ── Público ───────────────────────────────────────────────────────────────────

export async function getGovSignSet(): Promise<Set<string>> {
  if (!cache || Date.now() > cache.expiresAt) {
    if (!refreshPromise) {
      refreshPromise = refreshCache().finally(() => { refreshPromise = null; });
    }
    await refreshPromise;
  }
  return cache?.set ?? new Set();
}

export async function forceRefreshGov(): Promise<{ size: number }> {
  cache = null;
  if (!refreshPromise) {
    refreshPromise = refreshCache().finally(() => { refreshPromise = null; });
  }
  await refreshPromise;
  return { size: (cache as GovCache | null)?.set.size ?? 0 };
}

// ── Interno ───────────────────────────────────────────────────────────────────

async function refreshCache(): Promise<void> {
  const startMs = Date.now();
  try {
    /**
     * Extrai o id_contrato direto do nome do arquivo.
     * Padrão esperado: "{id_contrato}-GOV[qualquer coisa]"   ex.: "44925-GOV.pdf"
     *
     * REGEXP filtra apenas arquivos que começam com dígitos + "-GOV" (case-insensitive).
     * SUBSTRING_INDEX(..., '-', 1) pega tudo antes do primeiro '-' → o id_contrato.
     *
     * Sem JOIN, sem heurística de datas — matching 100% determinístico.
     */
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DISTINCT
         SUBSTRING_INDEX(ca.nome_arquivo, '-', 1) AS id_contrato
       FROM cliente_arquivos ca
       WHERE ca.nome_arquivo REGEXP '^[0-9]+-[Gg][Oo][Vv]'`
    );

    const set = new Set<string>(rows.map((r) => String(r.id_contrato)));
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

    cache = { set, expiresAt: Date.now() + 15 * 60 * 1000 };
    logger.info(`[GovSign] Cache atualizado — ${set.size} contratos com assinatura GOV em ${elapsed}s.`);
  } catch (err) {
    const e = err as { message?: string };
    logger.error('[GovSign] Falha ao atualizar cache', { message: e.message });
    if (!cache) {
      cache = { set: new Set(), expiresAt: Date.now() + 2 * 60 * 1000 };
    } else {
      cache.expiresAt = Date.now() + 2 * 60 * 1000;
    }
  }
}

// Aquece o cache imediatamente ao iniciar o servidor
refreshPromise = refreshCache().finally(() => { refreshPromise = null; });
