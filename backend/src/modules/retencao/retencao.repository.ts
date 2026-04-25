import pool from '../../config/mysql';
import { RowDataPacket } from 'mysql2';

// ── Mapeamento de IDs de diagnóstico ─────────────────────────────────────────
// Fonte: planilha "ID DIAGNOSTICO.xlsx"

export const RETIDO_IDS = [
  20, 21, 22, 23, 24, 25, 26, 27, 29, 30, 31, 32,
  33, 34, 35, 58, 94, 316, 318, 320, 322, 324, 326,
];

export const NAO_RETIDO_IDS = [
  37, 38, 39, 40, 41, 42, 43, 44, 46, 47, 48, 49,
  50, 51, 52, 56, 57, 59, 319, 321, 323, 325, 327,
];

// ── Comissão por faixa ────────────────────────────────────────────────────────
export function getComissaoRetencao(qtdRetidas: number): number {
  if (qtdRetidas >= 110) return 750;
  if (qtdRetidas >= 90)  return 550;
  if (qtdRetidas >= 70)  return 400;
  return 0;
}

export function getFaixaRetencao(qtdRetidas: number): string {
  if (qtdRetidas >= 110) return '110+ retenções — R$ 750';
  if (qtdRetidas >= 90)  return '90+ retenções — R$ 550';
  if (qtdRetidas >= 70)  return '70+ retenções — R$ 400';
  return 'Abaixo da meta (mín. 70)';
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RetencaoRecord {
  nome_operador:   string;
  qtd_tratadas:    number;
  qtd_retidas:     number;
  qtd_nao_retidas: number;
  pct_reversao:    number;  // 0–100
  comissao:        number;
  faixa:           string;
}

export interface RetencaoDetalhe {
  id_chamado:       string;
  data_abertura:    string;
  nome_operador:    string;
  id_diagnostico:   number | null;
  desc_diagnostico: string;
  resultado:        'RETIDO' | 'NAO_RETIDO' | 'PENDENTE';
}

export interface RetencaoFilters {
  dateFrom?:    string;
  dateTo?:      string;
  operadorNome?: string;
}

// ── Query principal ───────────────────────────────────────────────────────────

export async function fetchRetencao(filters: RetencaoFilters): Promise<RetencaoRecord[]> {
  const conditions: string[] = ["id_assunto = '348'"];
  const params: unknown[] = [];

  if (filters.dateFrom) {
    conditions.push('data_abertura >= ?');
    params.push(filters.dateFrom + ' 00:00:00');
  }
  if (filters.dateTo) {
    conditions.push('data_abertura <= ?');
    params.push(filters.dateTo + ' 23:59:59');
  }
  if (filters.operadorNome) {
    conditions.push('id_atendente LIKE ?');
    params.push(`%${filters.operadorNome}%`);
  }

  const retidoList    = RETIDO_IDS.join(',');
  const naoRetidoList = NAO_RETIDO_IDS.join(',');

  // id_su_diagnostico está na própria tabela su_oss_chamado
  // id_atendente já contém o nome do operador (string)
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       COALESCE(CONVERT(id_atendente USING utf8mb4), CONCAT('Técnico #', id_tecnico)) AS nome_operador,
       COUNT(*)                                                  AS qtd_tratadas,
       COUNT(CASE WHEN id_su_diagnostico IN (${retidoList})     THEN 1 END) AS qtd_retidas,
       COUNT(CASE WHEN id_su_diagnostico IN (${naoRetidoList})  THEN 1 END) AS qtd_nao_retidas
     FROM su_oss_chamado
     WHERE ${conditions.join(' AND ')}
     GROUP BY id_atendente, id_tecnico
     ORDER BY qtd_retidas DESC`,
    params as any[]
  );

  return rows.map((r) => {
    const qtdTratadas   = Number(r.qtd_tratadas)    || 0;
    const qtdRetidas    = Number(r.qtd_retidas)     || 0;
    const qtdNaoRetidas = Number(r.qtd_nao_retidas) || 0;
    const pctReversao   = qtdTratadas > 0 ? (qtdRetidas / qtdTratadas) * 100 : 0;

    return {
      nome_operador:   String(r.nome_operador),
      qtd_tratadas:    qtdTratadas,
      qtd_retidas:     qtdRetidas,
      qtd_nao_retidas: qtdNaoRetidas,
      pct_reversao:    Math.round(pctReversao * 10) / 10,
      comissao:        getComissaoRetencao(qtdRetidas),
      faixa:           getFaixaRetencao(qtdRetidas),
    };
  });
}

// ── Detalhe por chamado ───────────────────────────────────────────────────────

export async function fetchRetencaoDetalhe(filters: RetencaoFilters): Promise<RetencaoDetalhe[]> {
  const conditions: string[] = ["id_assunto = '348'"];
  const params: unknown[] = [];

  if (filters.dateFrom) {
    conditions.push('data_abertura >= ?');
    params.push(filters.dateFrom + ' 00:00:00');
  }
  if (filters.dateTo) {
    conditions.push('data_abertura <= ?');
    params.push(filters.dateTo + ' 23:59:59');
  }
  if (filters.operadorNome) {
    conditions.push('id_atendente LIKE ?');
    params.push(`%${filters.operadorNome}%`);
  }

  const retidoList    = RETIDO_IDS.join(',');
  const naoRetidoList = NAO_RETIDO_IDS.join(',');

  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
       id                                                                             AS id_chamado,
       data_abertura,
       COALESCE(CONVERT(id_atendente USING utf8mb4), CONCAT('Técnico #', id_tecnico)) AS nome_operador,
       id_su_diagnostico,
       CASE
         WHEN id_su_diagnostico IN (${retidoList})    THEN 'RETIDO'
         WHEN id_su_diagnostico IN (${naoRetidoList}) THEN 'NAO_RETIDO'
         ELSE 'PENDENTE'
       END AS resultado
     FROM su_oss_chamado
     WHERE ${conditions.join(' AND ')}
     ORDER BY data_abertura DESC
     LIMIT 2000`,
    params as any[]
  );

  return rows.map((r) => ({
    id_chamado:       String(r.id_chamado),
    data_abertura:    r.data_abertura instanceof Date
                        ? r.data_abertura.toISOString()
                        : String(r.data_abertura ?? ''),
    nome_operador:    String(r.nome_operador),
    id_diagnostico:   r.id_su_diagnostico != null ? Number(r.id_su_diagnostico) : null,
    desc_diagnostico: '',
    resultado:        (r.resultado as 'RETIDO' | 'NAO_RETIDO' | 'PENDENTE') ?? 'PENDENTE',
  }));
}
