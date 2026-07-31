import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { Bloco } from "../types/termo";
import {
  camposObrigatoriosFaltantes,
  montarTermo,
} from "../services/termo/builder";
import { deJson, paraJson } from "../utils/json";

const RESULTADOS = [
  "acordo_total",
  "acordo_parcial",
  "sem_acordo",
  "reagendamento",
  "ausencia_requerente",
  "ausencia_requerido",
] as const;

const criarSessaoSchema = z.object({
  processoId: z.number(),
  modeloId: z.number(),
  dataSessao: z.string().min(1, "Informe a data da sessão."),
  horarioInicio: z.string().min(1, "Informe o horário de início."),
  horarioEncerramento: z.string().optional().nullable(),
  local: z.string().optional().nullable(),
  modalidade: z.enum(["presencial", "virtual"]),
  plataformaVirtual: z.string().optional().nullable(),
  presencas: z.record(z.boolean()).optional(),
});

const atualizarSessaoSchema = z.object({
  dataSessao: z.string().optional(),
  horarioInicio: z.string().optional(),
  horarioEncerramento: z.string().optional().nullable(),
  local: z.string().optional().nullable(),
  modalidade: z.enum(["presencial", "virtual"]).optional(),
  plataformaVirtual: z.string().optional().nullable(),
  presencas: z.record(z.boolean()).optional(),
  resultado: z.enum(RESULTADOS).optional().nullable(),
  termosAcordo: z.string().optional().nullable(),
  dadosExtras: z.record(z.string()).optional(),
  reagendamentoData: z.string().optional().nullable(),
  reagendamentoMotivo: z.string().optional().nullable(),
  status: z.enum(["pendente", "em_andamento", "finalizado"]).optional(),
});

function serializarModelo<T extends { blocos: string; camposCustomizados: string | null }>(modelo: T) {
  return {
    ...modelo,
    blocos: deJson(modelo.blocos, []),
    camposCustomizados: deJson(modelo.camposCustomizados, []),
  };
}

function serializarSessao<
  T extends {
    presencas: string | null;
    dadosExtras: string | null;
    modelo?: { blocos: string; camposCustomizados: string | null };
  }
>(sessao: T) {
  return {
    ...sessao,
    presencas: deJson(sessao.presencas, {}),
    dadosExtras: deJson(sessao.dadosExtras, {}),
    ...(sessao.modelo ? { modelo: serializarModelo(sessao.modelo) } : {}),
  };
}

async function carregarSessaoCompleta(id: number, usuarioId: number) {
  const sessao = await prisma.sessao.findFirst({
    where: { id, processo: { usuarioId } },
    include: {
      processo: { include: { partes: true } },
      modelo: true,
    },
  });
  return sessao;
}

export async function criarSessao(req: Request, res: Response) {
  const parsed = criarSessaoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const dados = parsed.data;

  const processo = await prisma.processo.findFirst({
    where: { id: dados.processoId, usuarioId: req.usuario!.id },
  });
  if (!processo) return res.status(404).json({ erro: "Processo não encontrado." });

  const modelo = await prisma.modelo.findFirst({
    where: { id: dados.modeloId, usuarioId: req.usuario!.id },
  });
  if (!modelo) return res.status(404).json({ erro: "Modelo não encontrado." });

  const sessao = await prisma.sessao.create({
    data: {
      processoId: dados.processoId,
      modeloId: dados.modeloId,
      dataSessao: new Date(dados.dataSessao),
      horarioInicio: dados.horarioInicio,
      horarioEncerramento: dados.horarioEncerramento || null,
      local: dados.local || null,
      modalidade: dados.modalidade,
      plataformaVirtual: dados.plataformaVirtual || null,
      presencas: paraJson(dados.presencas ?? {}),
      status: "em_andamento",
    },
  });

  return res.status(201).json({ sessao: serializarSessao(sessao) });
}

export async function listarSessoes(req: Request, res: Response) {
  const processoId = Number(req.query.processoId);
  if (!processoId) return res.status(400).json({ erro: "Informe o processoId." });

  const processo = await prisma.processo.findFirst({
    where: { id: processoId, usuarioId: req.usuario!.id },
  });
  if (!processo) return res.status(404).json({ erro: "Processo não encontrado." });

  const sessoes = await prisma.sessao.findMany({
    where: { processoId },
    include: { modelo: true },
    orderBy: { dataSessao: "desc" },
  });
  return res.json({ sessoes: sessoes.map(serializarSessao) });
}

export async function obterSessao(req: Request, res: Response) {
  const id = Number(req.params.id);
  const sessao = await carregarSessaoCompleta(id, req.usuario!.id);
  if (!sessao) return res.status(404).json({ erro: "Sessão não encontrada." });
  return res.json({ sessao: serializarSessao(sessao) });
}

export async function atualizarSessao(req: Request, res: Response) {
  const id = Number(req.params.id);
  const parsed = atualizarSessaoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }

  const sessaoExistente = await carregarSessaoCompleta(id, req.usuario!.id);
  if (!sessaoExistente) return res.status(404).json({ erro: "Sessão não encontrada." });

  const d = parsed.data;

  if (
    (d.resultado === "acordo_total" || d.resultado === "acordo_parcial") &&
    d.termosAcordo === undefined &&
    !sessaoExistente.termosAcordo
  ) {
    return res.status(400).json({
      erro: "Os termos do acordo são obrigatórios quando o resultado é acordo total ou parcial.",
    });
  }

  const sessao = await prisma.sessao.update({
    where: { id },
    data: {
      ...(d.dataSessao !== undefined ? { dataSessao: new Date(d.dataSessao) } : {}),
      ...(d.horarioInicio !== undefined ? { horarioInicio: d.horarioInicio } : {}),
      ...(d.horarioEncerramento !== undefined
        ? { horarioEncerramento: d.horarioEncerramento }
        : {}),
      ...(d.local !== undefined ? { local: d.local } : {}),
      ...(d.modalidade !== undefined ? { modalidade: d.modalidade } : {}),
      ...(d.plataformaVirtual !== undefined
        ? { plataformaVirtual: d.plataformaVirtual }
        : {}),
      ...(d.presencas !== undefined ? { presencas: paraJson(d.presencas) } : {}),
      ...(d.resultado !== undefined ? { resultado: d.resultado } : {}),
      ...(d.termosAcordo !== undefined ? { termosAcordo: d.termosAcordo } : {}),
      ...(d.dadosExtras !== undefined ? { dadosExtras: paraJson(d.dadosExtras) } : {}),
      ...(d.reagendamentoData !== undefined
        ? { reagendamentoData: d.reagendamentoData ? new Date(d.reagendamentoData) : null }
        : {}),
      ...(d.reagendamentoMotivo !== undefined
        ? { reagendamentoMotivo: d.reagendamentoMotivo }
        : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
    },
  });

  return res.json({ sessao: serializarSessao(sessao) });
}

export async function obterTermoMontado(req: Request, res: Response) {
  const id = Number(req.params.id);
  const sessao = await carregarSessaoCompleta(id, req.usuario!.id);
  if (!sessao) return res.status(404).json({ erro: "Sessão não encontrada." });

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });

  const blocos = deJson<Bloco[]>(sessao.modelo.blocos, []);
  const presencas = deJson<Record<string, boolean>>(sessao.presencas, {});
  const dadosExtras = deJson<Record<string, string>>(sessao.dadosExtras, {});

  const faltantes = camposObrigatoriosFaltantes(blocos, { ...sessao, presencas, dadosExtras });

  const termo = montarTermo(
    blocos,
    sessao.processo,
    sessao.processo.partes,
    { ...sessao, presencas, dadosExtras },
    usuario
  );

  return res.json({ termo, camposObrigatoriosFaltantes: faltantes });
}
