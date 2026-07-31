import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth";
import modeloRoutes from "./routes/modelos";
import processoRoutes from "./routes/processos";
import sessaoRoutes from "./routes/sessoes";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/modelos", modeloRoutes);
app.use("/api/processos", processoRoutes);
app.use("/api/sessoes", sessaoRoutes);

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

app.listen(PORT, () => {
  console.log(`MediaTermo API rodando em http://localhost:${PORT}`);
});
