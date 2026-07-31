// Tipos que descrevem a estrutura de um "modelo de termo" (template composto por blocos)
// e os valores possíveis dos campos que funcionariam como enum em um banco que suportasse.

export type Polo = "requerente" | "requerido";

export type Modalidade = "presencial" | "virtual";

export type ResultadoSessao =
  | "acordo_total"
  | "acordo_parcial"
  | "sem_acordo"
  | "reagendamento"
  | "ausencia_requerente"
  | "ausencia_requerido";

export type StatusSessao = "pendente" | "em_andamento" | "finalizado";

export type StatusUpload = "processando" | "extraido" | "erro";

export type TipoBloco =
  | "cabecalho"
  | "dados_processo"
  | "presentes"
  | "texto_fixo"
  | "condicional"
  | "campo_livre"
  | "campo_customizado"
  | "assinatura";

export type TipoCampoCustomizado = "texto" | "monetario" | "data";

export interface CampoCustomizadoDef {
  nome: string; // chave usada em dados_extras da sessão
  label: string;
  tipo: TipoCampoCustomizado;
  obrigatorio: boolean;
  placeholder?: string;
}

export interface BlocoCabecalho {
  id: string;
  tipo: "cabecalho";
  titulo: string;
}

export interface BlocoDadosProcesso {
  id: string;
  tipo: "dados_processo";
  mostrarClasseAssunto?: boolean;
}

export interface BlocoPresentes {
  id: string;
  tipo: "presentes";
  itens: string[]; // ex: ["mediador", "requerente", "advogado_requerente", "requerido", "preposto", "advogado_requerido", "procurador"]
}

export interface BlocoTextoFixo {
  id: string;
  tipo: "texto_fixo";
  conteudo: string; // suporta variáveis {var}
}

export interface BlocoCampoLivre {
  id: string;
  tipo: "campo_livre";
  campo: string; // ex: "termos_acordo" | "reagendamento_motivo"
  label: string;
  placeholder?: string;
  obrigatorio?: boolean;
}

export interface BlocoCampoCustomizado {
  id: string;
  tipo: "campo_customizado";
  definicao: CampoCustomizadoDef;
}

export interface BlocoAssinatura {
  id: string;
  tipo: "assinatura";
  textoFechamento?: string;
  mostrarMatricula?: boolean;
}

export type BlocoFilho =
  | BlocoTextoFixo
  | BlocoCampoLivre
  | BlocoCampoCustomizado;

export interface BlocoCondicional {
  id: string;
  tipo: "condicional";
  condicao: {
    campo: "resultado";
    valores: ResultadoSessao[];
  };
  blocos: BlocoFilho[];
}

export type Bloco =
  | BlocoCabecalho
  | BlocoDadosProcesso
  | BlocoPresentes
  | BlocoTextoFixo
  | BlocoCondicional
  | BlocoCampoLivre
  | BlocoCampoCustomizado
  | BlocoAssinatura;

export const VARIAVEIS_DISPONIVEIS = [
  "numero_cnj",
  "lotacao",
  "data_extenso",
  "horario_inicio",
  "horario_encerramento",
  "nome_mediador",
  "cargo_mediador",
  "matricula_mediador",
  "nome_requerente",
  "nome_requerido",
  "adv_requerente",
  "adv_requerido",
  "oab_requerente",
  "oab_requerido",
  "reagendamento_data",
  "reagendamento_motivo",
  "plataforma_virtual",
] as const;

export type VariavelTermo = (typeof VARIAVEIS_DISPONIVEIS)[number];
