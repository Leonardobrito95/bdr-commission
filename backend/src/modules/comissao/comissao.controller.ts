// ============================================================
// COMISSAO CAMPO — Controller
// ============================================================

import { Request, Response } from 'express';
import mysqlPool from '../../config/mysql';
import {
  listEmpresas,
  upsertEmpresa,
  deleteEmpresa,
  listAuditoriasSummary,
  getAuditoriaByKey,
  upsertAuditoria,
} from './comissao.repository';
import { sanitizeSheetRows, fetchOsDetails, auditarPlanilha } from './comissao.service';
import {
  sanitizeCompanyPayload,
  normalizeKey,
  parseIds,
  parseDateInput,
  serializeDate,
  stripStr,
} from './comissao.utils';
import { SavedAuditPayload, AuditSummary, AuditResult } from './comissao.types';

// ── Empresas ─────────────────────────────────────────────────

export async function getEmpresas(req: Request, res: Response): Promise<void> {
  try {
    const companies = await listEmpresas();
    res.json({ ok: true, data: companies });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Erro ao carregar empresas: ' + err.message });
  }
}

export async function saveEmpresa(req: Request, res: Response): Promise<void> {
  const company = sanitizeCompanyPayload(req.body);
  if (!company) {
    res.status(400).json({ ok: false, error: 'Nome da empresa invalido.' });
    return;
  }
  try {
    await upsertEmpresa(company);
    res.json({ ok: true, data: company });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Erro ao salvar empresa: ' + err.message });
  }
}

export async function removeEmpresa(req: Request, res: Response): Promise<void> {
  const key = normalizeKey(req.params.key);
  if (!key) {
    res.status(400).json({ ok: false, error: 'Empresa invalida.' });
    return;
  }
  try {
    await deleteEmpresa(key);
    res.json({ ok: true, key });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Erro ao excluir empresa: ' + err.message });
  }
}

// ── Auditorias salvas ─────────────────────────────────────────

export async function getAuditoriasSalvas(req: Request, res: Response): Promise<void> {
  try {
    const audits = await listAuditoriasSummary();
    res.json({ ok: true, data: audits });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Erro ao listar auditorias salvas: ' + err.message });
  }
}

export async function getAuditoriaSalva(req: Request, res: Response): Promise<void> {
  const key = normalizeKey(req.params.key);
  if (!key) {
    res.status(400).json({ ok: false, error: 'Auditoria invalida.' });
    return;
  }
  try {
    const audit = await getAuditoriaByKey(key);
    if (!audit) {
      res.status(404).json({ ok: false, error: 'Auditoria salva nao encontrada.' });
      return;
    }
    res.json({ ok: true, data: audit });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Erro ao carregar auditoria salva: ' + err.message });
  }
}

export async function postAuditoriaSalva(req: Request, res: Response): Promise<void> {
  const body = req.body;
  const companyName = stripStr(body?.companyName);
  const companyKey  = normalizeKey(companyName);

  if (!companyName || !companyKey) {
    res.status(400).json({ ok: false, error: 'Dados da auditoria invalidos ou incompletos.' });
    return;
  }

  const results: AuditResult[] = Array.isArray(body?.results)
    ? body.results.slice(0, 2000)
    : [];

  if (!results.length) {
    res.status(400).json({ ok: false, error: 'Dados da auditoria invalidos ou incompletos.' });
    return;
  }

  const audit: SavedAuditPayload = {
    companyKey,
    companyName,
    dateIni: parseDateInput(body?.dateIni),
    dateFim: parseDateInput(body?.dateFim),
    source:  stripStr(body?.source) || 'database',
    summary: body?.summary as AuditSummary,
    results,
  };

  try {
    await upsertAuditoria(audit);
    const saved = await getAuditoriaByKey(companyKey);
    res.json({ ok: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Erro ao salvar auditoria: ' + err.message });
  }
}

// ── IXC: consultar OS ─────────────────────────────────────────

export async function consultarOs(req: Request, res: Response): Promise<void> {
  const ids = parseIds(req.body?.ids);
  if (!ids.length) {
    res.status(400).json({ error: 'Nenhum ID valido informado.' });
    return;
  }
  if (ids.length > 2000) {
    res.status(400).json({ error: 'Maximo de 2000 IDs por consulta.' });
    return;
  }
  try {
    const rows = await fetchOsDetails(ids);
    const data = rows.map(row => ({
      ...row,
      data_abertura:    serializeDate(row.data_abertura),
      data_fechamento:  serializeDate(row.data_fechamento),
    }));
    res.json({ ok: true, total: data.length, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Erro na consulta: ' + err.message });
  }
}

// ── IXC: auditar planilha ─────────────────────────────────────

export async function auditarPlanilhaDb(req: Request, res: Response): Promise<void> {
  const rows = sanitizeSheetRows(req.body?.rows);
  if (!rows.length) {
    res.status(400).json({ ok: false, error: 'Nenhuma linha valida da planilha foi recebida.' });
    return;
  }
  if (rows.length > 2000) {
    res.status(400).json({ ok: false, error: 'Maximo de 2000 linhas por processamento.' });
    return;
  }

  try {
    const data = await auditarPlanilha({
      rows,
      dateIni:      parseDateInput(req.body?.dateIni),
      dateFim:      parseDateInput(req.body?.dateFim),
      empresaNome:  stripStr(req.body?.empresaNome),
      companyType:  stripStr(req.body?.companyType),
      empresaConfig: req.body?.empresaConfig && typeof req.body.empresaConfig === 'object'
        ? req.body.empresaConfig
        : null,
    });
    res.json({ ok: true, total: data.length, source: 'database', data });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: 'Erro ao comparar planilha com o banco: ' + err.message });
  }
}

// ── Health check MySQL ────────────────────────────────────────

export async function pingMysql(req: Request, res: Response): Promise<void> {
  try {
    const conn = await mysqlPool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    res.json({ ok: true, host: process.env.MYSQL_HOST, db: process.env.MYSQL_DATABASE });
  } catch (err: any) {
    res.status(503).json({ ok: false, error: err.message });
  }
}

// ── Listar databases MySQL ────────────────────────────────────

export async function listDatabases(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await mysqlPool.query<any[]>('SHOW DATABASES');
    res.json({ ok: true, databases: rows.map((r: any) => Object.values(r)[0]) });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
