import fs from "fs";
import path from "path";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth";
import modeloRoutes from "./routes/modelos";
import processoRoutes from "./routes/processos";
import sessaoRoutes from "./routes/sessoes";

/**
 * Monta a aplicação Express. Usado tanto pelo servidor "web" normal
 * (server/src/index.ts) quanto pelo app desktop Electron (server/src/desktop.ts),
 * que também serve os arquivos estáticos do client via `clientDistPath`.
 */
export function createApp(options?: { clientDistPath?: string }) {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/modelos", modeloRoutes);
  app.use("/api/processos", processoRoutes);
  app.use("/api/sessoes", sessaoRoutes);

  const clientDistPath = options?.clientDistPath;
  if (clientDistPath && fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  app.use(
    (
      err: Error & { message?: string },
      _req: express.Request,
      res: express.Response,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({ erro: err.message || "Erro interno do servidor." });
    }
  );

  return app;
}
