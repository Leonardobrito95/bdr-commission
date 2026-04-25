// ============================================================
// COMISSAO CAMPO — Tipos compartilhados
// ============================================================

export const STORAGE_SERVICE_KEYS = [
  'INSTALACAO',
  'MUDANCA',
  'MUDANCA_PONTO',
  'MESH',
  'REPETIDOR',
  'MANUTENCAO_TECNICA',
  'MANUTENCAO_INTERNA',
  'MANUTENCAO_EXTERNA',
  'RETIRADA',
  'CARNES',
  'TENTATIVA_RETIRADA',
  'REFAZER',
] as const;

export type ServiceKey = typeof STORAGE_SERVICE_KEYS[number];

export interface EmpresaConfig {
  key: string;
  nome: string;
  precos: Partial<Record<ServiceKey, number>>;
  updatedAt?: string | null;
}

export interface SheetRow {
  seq: string;
  id: string;
  cliente: string;
  colaborador: string;
  tipoOS: string;
  statusPlanilha: string;
  dobrada: boolean;
  valor: number;
  valorFonte: string;
  cidade: string;
  dataEnv: Date | null;
}

export interface DbOsRow {
  id_os: number | string;
  status_os: string;
  gera_comissao: string;
  valor_unit_comissao_os: number | string;
  valor_total_comissao_os: number | string;
  data_abertura: Date | string | null;
  data_fechamento: Date | string | null;
  servico: string;
  valor_comissao_assunto: number | string;
  cliente_nome: string;
  cidade_nome: string;
  tecnico: string;
  su_oss_chamado_comissao: number | string;
  qtd_registros_comissao: number | string;
}

export interface AuditResult {
  seq: string;
  id: string;
  cliente: string;
  clienteDB: string;
  tipoOS: string;
  tipoIXC: string;
  statusPlanilha: string;
  cidade: string;
  cidadeDB: string;
  tecnico: string;
  colaborador: string;
  statusOS: string;
  geraComissao: string;
  dobrada: boolean;
  dobradaGestorStatus: string;
  obs: string;
  valorFonte: string;
  valor: number;
  valorTabela: number | null;
  desconto: number;
  valorAdj: number;
  valorAdjOriginal: number;
  valorAdjSemAprovacao: number;
  valorComissaoAssunto: number;
  valorUnitComissaoOS: number;
  valorTotalComissaoOS: number;
  qtdRegistrosComissao: number;
  dataEnv: string | null;
  dataFin: string | null;
  dataAbertura: string | null;
  obsOriginal: string;
  status: 'OK' | 'AUDITORIA' | 'DIVERGENCIA' | 'PENDENTE' | 'FORA_QUINZENA';
}

export interface AuditSummary {
  total: number;
  ok: number;
  auditoria: number;
  divergencia: number;
  pendente: number;
  fora: number;
  totalPagarBase: number;
  totalSolicitado: number;
  holidayBonusEntries: HolidayBonusEntry[];
  holidayBonusTotal: number;
  totalPagar: number;
}

export interface HolidayBonusEntry {
  tecnico: string;
  data: string | null;
  motivo: string;
  valor: number;
}

export interface SavedAuditPayload {
  companyKey: string;
  companyName: string;
  dateIni: Date | null;
  dateFim: Date | null;
  source: string;
  summary: AuditSummary;
  results: AuditResult[];
}

export interface StarkMessageEntry {
  data: Date | null;
  status: string;
  historico: string;
  mensagem: string;
}

export interface StarkFileEntry {
  dataEnvio: Date | null;
  nomeArquivo: string;
  descricao: string;
  classificacao: string;
  tipo: string;
}

export interface StarkFinalizationEntry {
  data: Date | null;
  status: string;
  historico: string;
  mensagem: string;
  colaborador: string;
}

export interface StarkAttemptData {
  messageMap: Map<string, StarkMessageEntry[]>;
  fileMap: Map<string, StarkFileEntry[]>;
  finalizationMap: Map<string, StarkFinalizationEntry[]>;
}
