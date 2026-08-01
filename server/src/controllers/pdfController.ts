import path from "path";
import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { Bloco } from "../types/termo";
import {
  BlocoRenderizado,
  camposObrigatoriosFaltantes,
  montarTermo,
} from "../services/termo/builder";
import { renderizarHtmlTermo } from "../services/pdf/template";
import { gerarPdfDeHtml } from "../services/pdf/generator";
import { gerarDocxDoTermo, InfoCejuscParaDocx } from "../services/docx/generator";
import { UPLOAD_DIR } from "../middleware/upload";
import { deJson } from "../utils/json";

class ErroExportacao extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function montarTermoParaExportacao(id: number, usuarioId: number) {
  const sessao = await prisma.sessao.findFirst({
    where: { id, processo: { usuarioId } },
    include: { processo: { include: { partes: true } }, modelo: { include: { cejusc: true } } },
  });
  if (!sessao) throw new ErroExportacao("Sessão não encontrada.", 404);

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new ErroExportacao("Usuário não encontrado.", 404);

  const blocos = deJson<Bloco[]>(sessao.modelo.blocos, []);
  const sessaoNormalizada = {
    ...sessao,
    presencas: deJson<Record<string, boolean>>(sessao.presencas, {}),
    dadosExtras: deJson<Record<string, string>>(sessao.dadosExtras, {}),
  };

  if (!sessao.resultado) {
    throw new ErroExportacao("Selecione o resultado da sessão antes de gerar o termo.", 400);
  }
  const faltantes = camposObrigatoriosFaltantes(blocos, sessaoNormalizada);
  if (faltantes.length > 0) {
    throw new ErroExportacao(
      `Preencha os campos obrigatórios antes de gerar o termo: ${faltantes.join(", ")}.`,
      400
    );
  }

  const termo = montarTermo(
    blocos,
    sessao.processo,
    sessao.processo.partes,
    sessaoNormalizada,
    usuario
  );

  const cejusc: InfoCejuscParaDocx | null = sessao.modelo.cejusc
    ? {
        nome: sessao.modelo.cejusc.nome,
        endereco: sessao.modelo.cejusc.endereco,
        telefone: sessao.modelo.cejusc.telefone,
        email: sessao.modelo.cejusc.email,
        logoAbsolutePath: sessao.modelo.cejusc.logoPath
          ? path.join(UPLOAD_DIR, sessao.modelo.cejusc.logoPath)
          : null,
      }
    : null;

  return { sessao, termo: termo as BlocoRenderizado[], cejusc };
}

function nomeArquivoBase(numeroCnj: string, id: number): string {
  return `termo-${numeroCnj.replace(/\D/g, "")}-${id}`;
}

export async function gerarPdfSessao(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const { sessao, termo } = await montarTermoParaExportacao(id, req.usuario!.id);
    const html = renderizarHtmlTermo(termo);
    const pdfBuffer = await gerarPdfDeHtml(html);

    await prisma.sessao.update({ where: { id }, data: { status: "finalizado" } });

    const nomeArquivo = `${nomeArquivoBase(sessao.processo.numeroCnj, id)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
    return res.send(pdfBuffer);
  } catch (erro) {
    if (erro instanceof ErroExportacao) {
      return res.status(erro.status).json({ erro: erro.message });
    }
    console.error("Erro ao gerar PDF:", erro);
    return res.status(500).json({ erro: "Não foi possível gerar o PDF do termo." });
  }
}

export async function gerarDocxSessao(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const { sessao, termo, cejusc } = await montarTermoParaExportacao(id, req.usuario!.id);
    const docxBuffer = await gerarDocxDoTermo(termo, cejusc);

    await prisma.sessao.update({ where: { id }, data: { status: "finalizado" } });

    const nomeArquivo = `${nomeArquivoBase(sessao.processo.numeroCnj, id)}.docx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
    return res.send(docxBuffer);
  } catch (erro) {
    if (erro instanceof ErroExportacao) {
      return res.status(erro.status).json({ erro: erro.message });
    }
    console.error("Erro ao gerar DOCX:", erro);
    return res.status(500).json({ erro: "Não foi possível gerar o documento Word do termo." });
  }
}
