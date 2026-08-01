import { createApp } from "./app";
import { bootstrapBancoDeDados, semearDadosIniciais } from "./services/bootstrap/desktopBootstrap";

export interface OpcoesIniciarDesktop {
  port: number;
  clientDistPath: string;
  migrationsDir: string;
}

/**
 * Ponto de entrada usado pelo processo principal do Electron (desktop/main.js).
 * Diferente de src/index.ts (modo web), aqui: (1) as variáveis de ambiente já
 * chegam definidas pelo Electron antes deste módulo ser importado — não há
 * dotenv aqui; (2) o schema do banco é criado via SQL bruto na primeira
 * execução, já que o motor de migração do Prisma não é empacotado; (3) o
 * Express também serve os arquivos estáticos do client (SPA).
 */
export async function iniciarAppDesktop(opcoes: OpcoesIniciarDesktop) {
  await bootstrapBancoDeDados(opcoes.migrationsDir);
  await semearDadosIniciais();

  const app = createApp({ clientDistPath: opcoes.clientDistPath });

  return new Promise<{ port: number }>((resolve, reject) => {
    const server = app.listen(opcoes.port, "127.0.0.1", () => {
      resolve({ port: opcoes.port });
    });
    server.on("error", reject);
  });
}
