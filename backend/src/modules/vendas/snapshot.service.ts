import { fetchContracts, ContractRecord } from './vendas.repository';
import { upsertSnapshot, marcarEnviadoPagamento, listMesesSnapshot, getSnapshot, SnapshotInput } from './snapshot.repository';
import { VendasSnapshot } from '@prisma/client';

/**
 * Gera o snapshot de um mês de referência consultando o IXC em tempo real
 * e salvando o resultado no PostgreSQL.
 *
 * mes_referencia: "YYYY-MM"  (ex: "2025-03")
 */
export async function gerarSnapshot(mes_referencia: string): Promise<{ total: number; liberadas: number; bloqueadas: number }> {
  // Deriva o intervalo de datas do mês de referência
  const [year, month] = mes_referencia.split('-').map(Number);
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay  = new Date(year, month, 0).getDate();
  const dateTo   = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  // Busca contratos do IXC (já enriquecidos com ZapSign + GOV + Financeiro)
  const contracts = await fetchContracts({ dateFrom, dateTo });

  const records: SnapshotInput[] = contracts.map((c) => ({
    mes_referencia,
    id_contrato:     c.id_contrato,
    nome_cliente:    c.nome_cliente,
    nome_vendedor:   c.nome_vendedor,
    plano:           c.plano,
    segmento:        c.segmento,
    tipo_venda:      c.tipo_venda,
    valor_mensal:    c.valor_mensal,
    percentual:      c.comissao > 0 && c.valor_mensal > 0 ? c.comissao / c.valor_mensal : 0,
    valor_comissao:  c.comissao,
    status_comissao: c.status_comissao,
    motivo_bloqueio: c.motivo_bloqueio,
    assinatura:      c.assinatura_zapsign,
  }));

  const total     = await upsertSnapshot(records);
  const liberadas = records.filter((r) => r.status_comissao === 'Liberada').length;
  const bloqueadas = records.filter((r) => r.status_comissao.startsWith('Bloqueada')).length;

  return { total, liberadas, bloqueadas };
}

export async function enviarParaPagamento(mes_referencia: string, gestor: string) {
  const count = await marcarEnviadoPagamento(mes_referencia, gestor);
  return { enviados: count, mes_referencia };
}

export async function listarMesesSnapshot() {
  return listMesesSnapshot();
}

export async function buscarSnapshot(mes_referencia: string) {
  return getSnapshot(mes_referencia);
}

// ── Endpoint unificado: snapshot (Postgres) ou ao vivo (IXC) ─────────────────

export interface ComissaoMesResult {
  source:            'snapshot' | 'live';
  mes_referencia:    string;
  enviado_pagamento: boolean;
  data_envio:        string | null;
  enviado_por:       string | null;
  data_snapshot:     string | null;
  contracts:         ContractRecord[];
}

/**
 * Retorna os contratos de um mês de referência (YYYY-MM).
 * - Se existir snapshot no Postgres → retorna os dados salvos
 * - Se não existir → busca ao vivo no IXC
 */
export async function getComissoesMes(
  mes_referencia: string,
  vendedorNome?: string,
): Promise<ComissaoMesResult> {
  const snapshots = await getSnapshot(mes_referencia);

  if (snapshots.length > 0) {
    // ── Fonte: Postgres ───────────────────────────────────────────────────────
    const first = snapshots[0];
    const filtered = vendedorNome
      ? snapshots.filter((s) => s.nome_vendedor.toLowerCase().includes(vendedorNome.toLowerCase()))
      : snapshots;

    return {
      source:            'snapshot',
      mes_referencia,
      enviado_pagamento: snapshots.some((s) => s.enviado_pagamento),
      data_envio:        first.data_envio?.toISOString() ?? null,
      enviado_por:       first.enviado_por ?? null,
      data_snapshot:     first.data_snapshot.toISOString(),
      contracts:         filtered.map(snapshotToContract),
    };
  }

  // ── Fonte: IXC ao vivo ────────────────────────────────────────────────────
  const [year, month] = mes_referencia.split('-').map(Number);
  const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay  = new Date(year, month, 0).getDate();
  const dateTo   = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const contracts = await fetchContracts({ dateFrom, dateTo, vendedorNome });

  return {
    source:            'live',
    mes_referencia,
    enviado_pagamento: false,
    data_envio:        null,
    enviado_por:       null,
    data_snapshot:     null,
    contracts,
  };
}

function snapshotToContract(s: VendasSnapshot): ContractRecord {
  return {
    id_contrato:        s.id_contrato,
    id_cliente:         '',
    nome_cliente:       s.nome_cliente,
    plano:              s.plano,
    data_ativacao:      '',
    status_contrato:    'A',
    status_internet:    '',
    valor_mensal:       Number(s.valor_mensal),
    nome_vendedor:      s.nome_vendedor,
    tipo_venda:         s.tipo_venda,
    segmento:           s.segmento,
    cortesia:           'NÃO',
    vencimento:         '',
    assinatura_zapsign: s.assinatura,
    status_comissao:    s.status_comissao,
    motivo_bloqueio:    s.motivo_bloqueio,
    comissao:           Number(s.valor_comissao),
  };
}
