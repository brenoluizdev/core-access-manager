import app from './app';
import { closeDatabase } from './config/database';
import { env } from './config/env';

const server = app.listen(env.port, () => {
  console.log(`API disponível em http://localhost:${env.port}/api`);
});

function shutdown(signal: string): void {
  console.log(`\n${signal} recebido. Encerrando...`);

  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
