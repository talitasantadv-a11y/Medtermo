import { Router } from "express";
import { atualizarPerfil, login, me, registrar } from "../controllers/authController";
import { autenticar } from "../middleware/auth";

const router = Router();

router.post("/registrar", registrar);
router.post("/login", login);
router.get("/me", autenticar, me);
router.put("/perfil", autenticar, atualizarPerfil);

export default router;
