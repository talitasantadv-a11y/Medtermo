import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { Bloco } from "../types/termo";
import { camposObrigatoriosFaltantes, montarTermo } from "../services/termo/builder";
import { renderizarHtmlTermo } from "../services/pdf/template";
import { gerarPdfDeHtml } from "../services/pdf/generator";
import { deJson } from "../utils/json";

export async function gerarPdfSessao(req: Request, res: Response) {
  const id = Number(req.params.id);

  const sessao = await prisma.sessao.findFirst({
    where: { id, processo: { usuarioId: req.usuario!.id } },
    include: { processo: { include: { partes: true } }, modelo: true },
  });
  if (!sessao) return res.status(404).json({ erro: "Sessão não encontrada." });

  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado." });

  const blocos = deJson<Bloco[]>(sessao.modelo.blocos, []);
  const sessaoNormalizada = {
    ...sessao,
    presencas: deJson<Record<string, boolean>>(sessao.presencas, {}),
    dadosExtras: deJson<Record<string, string>>(sessao.dadosExtras, {}),
  };

  const faltantes = camposObrigatoriosFaltantes(blocos, sessaoNormalizada);
  if (!sessao.resultado) {
    return res.status(400).json({ erro: "Selecione o resultado da sessão antes de gerar o termo." });
  }
  if (faltantes.length > 0) {
    return res.status(400).json({
      erro: `Preencha os campos obrigatórios antes de gerar o PDF: ${faltantes.join(", ")}.`,
    });
  }

  const termo = montarTermo(
    blocos,
    sessao.processo,
    sessao.processo.partes,
    sessaoNormalizada,
    usuario
  );

  const html = renderizarHtmlTermo(termo);

  try {
    const pdfBuffer = await gerarPdfDeHtml(html);

    await prisma.sessao.update({ where: { id }, data: { status: "finalizado" } });

    const nomeArquivo = `termo-${sessao.processo.numeroCnj.replace(/[^\d]/g, "")}-${id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
    return res.send(pdfBuffer);
  } catch (erro) {
    console.error("Erro ao gerar PDF:", erro);
    return res.status(500).json({ erro: "Não foi possível gerar o PDF do termo." });
  }
}
