import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SnapshotInput {
  mes_referencia:  string;
  id_contrato:     string;
  nome_cliente:    string;
  nome_vendedor:   string;
  plano:           string;
  segmento:        string;
  tipo_venda:      string;
  valor_mensal:    number;
  percentual:      number;
  valor_comissao:  number;
  status_comissao: string;
  motivo_bloqueio: string | null;
  assinatura:      string;
}

/**
 * Salva (ou atualiza) o snapshot de uma lista de contratos para um mês de referência.
 * Usa upsert para ser idempotente — pode rodar mais de uma vez sem duplicar.
 */
export async function upsertSnapshot(records: SnapshotInput[]): Promise<number> {
  let count = 0;
  for (const r of records) {
    await prisma.vendasSnapshot.upsert({
      where: {
        mes_referencia_id_contrato: {
          mes_referencia: r.mes_referencia,
          id_contrato:    r.id_contrato,
        },
      },
      update: {
        nome_cliente:    r.nome_cliente,
        nome_vendedor:   r.nome_vendedor,
        plano:           r.plano,
        segmento:        r.segmento,
        tipo_venda:      r.tipo_venda,
        valor_mensal:    r.valor_mensal,
        percentual:      r.percentual,
        valor_comissao:  r.valor_comissao,
        status_comissao: r.status_comissao,
        motivo_bloqueio: r.motivo_bloqueio,
        assinatura:      r.assinatura,
        data_snapshot:   new Date(),
      },
      create: {
        ...r,
        valor_mensal:   r.valor_mensal,
        percentual:     r.percentual,
        valor_comissao: r.valor_comissao,
      },
    });
    count++;
  }
  return count;
}

/**
 * Marca todos os contratos do mês como enviados para pagamento.
 */
export async function marcarEnviadoPagamento(
  mes_referencia: string,
  enviado_por:    string,
): Promise<number> {
  const result = await prisma.vendasSnapshot.updateMany({
    where: {
      mes_referencia,
      status_comissao: 'Liberada',
      enviado_pagamento: false,
    },
    data: {
      enviado_pagamento: true,
      data_envio:        new Date(),
      enviado_por,
    },
  });
  return result.count;
}

/**
 * Lista todos os meses que já têm snapshot salvo.
 */
export async function listMesesSnapshot(): Promise<string[]> {
  const rows = await prisma.vendasSnapshot.findMany({
    select:  { mes_referencia: true },
    distinct: ['mes_referencia'],
    orderBy: { mes_referencia: 'desc' },
  });
  return rows.map((r) => r.mes_referencia);
}

/**
 * Retorna os contratos do snapshot de um mês específico.
 */
export async function getSnapshot(mes_referencia: string) {
  return prisma.vendasSnapshot.findMany({
    where:   { mes_referencia },
    orderBy: { nome_vendedor: 'asc' },
  });
}
