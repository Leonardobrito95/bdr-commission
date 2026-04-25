/**
 * Logger estruturado leve — emite JSON com timestamp e nível.
 * Interface compatível com pino para facilitar migração futura.
 *
 * Exemplo de saída:
 *   {"time":"2025-04-08T11:00:00.000Z","level":"info","msg":"[SERVER] Rodando em http://localhost:3000"}
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_NUM: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const MIN_LEVEL: Level =
  (process.env.LOG_LEVEL as Level | undefined) ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function emit(level: Level, msg: string, extra?: Record<string, unknown>): void {
  if (LEVEL_NUM[level] < LEVEL_NUM[MIN_LEVEL]) return;

  const entry: Record<string, unknown> = {
    time:  new Date().toISOString(),
    level,
    msg,
    ...extra,
  };

  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  debug: (msg: string, extra?: Record<string, unknown>) => emit('debug', msg, extra),
  info:  (msg: string, extra?: Record<string, unknown>) => emit('info',  msg, extra),
  warn:  (msg: string, extra?: Record<string, unknown>) => emit('warn',  msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => emit('error', msg, extra),
};

export default logger;
