import { Router } from "express";
import { autenticar } from "../middleware/auth";
import {
  atualizarSessao,
  criarSessao,
  listarSessoes,
  obterSessao,
  obterTermoMontado,
} from "../controllers/sessaoController";
import { gerarDocxSessao, gerarPdfSessao } from "../controllers/pdfController";

const router = Router();
router.use(autenticar);

router.get("/", listarSessoes);
router.post("/", criarSessao);
router.get("/:id", obterSessao);
router.put("/:id", atualizarSessao);
router.get("/:id/termo", obterTermoMontado);
router.get("/:id/pdf", gerarPdfSessao);
router.get("/:id/docx", gerarDocxSessao);

export default router;
