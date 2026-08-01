import fs from "fs";
import sizeOf from "image-size";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { BlocoRenderizado } from "../termo/builder";

export interface InfoCejuscParaDocx {
  nome?: string | null;
  logoAbsolutePath?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  email?: string | null;
}

const SEM_BORDA = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const SEM_BORDAS_TABELA = {
  top: SEM_BORDA,
  bottom: SEM_BORDA,
  left: SEM_BORDA,
  right: SEM_BORDA,
  insideHorizontal: SEM_BORDA,
  insideVertical: SEM_BORDA,
};

function paragrafosDeTexto(texto: string, justificado = true): Paragraph[] {
  const partes = texto.split(/\n+/).filter((p) => p.trim());
  if (partes.length === 0) return [new Paragraph({ text: texto })];
  return partes.map(
    (p) =>
      new Paragraph({
        alignment: justificado ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
        spacing: { after: 160 },
        children: [new TextRun(p)],
      })
  );
}

function linhaTabela(label: string, valor: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        borders: SEM_BORDAS_TABELA,
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        width: { size: 75, type: WidthType.PERCENTAGE },
        borders: SEM_BORDAS_TABELA,
        children: [new Paragraph({ text: valor })],
      }),
    ],
  });
}

function renderizarBloco(bloco: BlocoRenderizado): (Paragraph | Table)[] {
  switch (bloco.tipo) {
    case "cabecalho":
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          children: [new TextRun({ text: bloco.titulo, bold: true, size: 28 })],
        }),
      ];

    case "dados_processo": {
      const { processo, sessao } = bloco;
      const dataFormatada = sessao.dataSessao
        ? new Date(sessao.dataSessao).toLocaleDateString("pt-BR", { timeZone: "UTC" })
        : "";
      const linhas = [
        linhaTabela("Processo nº", processo.numeroCnj || ""),
        linhaTabela("Lotação", processo.lotacao || ""),
        linhaTabela("Comarca", processo.comarca || ""),
      ];
      if (processo.classeProcessual || processo.assunto) {
        linhas.push(
          linhaTabela(
            "Classe / Assunto",
            `${processo.classeProcessual || ""}${processo.assunto ? " — " + processo.assunto : ""}`
          )
        );
      }
      linhas.push(
        linhaTabela(
          "Data / Horário",
          `${dataFormatada} — ${sessao.horarioInicio || ""}${
            sessao.horarioEncerramento ? " às " + sessao.horarioEncerramento : ""
          }`
        ),
        linhaTabela(
          "Local / Modalidade",
          `${sessao.local || ""} (${sessao.modalidade === "virtual" ? "Virtual" : "Presencial"}${
            sessao.plataformaVirtual ? " — " + sessao.plataformaVirtual : ""
          })`
        )
      );
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: SEM_BORDAS_TABELA,
          rows: linhas,
        }),
        new Paragraph({ text: "", spacing: { after: 160 } }),
      ];
    }

    case "presentes":
      return [
        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: "PRESENTES", bold: true })],
        }),
        ...bloco.itens.map(
          (item) =>
            new Paragraph({
              children: [
                new TextRun(`${item.presente ? "☑" : "☐"} `),
                new TextRun({ text: item.label, bold: true }),
                new TextRun(item.nome ? `: ${item.nome}` : ""),
              ],
            })
        ),
        new Paragraph({ text: "", spacing: { after: 120 } }),
      ];

    case "texto":
      return paragrafosDeTexto(bloco.conteudo);

    case "campo_livre":
      return [
        new Paragraph({
          spacing: { before: 120 },
          children: [new TextRun({ text: bloco.label, bold: true })],
        }),
        ...paragrafosDeTexto(bloco.valor || "—"),
      ];

    case "campo_customizado":
      return [
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `${bloco.label}: `, bold: true }),
            new TextRun(bloco.valor || "—"),
          ],
        }),
      ];

    case "assinatura": {
      const paragrafos: (Paragraph | Table)[] = [];
      if (bloco.textoFechamento) {
        paragrafos.push(...paragrafosDeTexto(bloco.textoFechamento));
      }
      paragrafos.push(
        new Paragraph({ text: "", spacing: { before: 480 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun("_________________________________________")],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: bloco.nome, bold: true })],
        }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(bloco.cargo)] })
      );
      if (bloco.matricula) {
        paragrafos.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun(`Matrícula: ${bloco.matricula}`)],
          })
        );
      }
      return paragrafos;
    }

    default:
      return [];
  }
}

function montarCabecalho(cejusc?: InfoCejuscParaDocx | null): Header | undefined {
  if (!cejusc?.logoAbsolutePath || !fs.existsSync(cejusc.logoAbsolutePath)) return undefined;

  try {
    const buffer = fs.readFileSync(cejusc.logoAbsolutePath);
    const dimensoes = sizeOf(buffer);
    const larguraMaxima = 140; // pontos
    const largura = Math.min(larguraMaxima, dimensoes.width || larguraMaxima);
    const altura = dimensoes.width
      ? largura * ((dimensoes.height || dimensoes.width) / dimensoes.width)
      : largura;

    return new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: (dimensoes.type === "png" ? "png" : "jpg") as "png" | "jpg",
              data: buffer,
              transformation: { width: largura, height: altura },
            }),
          ],
        }),
      ],
    });
  } catch {
    return undefined;
  }
}

function montarRodape(cejusc?: InfoCejuscParaDocx | null): Footer | undefined {
  const linhas = [cejusc?.nome, cejusc?.endereco, [cejusc?.telefone, cejusc?.email].filter(Boolean).join(" — ")]
    .filter((linha): linha is string => !!linha && linha.trim().length > 0);

  if (linhas.length === 0) return undefined;

  return new Footer({
    children: linhas.map(
      (linha) =>
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: linha, size: 16, color: "666666" })],
        })
    ),
  });
}

export async function gerarDocxDoTermo(
  blocos: BlocoRenderizado[],
  cejusc?: InfoCejuscParaDocx | null
): Promise<Buffer> {
  const children = blocos.flatMap(renderizarBloco);

  const documento = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: 24 },
        },
      },
    },
    sections: [
      {
        headers: { default: montarCabecalho(cejusc) ?? new Header({ children: [] }) },
        footers: { default: montarRodape(cejusc) ?? new Footer({ children: [] }) },
        properties: {
          page: {
            margin: { top: 1400, bottom: 1400, left: 1200, right: 1200 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(documento);
}
