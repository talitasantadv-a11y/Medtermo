import fs from "fs";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { formatarCnj, validarCnj } from "../services/parser/cnj";
import { validarDocumento } from "../services/parser/cpf";
import { consultarProcessoDatajud, DatajudError, resolverAliasDatajud } from "../services/cnj/datajud";

const parteSchema = z.object({
  id: z.number().optional(),
  polo: z.enum(["requerente", "requerido"]),
  nomeCompleto: z.string().min(2, "Informe o nome da parte."),
  cpf: z.string().optional().nullable(),
  advogadoNome: z.string().optional().nullable(),
  advogadoOab: z.string().optional().nullable(),
  isPreposto: z.boolean().optional(),
});

const processoSchema = z.object({
  numeroCnj: z.string().refine((v) => v.replace(/\D/g, "").length === 20, {
    message: "Número CNJ deve conter 20 dígitos no formato NNNNNNN-DD.AAAA.J.TR.OOOO.",
  }),
  lotacao: z.string().optional().nullable(),
  comarca: z.string().optional().nullable(),
  classeProcessual: z.string().optional().nullable(),
  assunto: z.string().optional().nullable(),
  partes: z.array(parteSchema).min(1, "Informe ao menos uma parte."),
});

function validarPartes(partes: z.infer<typeof parteSchema>[]) {
  const temRequerente = partes.some((p) => p.polo === "requerente");
  const temRequerido = partes.some((p) => p.polo === "requerido");
  if (!temRequerente || !temRequerido) {
    return "É necessário informar ao menos uma parte requerente e uma requerida.";
  }
  for (const p of partes) {
    const digitos = p.cpf?.replace(/\D/g, "") || "";
    if (digitos && (digitos.length === 11 || digitos.length === 14) && !validarDocumento(p.cpf!)) {
      return `CPF/CNPJ inválido para a parte "${p.nomeCompleto}".`;
    }
  }
  return null;
}

const iniciarSchema = z.object({
  numeroCnj: z.string().refine((v) => v.replace(/\D/g, "").length === 20, {
    message: "Número CNJ deve conter 20 dígitos no formato NNNNNNN-DD.AAAA.J.TR.OOOO.",
  }),
});

/**
 * Cria (ou retorna, se já existir) um registro de processo apenas com o número CNJ,
 * usado como base para anexar uploads de PDF antes que os demais dados sejam confirmados.
 */
export async function iniciarProcesso(req: Request, res: Response) {
  const parsed = iniciarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const numeroFormatado = formatarCnj(parsed.data.numeroCnj);
  if (!validarCnj(numeroFormatado)) {
    return res.status(400).json({
      erro: "Número CNJ com dígito verificador inválido. Confira o número informado.",
    });
  }

  const existente = await prisma.processo.findUnique({
    where: { numeroCnj: numeroFormatado },
    include: { partes: true },
  });
  if (existente) {
    if (existente.usuarioId !== req.usuario!.id) {
      return res.status(409).json({ erro: "Este processo já está cadastrado por outro usuário." });
    }
    return res.json({ processo: existente });
  }

  const processo = await prisma.processo.create({
    data: { numeroCnj: numeroFormatado, usuarioId: req.usuario!.id },
    include: { partes: true },
  });
  return res.status(201).json({ processo });
}

export async function buscarPorCnj(req: Request, res: Response) {
  const numeroCnj = String(req.query.numeroCnj || "");
  if (!numeroCnj) return res.status(400).json({ erro: "Informe o número CNJ." });

  const cnjValido = validarCnj(numeroCnj);
  const formatado = formatarCnj(numeroCnj);

  const processo = await prisma.processo.findFirst({
    where: { numeroCnj: formatado, usuarioId: req.usuario!.id },
    include: {
      partes: true,
      sessoes: { orderBy: { dataSessao: "desc" } },
    },
  });

  return res.json({ encontrado: !!processo, cnjValido, processo });
}

export async function listarProcessos(req: Request, res: Response) {
  const { busca, status } = req.query;

  const processos = await prisma.processo.findMany({
    where: {
      usuarioId: req.usuario!.id,
      ...(busca ? { numeroCnj: { contains: String(busca) } } : {}),
    },
    include: {
      partes: true,
      sessoes: { orderBy: { dataSessao: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const resultado = processos
    .map((p) => ({
      ...p,
      statusAtual: p.sessoes[0]?.status ?? "pendente",
      ultimaSessao: p.sessoes[0] ?? null,
    }))
    .filter((p) => (status ? p.statusAtual === status : true));

  return res.json({ processos: resultado });
}

export async function obterProcesso(req: Request, res: Response) {
  const id = Number(req.params.id);
  const processo = await prisma.processo.findFirst({
    where: { id, usuarioId: req.usuario!.id },
    include: {
      partes: true,
      sessoes: { orderBy: { dataSessao: "desc" }, include: { modelo: true } },
      uploads: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!processo) return res.status(404).json({ erro: "Processo não encontrado." });
  return res.json({ processo });
}

export async function criarOuAtualizarProcesso(req: Request, res: Response) {
  const parsed = processoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: parsed.error.issues[0].message });
  }
  const { numeroCnj, lotacao, comarca, classeProcessual, assunto, partes } = parsed.data;

  const erroPartes = validarPartes(partes);
  if (erroPartes) return res.status(400).json({ erro: erroPartes });

  const numeroFormatado = formatarCnj(numeroCnj);
  if (!validarCnj(numeroFormatado)) {
    return res.status(400).json({
      erro: "Número CNJ com dígito verificador inválido. Confira o número informado.",
    });
  }

  const existente = await prisma.processo.findUnique({
    where: { numeroCnj: numeroFormatado },
  });

  if (existente && existente.usuarioId !== req.usuario!.id) {
    return res.status(409).json({ erro: "Este processo já está cadastrado por outro usuário." });
  }

  const processo = await prisma.$transaction(async (tx) => {
    const salvo = existente
      ? await tx.processo.update({
          where: { id: existente.id },
          data: { lotacao, comarca, classeProcessual, assunto },
        })
      : await tx.processo.create({
          data: {
            numeroCnj: numeroFormatado,
            lotacao,
            comarca,
            classeProcessual,
            assunto,
            usuarioId: req.usuario!.id,
          },
        });

    await tx.parte.deleteMany({ where: { processoId: salvo.id } });
    await tx.parte.createMany({
      data: partes.map((p) => ({
        processoId: salvo.id,
        polo: p.polo,
        nomeCompleto: p.nomeCompleto,
        cpf: p.cpf || null,
        advogadoNome: p.advogadoNome || null,
        advogadoOab: p.advogadoOab || null,
        isPreposto: p.isPreposto || false,
      })),
    });

    return tx.processo.findUnique({
      where: { id: salvo.id },
      include: { partes: true },
    });
  });

  return res.status(existente ? 200 : 201).json({ processo });
}

export async function removerProcesso(req: Request, res: Response) {
  const id = Number(req.params.id);
  const processo = await prisma.processo.findFirst({
    where: { id, usuarioId: req.usuario!.id },
    include: { sessoes: true, uploads: true },
  });
  if (!processo) return res.status(404).json({ erro: "Processo não encontrado." });

  const temSessaoFinalizada = processo.sessoes.some((s) => s.status === "finalizado");
  if (temSessaoFinalizada) {
    return res.status(409).json({
      erro: "Não é possível excluir: este processo já tem termo finalizado. O histórico precisa ser preservado.",
    });
  }

  await prisma.processo.delete({ where: { id } });
  for (const upload of processo.uploads) {
    fs.unlink(upload.arquivoPath, () => {});
  }

  return res.status(204).send();
}

export async function consultarCnj(req: Request, res: Response) {
  const numeroCnj = String(req.query.numeroCnj || "");
  if (!validarCnj(numeroCnj)) {
    return res.status(400).json({ erro: "Número CNJ inválido." });
  }

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario?.datajudApiKey) {
    return res.status(400).json({
      erro:
        "Cadastre sua chave da API pública DataJud (CNJ) em Perfil para usar a busca automática.",
    });
  }

  if (!resolverAliasDatajud(numeroCnj)) {
    return res.status(400).json({
      erro:
        "Este tribunal ainda não é suportado pela busca automática (por enquanto cobrimos a Justiça Estadual).",
    });
  }

  try {
    const dados = await consultarProcessoDatajud(numeroCnj, usuario.datajudApiKey);
    if (!dados) {
      return res.json({ encontrado: false });
    }
    return res.json({ encontrado: true, dados });
  } catch (erro) {
    if (erro instanceof DatajudError) {
      return res.status(erro.status && erro.status < 500 ? 400 : 502).json({ erro: erro.message });
    }
    console.error("Erro ao consultar DataJud:", erro);
    return res.status(502).json({ erro: "Erro inesperado ao consultar o DataJud." });
  }
}
