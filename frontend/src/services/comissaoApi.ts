import axios from 'axios';

const TOKEN_KEY = 'bdr_token';

const api = axios.create({
  baseURL: '/bdr/api/v1/comissao',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) { localStorage.removeItem(TOKEN_KEY); window.location.reload(); }
    return Promise.reject(err);
  },
);

// ── Types ─────────────────────────────────────────────────────

export type ServiceKey =
  | 'INSTALACAO' | 'MUDANCA' | 'MUDANCA_PONTO' | 'MESH' | 'REPETIDOR'
  | 'MANUTENCAO_TECNICA' | 'MANUTENCAO_INTERNA' | 'MANUTENCAO_EXTERNA'
  | 'RETIRADA' | 'CARNES' | 'TENTATIVA_RETIRADA' | 'REFAZER';

export const SERVICE_KEYS: ServiceKey[] = [
  'INSTALACAO', 'MUDANCA', 'MUDANCA_PONTO', 'MESH', 'REPETIDOR',
  'MANUTENCAO_TECNICA', 'MANUTENCAO_INTERNA', 'MANUTENCAO_EXTERNA',
  'RETIRADA', 'CARNES', 'TENTATIVA_RETIRADA', 'REFAZER',
];

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  INSTALACAO:          'Instalação',
  MUDANCA:             'Mudança',
  MUDANCA_PONTO:       'Mudança de Ponto',
  MESH:                'Mesh',
  REPETIDOR:           'Repetidor',
  MANUTENCAO_TECNICA:  'Manutenção Técnica',
  MANUTENCAO_INTERNA:  'Manutenção Interna',
  MANUTENCAO_EXTERNA:  'Manutenção Externa',
  RETIRADA:            'Retirada',
  CARNES:              'Carnês',
  TENTATIVA_RETIRADA:  'Tentativa Retirada',
  REFAZER:             'Refazer',
};

export interface EmpresaConfig {
  key: string;
  nome: string;
  precos: Partial<Record<ServiceKey, number>>;
  updatedAt?: string | null;
}

export type AuditStatus = 'OK' | 'AUDITORIA' | 'DIVERGENCIA' | 'PENDENTE' | 'FORA_QUINZENA';

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
  dobradaGestorStatus?: string;
  obs: string;
  obsOriginal?: string;
  valorFonte: string;
  valor: number;
  valorTabela: number | null;
  desconto: number;
  valorAdj: number;
  valorAdjOriginal?: number;
  valorAdjSemAprovacao?: number;
  valorComissaoAssunto: number;
  valorUnitComissaoOS: number;
  valorTotalComissaoOS: number;
  qtdRegistrosComissao: number;
  dataEnv: string | null;
  dataFin: string | null;
  dataAbertura: string | null;
  status: AuditStatus;
  uiKey?: string;
}

export interface HolidayBonusEntry {
  tecnico: string;
  data: string | null;
  motivo: string;
  valor: number;
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

export interface SavedAuditSummary {
  companyKey: string;
  companyName: string;
  dateIni: string | null;
  dateFim: string | null;
  source: string;
  summary: AuditSummary;
  updatedAt: string | null;
}

export interface SavedAudit extends SavedAuditSummary {
  results: AuditResult[];
}

export interface SheetRowInput {
  seq: string;
  id: string | number;
  cliente: string;
  colaborador: string;
  tipoOS: string;
  statusPlanilha: string;
  dobrada: boolean;
  valor: number;
  valorFonte: string;
  cidade: string;
  dataEnv: string | null;
}

// ── API Calls ─────────────────────────────────────────────────

export const comissaoApi = {
  // Empresas
  getEmpresas: () =>
    api.get<{ ok: boolean; data: EmpresaConfig[] }>('/empresas').then(r => r.data.data),

  saveEmpresa: (empresa: { nome: string; precos: Partial<Record<ServiceKey, number>> }) =>
    api.post<{ ok: boolean; data: EmpresaConfig }>('/empresas', empresa).then(r => r.data.data),

  deleteEmpresa: (key: string) =>
    api.delete(`/empresas/${encodeURIComponent(key)}`).then(r => r.data),

  // Auditorias salvas
  getAuditoriasSalvas: () =>
    api.get<{ ok: boolean; data: SavedAuditSummary[] }>('/auditorias-salvas').then(r => r.data.data),

  getAuditoriaSalva: (key: string) =>
    api.get<{ ok: boolean; data: SavedAudit }>(`/auditorias-salvas/${encodeURIComponent(key)}`).then(r => r.data.data),

  saveAuditoria: (payload: {
    companyName: string;
    dateIni: string | null;
    dateFim: string | null;
    source: string;
    summary: AuditSummary;
    results: AuditResult[];
  }) =>
    api.post<{ ok: boolean; data: SavedAudit }>('/auditorias-salvas', payload).then(r => r.data.data),

  // IXC
  pingMysql: () =>
    api.get<{ ok: boolean; host?: string; db?: string; error?: string }>('/ping').then(r => r.data),

  consultarOs: (ids: number[]) =>
    api.post<{ ok: boolean; total: number; data: any[] }>('/consultar-os', { ids }).then(r => r.data),

  auditarPlanilha: (payload: {
    rows: SheetRowInput[];
    dateIni: string | null;
    dateFim: string | null;
    empresaNome: string;
    companyType: string;
    empresaConfig: EmpresaConfig | null;
  }) =>
    api.post<{ ok: boolean; total: number; source: string; data: AuditResult[] }>(
      '/auditar-planilha-db',
      payload,
    ).then(r => r.data),
};
