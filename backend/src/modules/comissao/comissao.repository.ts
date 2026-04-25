// ============================================================
// COMISSAO CAMPO — Repository (PostgreSQL via Prisma)
// ============================================================

import prisma from '../../config/prisma';
import { EmpresaConfig, SavedAuditPayload, AuditSummary, AuditResult, HolidayBonusEntry, STORAGE_SERVICE_KEYS } from './comissao.types';
import { stripStr, sanitizeCompanyPrices, serializeDate, parseJsonSafe, parseMoney, parsePercent } from './comissao.utils';

const DEFAULT_COMPANIES: Record<string, { nome: string; precos: Partial<Record<string, number>> }> = {
  KT_TELECOM: {
    nome: 'KT TELECOM',
    precos: { INSTALACAO: 115, MANUTENCAO_TECNICA: 60, MUDANCA: 110, MUDANCA_PONTO: 110, MESH: 60 },
  },
  TC_TELECOM: {
    nome: 'TC TELECOM',
    precos: { INSTALACAO: 90, MUDANCA: 90, MUDANCA_PONTO: 90, REPETIDOR: 60, MANUTENCAO_INTERNA: 45, MANUTENCAO_EXTERNA: 55, RETIRADA: 20, CARNES: 20, TENTATIVA_RETIRADA: 5 },
  },
  HEBROM_TELECOM: {
    nome: 'HEBROM TELECOM',
    precos: { INSTALACAO: 100, MUDANCA: 100, MUDANCA_PONTO: 100, REPETIDOR: 40, MANUTENCAO_INTERNA: 45, MANUTENCAO_EXTERNA: 55, RETIRADA: 20, CARNES: 20, TENTATIVA_RETIRADA: 5 },
  },
  STARK: {
    nome: 'STARK',
    precos: { RETIRADA: 20, TENTATIVA_RETIRADA: 5 },
  },
};

// ── Helpers de mapeamento ────────────────────────────────────

function mapEmpresa(row: { company_key: string; nome: string; precos_json: any; updated_at: Date }): EmpresaConfig {
  return {
    key:       stripStr(row.company_key),
    nome:      stripStr(row.nome),
    precos:    sanitizeCompanyPrices(parseJsonSafe(row.precos_json, {})),
    updatedAt: serializeDate(row.updated_at),
  };
}

function sanitizeHolidayBonusEntries(raw: unknown): HolidayBonusEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(entry => {
    const source = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    return {
      tecnico: stripStr(source.tecnico),
      data:    serializeDate(source.data),
      motivo:  stripStr(source.motivo),
      valor:   parseMoney(source.valor),
    };
  });
}

function sanitizeAuditSummary(raw: unknown): AuditSummary {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    total:                Number(s.total) || 0,
    ok:                   Number(s.ok) || 0,
    auditoria:            Number(s.auditoria) || 0,
    divergencia:          Number(s.divergencia) || 0,
    pendente:             Number(s.pendente) || 0,
    fora:                 Number(s.fora) || 0,
    totalPagarBase:       parseMoney(s.totalPagarBase),
    totalSolicitado:      parseMoney(s.totalSolicitado),
    holidayBonusEntries:  sanitizeHolidayBonusEntries(s.holidayBonusEntries),
    holidayBonusTotal:    parseMoney(s.holidayBonusTotal),
    totalPagar:           parseMoney(s.totalPagar),
  };
}

function sanitizeSavedResultRow(row: unknown): AuditResult {
  const source = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
  const status = stripStr(source.status) as AuditResult['status'];
  return {
    seq:                     stripStr(source.seq),
    id:                      stripStr(source.id),
    cliente:                 stripStr(source.cliente),
    clienteDB:               stripStr(source.clienteDB),
    tipoOS:                  stripStr(source.tipoOS),
    tipoIXC:                 stripStr(source.tipoIXC),
    statusPlanilha:          stripStr(source.statusPlanilha),
    cidade:                  stripStr(source.cidade),
    cidadeDB:                stripStr(source.cidadeDB),
    tecnico:                 stripStr(source.tecnico),
    colaborador:             stripStr(source.colaborador),
    statusOS:                stripStr(source.statusOS),
    geraComissao:            stripStr(source.geraComissao),
    dobrada:                 Boolean(source.dobrada),
    dobradaGestorStatus:     stripStr(source.dobradaGestorStatus),
    obs:                     stripStr(source.obs),
    valorFonte:              stripStr(source.valorFonte) || 'sheet',
    valor:                   parseMoney(source.valor),
    valorTabela:             source.valorTabela == null || source.valorTabela === '' ? null : parseMoney(source.valorTabela),
    desconto:                parsePercent(source.desconto),
    valorAdj:                parseMoney(source.valorAdj),
    valorAdjOriginal:        parseMoney(source.valorAdjOriginal),
    valorAdjSemAprovacao:    parseMoney(source.valorAdjSemAprovacao),
    valorComissaoAssunto:    parseMoney(source.valorComissaoAssunto),
    valorUnitComissaoOS:     parseMoney(source.valorUnitComissaoOS),
    valorTotalComissaoOS:    parseMoney(source.valorTotalComissaoOS),
    qtdRegistrosComissao:    Number(source.qtdRegistrosComissao) || 0,
    dataEnv:                 serializeDate(source.dataEnv),
    dataFin:                 serializeDate(source.dataFin),
    dataAbertura:            serializeDate(source.dataAbertura),
    obsOriginal:             stripStr(source.obsOriginal),
    status:                  status || 'PENDENTE',
  };
}

function sanitizeSavedAuditResults(raw: unknown): AuditResult[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 2000).map(sanitizeSavedResultRow);
}

// ── Seed empresas padrão ──────────────────────────────────────

export async function seedDefaultCompanies(): Promise<void> {
  const existing = await listEmpresas();
  const existingMap = new Map(existing.map(e => [e.key, e]));

  for (const [key, seed] of Object.entries(DEFAULT_COMPANIES)) {
    const current = existingMap.get(key);
    if (!current) {
      await upsertEmpresa({ key, nome: seed.nome, precos: seed.precos as any });
      continue;
    }
    const mergedPrices = { ...seed.precos, ...current.precos };
    const sameName   = current.nome === seed.nome;
    const samePrices = JSON.stringify(mergedPrices) === JSON.stringify(current.precos);
    if (!sameName || !samePrices) {
      await upsertEmpresa({ key, nome: current.nome || seed.nome, precos: mergedPrices as any });
    }
  }
}

// ── CRUD Empresas ────────────────────────────────────────────

export async function listEmpresas(): Promise<EmpresaConfig[]> {
  const rows = await prisma.comissaoCampoEmpresa.findMany({ orderBy: { nome: 'asc' } });
  return rows.map(r => mapEmpresa({ ...r, precos_json: r.precos_json, updated_at: r.updated_at }));
}

export async function upsertEmpresa(data: { key: string; nome: string; precos: EmpresaConfig['precos'] }): Promise<void> {
  await prisma.comissaoCampoEmpresa.upsert({
    where:  { company_key: data.key },
    create: { company_key: data.key, nome: data.nome, precos_json: data.precos as any },
    update: { nome: data.nome, precos_json: data.precos as any },
  });
}

export async function deleteEmpresa(key: string): Promise<void> {
  await prisma.comissaoCampoEmpresa.deleteMany({ where: { company_key: key } });
}

// ── CRUD Auditorias Salvas ────────────────────────────────────

export async function listAuditoriasSummary() {
  const rows = await prisma.comissaoCampoAuditoria.findMany({
    orderBy: { updated_at: 'desc' },
    select: {
      company_key: true,
      company_name: true,
      date_ini: true,
      date_fim: true,
      source: true,
      summary_json: true,
      updated_at: true,
    },
  });
  return rows.map(r => ({
    companyKey:  r.company_key,
    companyName: r.company_name,
    dateIni:     serializeDate(r.date_ini),
    dateFim:     serializeDate(r.date_fim),
    source:      r.source,
    summary:     sanitizeAuditSummary(r.summary_json),
    updatedAt:   serializeDate(r.updated_at),
  }));
}

export async function getAuditoriaByKey(key: string) {
  const row = await prisma.comissaoCampoAuditoria.findUnique({ where: { company_key: key } });
  if (!row) return null;
  return {
    companyKey:  row.company_key,
    companyName: row.company_name,
    dateIni:     serializeDate(row.date_ini),
    dateFim:     serializeDate(row.date_fim),
    source:      row.source,
    summary:     sanitizeAuditSummary(row.summary_json),
    results:     sanitizeSavedAuditResults(row.results_json),
    updatedAt:   serializeDate(row.updated_at),
  };
}

export async function upsertAuditoria(audit: SavedAuditPayload): Promise<void> {
  await prisma.comissaoCampoAuditoria.upsert({
    where:  { company_key: audit.companyKey },
    create: {
      company_key:  audit.companyKey,
      company_name: audit.companyName,
      date_ini:     audit.dateIni ?? undefined,
      date_fim:     audit.dateFim ?? undefined,
      source:       audit.source,
      summary_json: audit.summary as any,
      results_json: sanitizeSavedAuditResults(audit.results) as any,
    },
    update: {
      company_name: audit.companyName,
      date_ini:     audit.dateIni ?? undefined,
      date_fim:     audit.dateFim ?? undefined,
      source:       audit.source,
      summary_json: audit.summary as any,
      results_json: sanitizeSavedAuditResults(audit.results) as any,
    },
  });
}
