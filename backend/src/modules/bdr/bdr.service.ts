import {
  findContractById,
  createCommission,
  listCommissions,
  fetchConsultantsFromIXC,
  clearConsultantsCache,
  fetchPlansFromDB,
  createAdjustment,
  listAdjustments,
  deleteAdjustment,
  ContractData,
} from './bdr.repository';

const COMMISSION_REFIDELIZACAO = 3.0;
const COMMISSION_DOWNGRADE    = 0.0;

export async function getContract(id_contrato: string): Promise<ContractData> {
  const contract = await findContractById(id_contrato);
  if (!contract) {
    throw new Error(`Contrato ${id_contrato} não encontrado ou inativo.`);
  }
  return contract;
}

export async function registerCommission(payload: {
  id_contrato: string;
  vendedor: string;
  tipo_negociacao: 'Upgrade' | 'Downgrade' | 'Refidelizacao';
  plano_novo?: string;
  valor_novo?: number;
  criado_por?: string;
}) {
  const { id_contrato, vendedor, tipo_negociacao, plano_novo, valor_novo, criado_por } = payload;

  const consultants = await fetchConsultantsFromIXC();
  if (!consultants.includes(vendedor)) {
    throw new Error(`Consultor "${vendedor}" não encontrado.`);
  }

  const contract = await findContractById(id_contrato);
  if (!contract) {
    throw new Error(`Contrato ${id_contrato} não encontrado ou inativo.`);
  }

  if (tipo_negociacao === 'Upgrade') {
    if (valor_novo == null) {
      throw new Error('O campo valor_novo é obrigatório para Upgrade.');
    }
    if (valor_novo <= contract.valor_atual) {
      throw new Error('Para Upgrade, o valor novo deve ser maior que o valor atual.');
    }
  }

  if (tipo_negociacao === 'Downgrade') {
    if (valor_novo == null) {
      throw new Error('O campo valor_novo é obrigatório para Downgrade.');
    }
    if (valor_novo >= contract.valor_atual) {
      throw new Error('Para Downgrade, o valor novo deve ser menor que o valor atual.');
    }
  }

  const valor_comissao =
    tipo_negociacao === 'Upgrade'       ? (valor_novo! - contract.valor_atual) :
    tipo_negociacao === 'Refidelizacao' ? COMMISSION_REFIDELIZACAO :
    COMMISSION_DOWNGRADE;

  const temValorNovo = tipo_negociacao === 'Upgrade' || tipo_negociacao === 'Downgrade';

  return createCommission({
    id_contrato,
    nome_cliente: contract.nome_cliente,
    vendedor,
    tipo_negociacao,
    plano_atual:    contract.plano_atual,
    plano_novo:     plano_novo ?? undefined,
    valor_atual:    contract.valor_atual,
    valor_novo:     temValorNovo ? valor_novo : undefined,
    valor_comissao,
    criado_por,
  });
}

export async function getAllCommissions(
  perfil: 'consultor' | 'gestor' | 'cs',
  nome: string,
  filter: { dateFrom?: string; dateTo?: string; cursor?: string; take?: number } = {},
) {
  return listCommissions({
    vendedor: perfil === 'consultor' ? nome : undefined,
    ...filter,
  });
}

export async function getConsultants() {
  return fetchConsultantsFromIXC();
}

export async function refreshConsultants() {
  clearConsultantsCache();
  return fetchConsultantsFromIXC();
}

export async function getPlans(): Promise<string[]> {
  return fetchPlansFromDB();
}

// ── Adjustments ───────────────────────────────────────────────────────────────

export async function getAdjustments(perfil: string, nome: string) {
  return listAdjustments(perfil === 'consultor' ? nome : undefined);
}

export async function addAdjustment(
  payload: { vendedor: string; descricao: string; valor: number },
  registrado_por: string,
) {
  if (!payload.vendedor || !payload.descricao || payload.valor == null) {
    throw new Error('Campos obrigatórios: vendedor, descricao, valor.');
  }
  if (payload.valor <= 0) {
    throw new Error('O valor do desconto deve ser positivo.');
  }
  return createAdjustment({ ...payload, registrado_por });
}

export async function removeAdjustment(id: string, deletado_por: string) {
  return deleteAdjustment(id, deletado_por);
}
