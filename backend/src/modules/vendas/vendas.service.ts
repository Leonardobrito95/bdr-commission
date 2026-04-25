import { fetchContracts, ContractRecord } from './vendas.repository';

export interface ContractKpis {
  totalContratos: number;
  faturamentoMensal: number;
  comissoesLiberadas: number;
  comissoesBloqueadas: number;
  comissoesPendentes: number;
  valorLiberado: number;
  valorBloqueado: number;
  b2c: number;
  b2b: number;
  cortesias: number;
}

export interface ContractsResult {
  contracts: ContractRecord[];
  kpis: ContractKpis;
}

export async function getContracts(
  perfil: string,
  userName: string,
  filters: { dateFrom?: string; dateTo?: string; vendedor?: string }
): Promise<ContractsResult> {
  // consultor e cs: filtram pelo próprio nome | gestor: vê todos (ou filtra por query)
  const vendedorFilter =
    perfil === 'consultor' || perfil === 'cs'
      ? userName
      : filters.vendedor || undefined;

  const contracts = await fetchContracts({
    dateFrom:     filters.dateFrom,
    dateTo:       filters.dateTo,
    vendedorNome: vendedorFilter,
  });

  const kpis: ContractKpis = {
    totalContratos:      contracts.length,
    faturamentoMensal:   contracts.reduce((s, c) => s + c.valor_mensal, 0),
    comissoesLiberadas:  contracts.filter((c) => c.status_comissao === 'Liberada').length,
    comissoesBloqueadas: contracts.filter((c) => c.status_comissao.startsWith('Bloqueada')).length,
    comissoesPendentes:  contracts.filter((c) => c.status_comissao.startsWith('Pendente')).length,
    valorLiberado:       contracts.filter((c) => c.status_comissao === 'Liberada').reduce((s, c) => s + c.valor_mensal, 0),
    valorBloqueado:      contracts.filter((c) => c.status_comissao !== 'Liberada').reduce((s, c) => s + c.valor_mensal, 0),
    b2c:                 contracts.filter((c) => c.segmento === 'B2C').length,
    b2b:                 contracts.filter((c) => c.segmento === 'B2B').length,
    cortesias:           contracts.filter((c) => c.cortesia === 'SIM').length,
  };

  return { contracts, kpis };
}
