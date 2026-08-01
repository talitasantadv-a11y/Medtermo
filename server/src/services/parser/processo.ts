import { extrairCnjDoTexto, formatarCnj, validarCnj } from "./cnj";
import { extrairDocumentosDoTexto, validarCpf } from "./cpf";
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
  /** CPF ou CNPJ (partes podem ser pessoa física ou jurídica, ex: Fazenda Pública). */
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

// "Polo Ativo/Passivo" é o rótulo mais comum na capa do PJe; os demais cobrem
// nomenclaturas de outras classes processuais (execução, mandado de segurança
// etc.) e de sistemas mais antigos.
const ROTULOS_REQUERENTE = [
  "polo ativo",
  "requerente",
  "autor",
  "autora",
  "reclamante",
  "exequente",
  "exeqüente",
  "demandante",
  "impetrante",
  "embargante",
  "credor",
  "credora",
];
const ROTULOS_REQUERIDO = [
  "polo passivo",
  "requerido",
  "requerida",
  "reu",
  "ré",
  "réu",
  "reclamado",
  "reclamada",
  "executado",
  "executada",
  "demandado",
  "impetrado",
  "embargado",
  "devedor",
  "devedora",
];

const ROTULOS_LOTACAO = [
  "orgao julgador",
  "vara",
  "juizo",
  "unidade judiciaria",
  "unidade judiciária",
  "cejusc",
  "central de conciliacao",
  "central de conciliação",
  "nucleo permanente",
  "núcleo permanente",
  "lotacao",
  "lotação",
];

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Constrói um padrão de regex tolerante a acentos a partir de uma palavra sem
 * acento (ex: "orgao julgador" também casa "Órgão Julgador" no texto
 * original) — necessário porque a extração do valor precisa rodar sobre o
 * texto original (preservando acentuação do valor), não sobre a versão
 * normalizada usada só para *localizar* o rótulo.
 */
function paraPadraoTolerante(palavra: string): string {
  const mapaVogais: Record<string, string> = {
    a: "[aàáâã]",
    e: "[eèéê]",
    i: "[iìíî]",
    o: "[oòóôõ]",
    u: "[uùúû]",
    c: "[cç]",
  };
  return palavra
    .split("")
    .map((c) => mapaVogais[c] || c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("");
}

// Usado só para decidir se a linha seguinte a um rótulo é, ela própria, o
// início de OUTRO campo conhecido (e portanto não deve ser lida como valor)
// — não confundir com ROTULOS_REQUERENTE/REQUERIDO, que servem para
// identificar o polo da parte.
const ROTULOS_CONHECIDOS = [
  ...ROTULOS_REQUERENTE,
  ...ROTULOS_REQUERIDO,
  ...ROTULOS_LOTACAO,
  "cpf",
  "cnpj",
  "documento",
  "tipo",
  "advogado",
  "advogada",
  "oab",
  "classe",
  "assunto",
  "comarca",
  "foro",
  "email",
  "e-mail",
  "telefone",
  "numero do processo",
  "número do processo",
];

function capturarValorAposRotulo(
  linhas: string[],
  indice: number,
  rotulo: string
): string | null {
  const linha = linhas[indice];
  const padrao = paraPadraoTolerante(rotulo);
  // Permite texto extra entre o rótulo e o separador (ex: "Assunto Principal:").
  const match = linha.match(new RegExp(`${padrao}[^:\\-\\n]{0,30}[:\\-]\\s*(.+)$`, "i"));
  if (match && match[1].trim()) return match[1].trim();

  // Valor pode estar isolado na linha seguinte (comum no padrão "Polo Ativo\nNOME").
  // Só rejeitamos essa linha se ela mesma parecer o início de OUTRO campo
  // conhecido — a simples presença de ":" não basta, pois o valor real pode
  // trazer metadado entre parênteses (ex: "NOME (CPF: 111.222.333-44)").
  const proxima = linhas[indice + 1];
  if (proxima && proxima.trim()) {
    const proximaNorm = normalizar(proxima);
    const pareceOutroRotulo = ROTULOS_CONHECIDOS.some((r) => proximaNorm.startsWith(r));
    if (!pareceOutroRotulo) return proxima.trim();
  }
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

    // remove eventual CPF/CNPJ/rótulo de tipo embutido no fim do nome
    const nomeLimpo = nome
      .replace(/\(\s*(cpf|cnpj)[^)]*\)/gi, "") // ex: "NOME (CPF: 111.222.333-44)"
      .replace(/CPF[:\s]*[\d.\-]+/i, "")
      .replace(/CNPJ[:\s]*[\d.\/\-]+/i, "")
      .replace(/\(?(pessoa f[íi]sica|pessoa jur[íi]dica)\)?/i, "")
      .replace(/\(\s*\)/g, "") // parênteses vazios remanescentes
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!nomeLimpo) continue;

    // procura CPF/CNPJ na própria linha e nas 3 seguintes
    const janela = [linha, linhas[i + 1] || "", linhas[i + 2] || "", linhas[i + 3] || ""].join(
      " "
    );
    const documentos = extrairDocumentosDoTexto(janela);
    const documento = documentos[0];

    // procura advogado/OAB nas próximas linhas (pode haver mais de um advogado)
    const janelaAdv = [
      linhas[i + 1] || "",
      linhas[i + 2] || "",
      linhas[i + 3] || "",
      linhas[i + 4] || "",
    ].join("\n");
    const oabs = extrairOabsDoTexto(janelaAdv);
    let advogadoNome: string | undefined;
    let advogadoOab: string | undefined;
    const linhaAdvMatch = janelaAdv.match(/advogad[oa]s?\s*\(?[oa]?\)?[:\s]*([^\n(]+)/i);
    if (linhaAdvMatch) advogadoNome = linhaAdvMatch[1].trim().replace(/\s{2,}/g, " ");
    if (oabs[0]) advogadoOab = oabs[0].valor;

    partes.push({
      polo,
      nomeCompleto: nomeLimpo,
      cpf: documento?.valor,
      cpfValido: documento ? documento.valido : undefined,
      advogadoNome,
      advogadoOab,
      confianca: documento || advogadoOab ? "alta" : "media",
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
  const assunto = buscarCampoSimples(linhas, ["assunto principal", "assuntos", "assunto"]);
  const lotacao = buscarCampoSimples(linhas, ROTULOS_LOTACAO);
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
