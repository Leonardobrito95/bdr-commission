// ============================================================
// COMISSAO CAMPO — Funções utilitárias (portadas do server.js)
// ============================================================

import { EmpresaConfig, ServiceKey, STORAGE_SERVICE_KEYS } from './comissao.types';

export function stripStr(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

export function normalize(value: unknown): string {
  return stripStr(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function normalizeKey(value: unknown): string {
  return normalize(value)
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
}

export function parseIds(raw: unknown[]): number[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(
    raw
      .map(id => parseInt(String(id).trim(), 10))
      .filter(id => Number.isInteger(id) && id > 0),
  )];
}

export function parseDateInput(raw: unknown): Date | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    const value = stripStr(raw);
    const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (isoDateOnly) {
      const [, y, m, d] = isoDateOnly;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }

    const brDateOnly = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (brDateOnly) {
      const [, d, m, y] = brDateOnly;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
  }
  const date = raw instanceof Date ? raw : new Date(raw as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(raw: unknown): Date | null {
  const date = parseDateInput(raw);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(raw: unknown): Date | null {
  const date = parseDateInput(raw);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function addDays(raw: unknown, days: number): Date | null {
  const date = parseDateInput(raw);
  if (!date) return null;
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function serializeDate(raw: unknown): string | null {
  const date = parseDateInput(raw);
  return date ? date.toISOString() : null;
}

export function parseMoney(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = parseFloat(String(raw ?? '').replace(/[R$\s.]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePercent(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const value = raw > 0 && raw <= 1 ? raw * 100 : raw;
    return Math.min(Math.max(value, 0), 100);
  }
  const parsed = parseFloat(String(raw ?? '').replace('%', '').replace(',', '.'));
  if (!Number.isFinite(parsed)) return 0;
  const value = parsed > 0 && parsed <= 1 ? parsed * 100 : parsed;
  return Math.min(Math.max(value, 0), 100);
}

export function sameDay(a: unknown, b: unknown): boolean {
  const d1 = parseDateInput(a);
  const d2 = parseDateInput(b);
  if (!d1 || !d2) return false;
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

export function isDateWithinRange(date: unknown, startDate: Date | null, endDate: Date | null): boolean {
  const value = parseDateInput(date);
  if (!value) return false;
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  if (start && value < start) return false;
  if (end && value > end) return false;
  return true;
}

export function textMatches(a: unknown, b: unknown): boolean {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return true;
  return left === right || left.includes(right) || right.includes(left);
}

export function normalizeService(value: unknown): string {
  const keywords: { key: string; words: string[] }[] = [
    { key: 'IMPRODUTIVA',        words: ['IMPRODUTIVA'] },
    { key: 'MUDANCA_PONTO',      words: ['MUDANCA DE PONTO', 'MUD. PONTO', 'MUDAR PONTO', 'MUDANCA PONTO'] },
    { key: 'MUDANCA',            words: ['MUDANCA DE ENDERECO', 'MUDANCA'] },
    { key: 'MANUTENCAO_EXTERNA', words: ['MANUTENCAO EXTERNA', 'EXTERNA', 'EXTERNO'] },
    { key: 'MANUTENCAO_INTERNA', words: ['MANUTENCAO INTERNA', 'INTERNA', 'INTERNO'] },
    { key: 'MANUTENCAO_TECNICA', words: ['MANUTENCAO TECNICA', 'MANUTENCAO'] },
    { key: 'REFAZER',            words: ['REFAZER', 'REINSTALACAO'] },
    { key: 'MESH',               words: ['MESH'] },
    { key: 'INSTALACAO',         words: ['INSTALACAO', 'INSTALL'] },
  ];
  const text = normalize(value || '');
  for (const { key, words } of keywords) {
    if (words.some(word => text.includes(normalize(word)))) return key;
  }
  return text.replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').slice(0, 30);
}

export function isImprodutivaService(value: unknown): boolean {
  return normalizeService(value) === 'IMPRODUTIVA';
}

export function isMaintenanceSubtypeMatch(rowTipo: unknown, bancoTipo: unknown): boolean {
  const rowKey = normalizeService(rowTipo);
  const bancoKey = normalizeService(bancoTipo);
  return (
    (rowKey === 'MANUTENCAO_INTERNA' || rowKey === 'MANUTENCAO_EXTERNA') &&
    bancoKey === 'MANUTENCAO_TECNICA'
  );
}

export function isMaintenanceService(value: unknown): boolean {
  const key = normalizeService(value);
  return key === 'MANUTENCAO_TECNICA' || key === 'MANUTENCAO_INTERNA' || key === 'MANUTENCAO_EXTERNA';
}

export function shouldPayExternalMaintenance(rowTipo: unknown, bancoTipo: unknown): boolean {
  return normalizeService(rowTipo) === 'INSTALACAO' && isMaintenanceService(bancoTipo);
}

export function getPrecoServico(empresaConfig: EmpresaConfig | null, tipoOS: unknown): number | null {
  if (!empresaConfig?.precos) return null;
  const key = normalizeService(tipoOS) as ServiceKey;
  const value = empresaConfig.precos[key];
  return value != null ? parseMoney(value) : null;
}

export function getPrecoServicoPorChave(empresaConfig: EmpresaConfig | null, key: ServiceKey): number | null {
  if (!empresaConfig?.precos) return null;
  const value = empresaConfig.precos[key];
  return value != null ? parseMoney(value) : null;
}

export function sanitizeCompanyPrices(raw: unknown): Partial<Record<ServiceKey, number>> {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const prices: Partial<Record<ServiceKey, number>> = {};
  STORAGE_SERVICE_KEYS.forEach(key => {
    const value = parseMoney(source[key]);
    if (value > 0) prices[key] = value;
  });
  return prices;
}

export function sanitizeCompanyPayload(raw: unknown): { key: string; nome: string; precos: Partial<Record<ServiceKey, number>> } | null {
  if (!raw || typeof raw !== 'object') return null;
  const body = raw as Record<string, unknown>;
  const nome = stripStr(body.nome);
  if (!nome) return null;
  const key = normalizeKey(nome);
  if (!key) return null;
  return { key, nome, precos: sanitizeCompanyPrices(body.precos) };
}

export function parseJsonSafe<T>(raw: unknown, fallback: T): T {
  if (raw && typeof raw === 'object') return raw as T;
  if (typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed as T : fallback;
  } catch {
    return fallback;
  }
}
