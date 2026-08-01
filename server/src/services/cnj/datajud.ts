// Integração com a API Pública do DataJud (CNJ) — https://datajud-wiki.cnj.jus.br/
//
// A API é organizada por "alias" de tribunal (ex: api_publica_tjsp) e exige uma
// chave (Authorization: APIKey <chave>) obtida gratuitamente pelo próprio usuário
// em https://datajud-wiki.cnj.jus.br/api-publica/acesso. Não distribuímos uma
// chave própria: cada mediador cadastra a sua em Perfil.
//
// Importante (LGPD): a resposta pública do DataJud traz dados processuais
// (classe, assuntos, órgão julgador, movimentações) mas, na prática, NÃO inclui
// nome/CPF das partes — esses continuam vindo do PDF do processo.

const BASE_URL = "https://api-publica.datajud.cnj.jus.br";

// Código do tribunal (posições 15-16 do número CNJ) para a Justiça Estadual
// (segmento "8"), conforme Resolução CNJ nº 65/2008. É o segmento que cobre a
// grande maioria dos casos de CEJUSC/mediação.
const TRIBUNAIS_JUSTICA_ESTADUAL: Record<string, string> = {
  "01": "tjac",
  "02": "tjal",
  "03": "tjap",
  "04": "tjam",
  "05": "tjba",
  "06": "tjce",
  "07": "tjdft",
  "08": "tjes",
  "09": "tjgo",
  "10": "tjma",
  "11": "tjmt",
  "12": "tjms",
  "13": "tjmg",
  "14": "tjpa",
  "15": "tjpb",
  "16": "tjpr",
  "17": "tjpe",
  "18": "tjpi",
  "19": "tjrj",
  "20": "tjrn",
  "21": "tjrs",
  "22": "tjro",
  "23": "tjrr",
  "24": "tjsc",
  "25": "tjse",
  "26": "tjsp",
  "27": "tjto",
};

const SEGMENTO_JUSTICA_ESTADUAL = "8";

export function resolverAliasDatajud(numeroCnj: string): string | null {
  const digitos = numeroCnj.replace(/\D/g, "");
  if (digitos.length !== 20) return null;

  const segmento = digitos.slice(13, 14);
  const tribunal = digitos.slice(14, 16);

  if (segmento === SEGMENTO_JUSTICA_ESTADUAL) {
    const sigla = TRIBUNAIS_JUSTICA_ESTADUAL[tribunal];
    return sigla ? `api_publica_${sigla}` : null;
  }

  // Outros segmentos (Justiça Federal, do Trabalho, Eleitoral, Militar) podem
  // ser adicionados aqui conforme a necessidade — por ora, cobrimos o
  // segmento mais comum para mediação/conciliação em CEJUSC.
  return null;
}

export interface DadosDatajud {
  classe?: string;
  assuntos: string[];
  orgaoJulgador?: string;
  tribunal?: string;
  grau?: string;
  dataAjuizamento?: string;
}

export class DatajudError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function consultarProcessoDatajud(
  numeroCnj: string,
  apiKey: string
): Promise<DadosDatajud | null> {
  const alias = resolverAliasDatajud(numeroCnj);
  if (!alias) {
    throw new DatajudError(
      "Este tribunal ainda não é suportado pela busca automática no CNJ (por enquanto cobrimos a Justiça Estadual)."
    );
  }

  const numeroLimpo = numeroCnj.replace(/\D/g, "");

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE_URL}/${alias}/_search`, {
      method: "POST",
      headers: {
        Authorization: `APIKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { match: { numeroProcesso: numeroLimpo } } }),
    });
  } catch {
    throw new DatajudError("Não foi possível conectar à API do DataJud (CNJ). Tente novamente.");
  }

  if (resposta.status === 401 || resposta.status === 403) {
    throw new DatajudError(
      "Chave da API DataJud inválida ou não autorizada. Confira a chave cadastrada em Perfil.",
      resposta.status
    );
  }
  if (!resposta.ok) {
    throw new DatajudError(`A API do DataJud retornou um erro (HTTP ${resposta.status}).`, resposta.status);
  }

  const corpo = (await resposta.json()) as {
    hits?: { hits?: { _source?: Record<string, unknown> }[] };
  };
  const fonte = corpo.hits?.hits?.[0]?._source;
  if (!fonte) return null;

  const classe = fonte.classe as { nome?: string } | undefined;
  const assuntosBrutos = (fonte.assuntos as unknown[] | undefined) ?? [];
  const orgaoJulgador = fonte.orgaoJulgador as { nome?: string } | undefined;

  // Defensivo: a maioria dos tribunais retorna assuntos como objetos
  // ({codigo, nome}), mas alguns respondem com o nome direto como string.
  const assuntos = assuntosBrutos
    .map((a) => (typeof a === "string" ? a : (a as { nome?: string } | null)?.nome))
    .filter((n): n is string => !!n);

  return {
    classe: classe?.nome,
    assuntos,
    orgaoJulgador: orgaoJulgador?.nome,
    tribunal: fonte.tribunal as string | undefined,
    grau: fonte.grau as string | undefined,
    dataAjuizamento: fonte.dataAjuizamento as string | undefined,
  };
}
