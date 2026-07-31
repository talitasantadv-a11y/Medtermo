import { extrairCnjDoTexto, formatarCnj, validarCnj } from "./cnj";
import { extrairCpfsDoTexto, validarCpf } from "./cpf";
import { extrairOabsDoTexto } from "./oab";

export type Confianca = "alta" | "media" | "baixa";

export interface CampoExtraido {
  valor: string;
  confianca: Confianca;
  valido?: boolean;
}

export interface ParteExtraida {
  polo: "requerente" | "requerido";
  nomeCompleto: string;
  cpf?: string;
  cpfValido?: boolean;
  advogadoNome?: string;
  advogadoOab?: string;
  confianca: Confianca;
}

export interface DadosExtraidosProcesso {
  numeroCnj?: CampoExtraido;
  classeProcessual?: CampoExtraido;
  assunto?: CampoExtraido;
  lotacao?: CampoExtraido;
  comarca?: CampoExtraido;
  dataAudiencia?: CampoExtraido;
  partes: ParteExtraida[];
}

const ROTULOS_REQUERENTE = [
  "requerente",
  "autor",
  "autora",
  "reclamante",
  "exequente",
  "demandante",
];
const ROTULOS_REQUERIDO = [
  "requerido",
  "requerida",
  "reu",
  "ré",
  "réu",
  "reclamado",
  "reclamada",
  "executado",
  "demandado",
];

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function capturarValorAposRotulo(
  linhas: string[],
  indice: number,
  rotuloRegexResto: string
): string | null {
  const linha = linhas[indice];
  const match = linha.match(new RegExp(`${rotuloRegexResto}\\s*[:\\-]\\s*(.+)$`, "i"));
  if (match && match[1].trim()) return match[1].trim();
  // valor pode estar na linha seguinte
  const proxima = linhas[indice + 1];
  if (proxima && proxima.trim() && !proxima.includes(":")) return proxima.trim();
  return null;
}

function buscarCampoSimples(
  linhas: string[],
  rotulos: string[]
): CampoExtraido | undefined {
  for (let i = 0; i < linhas.length; i++) {
    const norm = normalizar(linhas[i]);
    for (const rotulo of rotulos) {
      if (norm.startsWith(rotulo)) {
        const valor = capturarValorAposRotulo(linhas, i, rotulo);
        if (valor) {
          return { valor, confianca: "alta" };
        }
      }
    }
  }
  return undefined;
}

function buscarDataAudiencia(texto: string): CampoExtraido | undefined {
  const regexes = [
    /audi[eê]ncia[^0-9]{0,40}(\d{2}\/\d{2}\/\d{4})(?:[^0-9]{0,15}(\d{2}:\d{2}))?/i,
    /data\s*(?:da)?\s*sess[aã]o[^0-9]{0,20}(\d{2}\/\d{2}\/\d{4})(?:[^0-9]{0,15}(\d{2}:\d{2}))?/i,
  ];
  for (const regex of regexes) {
    const match = texto.match(regex);
    if (match) {
      const data = match[1];
      const hora = match[2] ? ` ${match[2]}` : "";
      return { valor: `${data}${hora}`, confianca: "media" };
    }
  }
  return undefined;
}

function extrairPartes(linhas: string[]): ParteExtraida[] {
  const partes: ParteExtraida[] = [];

  const encontrarPolo = (linhaNorm: string): "requerente" | "requerido" | null => {
    for (const r of ROTULOS_REQUERENTE) {
      if (linhaNorm.startsWith(r)) return "requerente";
    }
    for (const r of ROTULOS_REQUERIDO) {
      if (linhaNorm.startsWith(r)) return "requerido";
    }
    return null;
  };

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const norm = normalizar(linha);
    const polo = encontrarPolo(norm);
    if (!polo) continue;

    const rotuloUsado = [...ROTULOS_REQUERENTE, ...ROTULOS_REQUERIDO].find((r) =>
      norm.startsWith(r)
    )!;
    const nome = capturarValorAposRotulo(linhas, i, rotuloUsado);
    if (!nome) continue;

    // remove eventual CPF/OAB embutido no fim do nome
    const nomeLimpo = nome
      .replace(/CPF[:\s]*[\d.\-]+/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    // procura CPF nas próximas 2 linhas (inclusive a mesma)
    const janela = [linha, linhas[i + 1] || "", linhas[i + 2] || ""].join(" ");
    const cpfs = extrairCpfsDoTexto(janela);
    const cpf = cpfs[0];

    // procura advogado/OAB nas próximas 3 linhas
    const janelaAdv = [linhas[i + 1] || "", linhas[i + 2] || "", linhas[i + 3] || ""].join(
      "\n"
    );
    const oabs = extrairOabsDoTexto(janelaAdv);
    let advogadoNome: string | undefined;
    let advogadoOab: string | undefined;
    const linhaAdvMatch = janelaAdv.match(/advogad[oa][:\s]*([^\n(]+)/i);
    if (linhaAdvMatch) advogadoNome = linhaAdvMatch[1].trim();
    if (oabs[0]) advogadoOab = oabs[0].valor;

    partes.push({
      polo,
      nomeCompleto: nomeLimpo,
      cpf: cpf?.valor,
      cpfValido: cpf ? cpf.valido : undefined,
      advogadoNome,
      advogadoOab,
      confianca: cpf || advogadoOab ? "alta" : "media",
    });
  }

  return partes;
}

export function extrairDadosDoTexto(textoBruto: string): DadosExtraidosProcesso {
  const texto = textoBruto.replace(/\r/g, "");
  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const cnj = extrairCnjDoTexto(texto);
  const numeroCnj: CampoExtraido | undefined = cnj
    ? { valor: cnj.valor, confianca: "alta", valido: cnj.valido }
    : undefined;

  const classeProcessual = buscarCampoSimples(linhas, [
    "classe judicial",
    "classe processual",
    "classe",
  ]);
  const assunto = buscarCampoSimples(linhas, ["assunto"]);
  const lotacao = buscarCampoSimples(linhas, [
    "orgao julgador",
    "órgão julgador",
    "vara",
    "cejusc",
    "lotacao",
    "lotação",
  ]);
  const comarca = buscarCampoSimples(linhas, ["comarca", "foro"]);
  const dataAudiencia = buscarDataAudiencia(texto);
  const partes = extrairPartes(linhas);

  return {
    numeroCnj,
    classeProcessual,
    assunto,
    lotacao,
    comarca,
    dataAudiencia,
    partes,
  };
}

export { validarCnj, formatarCnj, validarCpf };
