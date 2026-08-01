import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { assinarToken } from "../middleware/auth";
import {
  blocosModeloFazenda,
  blocosModeloGeral334,
  camposCustomizadosModeloFazenda,
} from "../services/termo/modelosPadrao";
import { paraJson } from "../utils/json";

const registroSchema = z.object({
  nomeCompleto: z.string().min(3, "Informe o nome completo."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  registroProfissional: z.string().optional(),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

function usuarioPublico(usuario: {
  id: number;
  nomeCompleto: string;
  email: string;
  registroProfissional: string | null;
  telefone: string | null;
  cargo: string | null;
  datajudApiKey: string | null;
}) {
  return {
    id: usuario.id,
    nomeCompleto: usuario.nomeCompleto,
    email: usuario.email,
    registroProfissional: usuario.registroProfissional,
    telefone: usuario.telefone,
    cargo: usuario.cargo,
    datajudApiKey: usuario.datajudApiKey,
  };
}

export async function registrar(req: Request, res: Response) {
  const parsed = registroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const { nomeCompleto, email, senha, registroProfissional, telefone, cargo } =
    parsed.data;

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return res.status(409).json({ erro: "Já existe um usuário com este e-mail." });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nomeCompleto,
      email,
      senhaHash,
      registroProfissional,
      telefone,
      cargo: cargo || "Mediador(a) Judicial",
    },
  });

  // Todo novo usuário recebe uma cópia editável dos modelos pré-cadastrados
  await prisma.modelo.create({
    data: {
      usuarioId: usuario.id,
      nome: "Modelo Geral 334",
      descricao:
        "Termo de audiência de conciliação/mediação nos moldes do art. 334 do CPC.",
      blocos: paraJson(blocosModeloGeral334()),
      camposCustomizados: paraJson([]),
      ativo: true,
    },
  });
  await prisma.modelo.create({
    data: {
      usuarioId: usuario.id,
      nome: "Modelo Fazenda Pública",
      descricao:
        "Termo de sessão de conciliação/mediação envolvendo a Fazenda Pública, com dados de RPV.",
      blocos: paraJson(blocosModeloFazenda()),
      camposCustomizados: paraJson(camposCustomizadosModeloFazenda()),
      ativo: true,
    },
  });

  const token = assinarToken({ id: usuario.id, email: usuario.email });
  return res.status(201).json({ token, usuario: usuarioPublico(usuario) });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const { email, senha } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  const senhaConfere = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaConfere) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  const token = assinarToken({ id: usuario.id, email: usuario.email });
  return res.json({ token, usuario: usuarioPublico(usuario) });
}

export async function me(req: Request, res: Response) {
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });
  return res.json({ usuario: usuarioPublico(usuario) });
}

const perfilSchema = z.object({
  nomeCompleto: z.string().min(3).optional(),
  registroProfissional: z.string().optional(),
  telefone: z.string().optional(),
  cargo: z.string().optional(),
  datajudApiKey: z.string().optional(),
  senhaAtual: z.string().optional(),
  novaSenha: z.string().min(6).optional(),
});

export async function atualizarPerfil(req: Request, res: Response) {
  const parsed = perfilSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const {
    nomeCompleto,
    registroProfissional,
    telefone,
    cargo,
    datajudApiKey,
    senhaAtual,
    novaSenha,
  } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });

  const data: Record<string, unknown> = {
    nomeCompleto,
    registroProfissional,
    telefone,
    cargo,
    ...(datajudApiKey !== undefined ? { datajudApiKey: datajudApiKey || null } : {}),
  };

  if (novaSenha) {
    if (!senhaAtual || !(await bcrypt.compare(senhaAtual, usuario.senhaHash))) {
      return res.status(400).json({ erro: "Senha atual incorreta." });
    }
    data.senhaHash = await bcrypt.hash(novaSenha, 10);
  }

  const atualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data,
  });

  return res.json({ usuario: usuarioPublico(atualizado) });
}
