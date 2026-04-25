import 'dotenv/config';
import app from './app';
import logger from './config/logger';
import { iniciarJobs } from './jobs/alertas.job';
import { seedDefaultCompanies } from './modules/comissao/comissao.repository';

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  logger.info(`[SERVER] Rodando em http://localhost:${PORT}`);
  iniciarJobs();

  try {
    await seedDefaultCompanies();
    logger.info('[COMISSAO] Empresas padrão verificadas/sincronizadas.');
  } catch (err: any) {
    logger.warn('[COMISSAO] Seed de empresas ignorado (tabela pode ainda não existir): ' + err.message);
  }
});
