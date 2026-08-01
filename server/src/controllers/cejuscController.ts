import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { LOGOS_DIR } from "../middleware/upload";

const cejuscSchema = z.object({
  nome: z.string().min(2, "Informe o nome do CEJUSC."),
  endereco: z.string().optional().nullable(),
  telefone: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido.").optional().nullable().or(z.literal("")),
});

export async function listarCejuscs(req: Request, res: Response) {
  const cejuscs = await prisma.cejusc.findMany({
    where: { usuarioId: req.usuario!.id },
    orderBy: { nome: "asc" },
  });
  return res.json({ cejuscs });
}

export async function obterCejusc(req: Request, res: Response) {
  const id = Number(req.params.id);
  const cejusc = await prisma.cejusc.findFirst({ where: { id, usuarioId: req.usuario!.id } });
  if (!cejusc) return res.status(404).json({ erro: "CEJUSC não encontrado." });
  return res.json({ cejusc });
}

export async function criarCejusc(req: Request, res: Response) {
  const parsed = cejuscSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: parsed.error.issues[0].message });

  const { nome, endereco, telefone, email } = parsed.data;
  const cejusc = await prisma.cejusc.create({
    data: { usuarioId: req.usuario!.id, nome, endereco, telefone, email: email || null },
  });
  return res.status(201).json({ cejusc });
}

export async function atualizarCejusc(req: Request, res: Response) {
  const id = Number(req.params.id);
  const parsed = cejuscSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ erro: parsed.error.issues[0].message });

  const cejusc = await prisma.cejusc.findFirst({ where: { id, usuarioId: req.usuario!.id } });
  if (!cejusc) return res.status(404).json({ erro: "CEJUSC não encontrado." });

  const { nome, endereco, telefone, email } = parsed.data;
  const atualizado = await prisma.cejusc.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome } : {}),
      ...(endereco !== undefined ? { endereco } : {}),
      ...(telefone !== undefined ? { telefone } : {}),
      ...(email !== undefined ? { email: email || null } : {}),
    },
  });
  return res.json({ cejusc: atualizado });
}

export async function removerCejusc(req: Request, res: Response) {
  const id = Number(req.params.id);
  const cejusc = await prisma.cejusc.findFirst({ where: { id, usuarioId: req.usuario!.id } });
  if (!cejusc) return res.status(404).json({ erro: "CEJUSC não encontrado." });

  await prisma.modelo.updateMany({ where: { cejuscId: id }, data: { cejuscId: null } });

  if (cejusc.logoPath) {
    fs.unlink(path.join(LOGOS_DIR, path.basename(cejusc.logoPath)), () => {});
  }
  await prisma.cejusc.delete({ where: { id } });
  return res.status(204).send();
}

export async function enviarLogo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const cejusc = await prisma.cejusc.findFirst({ where: { id, usuarioId: req.usuario!.id } });
  if (!cejusc) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ erro: "CEJUSC não encontrado." });
  }
  if (!req.file) return res.status(400).json({ erro: "Nenhuma imagem enviada." });

  if (cejusc.logoPath) {
    fs.unlink(path.join(LOGOS_DIR, path.basename(cejusc.logoPath)), () => {});
  }

  const logoPath = `logos/${req.file.filename}`;
  const atualizado = await prisma.cejusc.update({ where: { id }, data: { logoPath } });
  return res.json({ cejusc: atualizado });
}

export async function removerLogo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const cejusc = await prisma.cejusc.findFirst({ where: { id, usuarioId: req.usuario!.id } });
  if (!cejusc) return res.status(404).json({ erro: "CEJUSC não encontrado." });

  if (cejusc.logoPath) {
    fs.unlink(path.join(LOGOS_DIR, path.basename(cejusc.logoPath)), () => {});
  }
  const atualizado = await prisma.cejusc.update({ where: { id }, data: { logoPath: null } });
  return res.json({ cejusc: atualizado });
}
