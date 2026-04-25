import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { listContracts, debugZapSign, refreshZapSign, listSnapshots, getSnapshotMes, criarSnapshot, enviarPagamento, getComissoesPorMes, getStatusRelatorio, enviarFinanceiro } from './vendas.controller';

const router = Router();

router.get('/contracts',                           authenticate, listContracts);
router.get('/contracts/zapsign/debug/:contractId', authenticate, debugZapSign);
router.post('/contracts/zapsign/refresh',          authenticate, refreshZapSign);

// Comissões por mês (snapshot Postgres ou live IXC)
router.get('/comissoes/:mes',          authenticate, getComissoesPorMes);

// Snapshots mensais
router.get('/snapshots',              authenticate, listSnapshots);
router.get('/snapshots/:mes',         authenticate, getSnapshotMes);
router.post('/snapshots/:mes',        authenticate, criarSnapshot);
router.post('/snapshots/:mes/pagar',  authenticate, enviarPagamento);

// Relatório de comissão mensal
router.get('/relatorio/:mes/status',           authenticate, getStatusRelatorio);
router.post('/relatorio/:mes/enviar-financeiro', authenticate, enviarFinanceiro);

export default router;
