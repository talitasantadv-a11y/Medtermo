import { Router } from "express";
import { autenticar } from "../middleware/auth";
import { uploadLogo } from "../middleware/upload";
import {
  atualizarCejusc,
  criarCejusc,
  enviarLogo,
  listarCejuscs,
  obterCejusc,
  removerCejusc,
  removerLogo,
} from "../controllers/cejuscController";

const router = Router();
router.use(autenticar);

router.get("/", listarCejuscs);
router.get("/:id", obterCejusc);
router.post("/", criarCejusc);
router.put("/:id", atualizarCejusc);
router.delete("/:id", removerCejusc);
router.post("/:id/logo", uploadLogo.single("logo"), enviarLogo);
router.delete("/:id/logo", removerLogo);

export default router;
