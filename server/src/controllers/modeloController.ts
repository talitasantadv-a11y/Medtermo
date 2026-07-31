import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { deJson, paraJson } from "../utils/json";

const blocoSchema = z.record(z.any());

const modeloSchema = z.object({
  nome: z.string().min(2, "Informe o nome do modelo."),
  descricao: z.string().optional(),
  blocos: z.array(blocoSchema).min(1, "O modelo deve ter ao menos um bloco."),
  camposCustomizados: z.array(blocoSchema).optional(),
  ativo: z.boolean().optional(),
});

function serializarModelo<T extends { blocos: string; camposCustomizados: string | null }>(modelo: T) {
  return {
    ...modelo,
    blocos: deJson(modelo.blocos, []),
    camposCustomizados: deJson(modelo.camposCustomizados, []),
  };
}

export async function listarModelos(req: Request, res: Response) {
  const { ativo } = req.query;
  const modelos = await prisma.modelo.findMany({
    where: {
      usuarioId: req.usuario!.id,
      ...(ativo !== undefined ? { ativo: ativo === "true" } : {}),
    },
    orderBy: { createdAt: "asc" },
  });
  return res.json({ modelos: modelos.map(serializarModelo) });
}

export async function obterModelo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const modelo = await prisma.modelo.findFirst({
    where: { id, usuarioId: req.usuario!.id },
  });
  if (!modelo) return res.status(404).json({ erro: "Modelo não encontrado." });
  return res.json({ modelo: serializarModelo(modelo) });
}

export async function criarModelo(req: Request, res: Response) {
  const parsed = modeloSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const { nome, descricao, blocos, camposCustomizados, ativo } = parsed.data;

  const modelo = await prisma.modelo.create({
    data: {
      usuarioId: req.usuario!.id,
      nome,
      descricao,
      blocos: paraJson(blocos),
      camposCustomizados: paraJson(camposCustomizados ?? []),
      ativo: ativo ?? true,
    },
  });
  return res.status(201).json({ modelo: serializarModelo(modelo) });
}

export async function atualizarModelo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const parsed = modeloSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }

  const modelo = await prisma.modelo.findFirst({
    where: { id, usuarioId: req.usuario!.id },
  });
  if (!modelo) return res.status(404).json({ erro: "Modelo não encontrado." });

  const { nome, descricao, blocos, camposCustomizados, ativo } = parsed.data;
  const atualizado = await prisma.modelo.update({
    where: { id },
    data: {
      ...(nome !== undefined ? { nome } : {}),
      ...(descricao !== undefined ? { descricao } : {}),
      ...(blocos !== undefined ? { blocos: paraJson(blocos) } : {}),
      ...(camposCustomizados !== undefined
        ? { camposCustomizados: paraJson(camposCustomizados) }
        : {}),
      ...(ativo !== undefined ? { ativo } : {}),
    },
  });
  return res.json({ modelo: serializarModelo(atualizado) });
}

export async function removerModelo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const modelo = await prisma.modelo.findFirst({
    where: { id, usuarioId: req.usuario!.id },
  });
  if (!modelo) return res.status(404).json({ erro: "Modelo não encontrado." });

  const sessoesVinculadas = await prisma.sessao.count({ where: { modeloId: id } });
  if (sessoesVinculadas > 0) {
    const desativado = await prisma.modelo.update({
      where: { id },
      data: { ativo: false },
    });
    return res.json({
      modelo: serializarModelo(desativado),
      aviso: "O modelo possui sessões vinculadas e foi apenas desativado.",
    });
  }

  await prisma.modelo.delete({ where: { id } });
  return res.status(204).send();
}
