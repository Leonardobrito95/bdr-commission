import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import {
  getEmpresas,
  saveEmpresa,
  removeEmpresa,
  getAuditoriasSalvas,
  getAuditoriaSalva,
  postAuditoriaSalva,
  consultarOs,
  auditarPlanilhaDb,
  pingMysql,
  listDatabases,
} from './comissao.controller';

const router = Router();

// Empresas terceirizadas
router.get('/empresas',           authenticate, getEmpresas);
router.post('/empresas',          authenticate, saveEmpresa);
router.delete('/empresas/:key',   authenticate, removeEmpresa);

// Auditorias salvas
router.get('/auditorias-salvas',       authenticate, getAuditoriasSalvas);
router.get('/auditorias-salvas/:key',  authenticate, getAuditoriaSalva);
router.post('/auditorias-salvas',      authenticate, postAuditoriaSalva);

// IXC / MySQL
router.post('/consultar-os',          authenticate, consultarOs);
router.post('/auditar-planilha-db',   authenticate, auditarPlanilhaDb);
router.get('/ping',                   authenticate, pingMysql);
router.get('/databases',              authenticate, listDatabases);

export default router;
