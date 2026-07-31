import { Router } from "express";
import { autenticar } from "../middleware/auth";
import {
  atualizarModelo,
  criarModelo,
  listarModelos,
  obterModelo,
  removerModelo,
} from "../controllers/modeloController";

const router = Router();
router.use(autenticar);

router.get("/", listarModelos);
router.get("/:id", obterModelo);
router.post("/", criarModelo);
router.put("/:id", atualizarModelo);
router.delete("/:id", removerModelo);

export default router;
