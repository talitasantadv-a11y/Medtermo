import { Router } from "express";
import { autenticar } from "../middleware/auth";
import {
  buscarPorCnj,
  consultarCnj,
  criarOuAtualizarProcesso,
  iniciarProcesso,
  listarProcessos,
  obterProcesso,
  removerProcesso,
} from "../controllers/processoController";
import { enviarUpload, listarUploads, removerUpload } from "../controllers/uploadController";
import { uploadPdf } from "../middleware/upload";

const router = Router();
router.use(autenticar);

router.get("/", listarProcessos);
router.get("/buscar", buscarPorCnj);
router.get("/consultar-cnj", consultarCnj);
router.post("/iniciar", iniciarProcesso);
router.get("/:id", obterProcesso);
router.post("/", criarOuAtualizarProcesso);
router.delete("/:id", removerProcesso);

router.get("/:id/uploads", listarUploads);
router.post("/:id/uploads", uploadPdf.single("arquivo"), enviarUpload);
router.delete("/:id/uploads/:uploadId", removerUpload);

export default router;
