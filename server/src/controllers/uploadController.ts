import fs from "fs";
import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { extrairTextoPdf } from "../services/pdf/extractor";
import { extrairDadosDoTexto, DadosExtraidosProcesso } from "../services/parser/processo";
import { consolidarDadosExtraidos } from "../services/pdf/consolidar";
import { MAX_ARQUIVOS_POR_PROCESSO } from "../middleware/upload";
import { deJson, paraJson } from "../utils/json";

function serializarUpload<T extends { dadosExtraidos: string | null }>(upload: T) {
  return { ...upload, dadosExtraidos: deJson(upload.dadosExtraidos, null) };
}

export async function enviarUpload(req: Request, res: Response) {
  const processoId = Number(req.params.id);
  const processo = await prisma.processo.findFirst({
    where: { id: processoId, usuarioId: req.usuario!.id },
  });
  if (!processo) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(404).json({ erro: "Processo não encontrado." });
  }

  if (!req.file) {
    return res.status(400).json({ erro: "Nenhum arquivo PDF enviado." });
  }

  const totalUploads = await prisma.uploadProcesso.count({ where: { processoId } });
  if (totalUploads >= MAX_ARQUIVOS_POR_PROCESSO) {
    fs.unlink(req.file.path, () => {});
    return res
      .status(400)
      .json({ erro: `Limite de ${MAX_ARQUIVOS_POR_PROCESSO} arquivos por processo atingido.` });
  }

  const upload = await prisma.uploadProcesso.create({
    data: {
      processoId,
      arquivoNome: req.file.originalname,
      arquivoPath: req.file.path,
      status: "processando",
    },
  });

  try {
    const { texto, origem } = await extrairTextoPdf(req.file.path);
    const dadosExtraidos = extrairDadosDoTexto(texto);

    const atualizado = await prisma.uploadProcesso.update({
      where: { id: upload.id },
      data: {
        status: "extraido",
        dadosExtraidos: paraJson({ ...dadosExtraidos, origemTexto: origem }),
      },
    });

    return res.status(201).json({ upload: serializarUpload(atualizado) });
  } catch (erro) {
    console.error("Erro ao processar PDF:", erro);
    const atualizado = await prisma.uploadProcesso.update({
      where: { id: upload.id },
      data: { status: "erro" },
    });
    return res.status(200).json({
      upload: serializarUpload(atualizado),
      aviso: "Não foi possível extrair dados automaticamente deste arquivo. Preencha manualmente.",
    });
  }
}

export async function listarUploads(req: Request, res: Response) {
  const processoId = Number(req.params.id);
  const processo = await prisma.processo.findFirst({
    where: { id: processoId, usuarioId: req.usuario!.id },
  });
  if (!processo) return res.status(404).json({ erro: "Processo não encontrado." });

  const uploads = await prisma.uploadProcesso.findMany({
    where: { processoId },
    orderBy: { createdAt: "asc" },
  });

  const extracoes = uploads
    .filter((u) => u.status === "extraido" && u.dadosExtraidos)
    .map((u) => deJson<DadosExtraidosProcesso | null>(u.dadosExtraidos, null))
    .filter((d): d is DadosExtraidosProcesso => d !== null);

  const dadosConsolidados = consolidarDadosExtraidos(extracoes);

  return res.json({ uploads: uploads.map(serializarUpload), dadosConsolidados });
}

export async function removerUpload(req: Request, res: Response) {
  const processoId = Number(req.params.id);
  const uploadId = Number(req.params.uploadId);

  const processo = await prisma.processo.findFirst({
    where: { id: processoId, usuarioId: req.usuario!.id },
  });
  if (!processo) return res.status(404).json({ erro: "Processo não encontrado." });

  const upload = await prisma.uploadProcesso.findFirst({
    where: { id: uploadId, processoId },
  });
  if (!upload) return res.status(404).json({ erro: "Upload não encontrado." });

  await prisma.uploadProcesso.delete({ where: { id: uploadId } });
  fs.unlink(upload.arquivoPath, () => {});

  return res.status(204).send();
}
