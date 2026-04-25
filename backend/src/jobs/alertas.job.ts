import cron from 'node-cron';
import logger from '../config/logger';
import {
  alertaAssinaturaPendente,
  alertaFaturaNaoQuitada,
  alertaRetencaoMeta,
  alertaRetencaoFimMes,
} from '../modules/alertas/alertas.service';
import { enviarRelatorioComercial } from '../modules/vendas/comissao-envio.service';
import { gerarSnapshot } from '../modules/vendas/snapshot.service';

const DIAS_VENDAS   = [15, 25, 30];
const DIA_COMISSAO  = 19;

async function runSafe(nome: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    logger.error(`[ALERTA] Erro ao executar "${nome}"`, { error: String(err) });
  }
}

function mesAnterior(): string {
  const now   = new Date();
  const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 12 : now.getMonth();
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function iniciarJobs(): void {
  cron.schedule('0 8 * * *', async () => {
    const diaAtual = new Date().getDate();

    if (DIAS_VENDAS.includes(diaAtual)) {
      await runSafe('Assinatura Pendente', alertaAssinaturaPendente);
      await runSafe('Fatura Não Quitada',  alertaFaturaNaoQuitada);
    }

    await runSafe('Retenção Meta',       alertaRetencaoMeta);
    await runSafe('Retenção Fim de Mês', alertaRetencaoFimMes);

    if (diaAtual === DIA_COMISSAO) {
      const mes = mesAnterior();
      await runSafe('Snapshot Mensal', async () => {
        const result = await gerarSnapshot(mes);
        logger.info(`[JOBS] Snapshot ${mes}: ${result.total} contratos (${result.liberadas} liberadas).`);
      });
      await runSafe('Relatório Comissão → Comercial', () => enviarRelatorioComercial(mes));
    }
  }, { timezone: 'America/Sao_Paulo' });

  logger.info('[JOBS] Alertas agendados — execução diária às 08:00 (Brasília).');
}
