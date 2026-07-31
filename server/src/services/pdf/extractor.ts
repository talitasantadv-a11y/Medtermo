import fs from "fs";
// pdf-parse's default export triggers a debug code path when required directly
// in some bundling setups; requiring the lib entry point avoids that.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

const TEXTO_MINIMO_PARA_CONSIDERAR_DIGITAL = 40;

export interface ResultadoExtracaoTexto {
  texto: string;
  origem: "texto" | "ocr";
  paginas: number;
}

async function extrairViaOcr(caminhoArquivo: string): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por");
  try {
    const buffer = fs.readFileSync(caminhoArquivo);
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Extrai o texto de um PDF. Tenta primeiro extração direta de texto (pdf-parse);
 * se o resultado vier vazio ou muito curto (indicando PDF escaneado/imagem),
 * cai para OCR via tesseract.js.
 */
export async function extrairTextoPdf(
  caminhoArquivo: string
): Promise<ResultadoExtracaoTexto> {
  const buffer = fs.readFileSync(caminhoArquivo);
  const dados = await pdfParse(buffer);
  const textoDireto = (dados.text || "").trim();

  if (textoDireto.length >= TEXTO_MINIMO_PARA_CONSIDERAR_DIGITAL) {
    return { texto: textoDireto, origem: "texto", paginas: dados.numpages || 1 };
  }

  const textoOcr = await extrairViaOcr(caminhoArquivo);
  return { texto: textoOcr, origem: "ocr", paginas: dados.numpages || 1 };
}
