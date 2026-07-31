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
  nome: string;
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
  itens: string[];
}
export interface BlocoTextoFixo {
  id: string;
  tipo: "texto_fixo";
  conteudo: string;
}
export interface BlocoCampoLivre {
  id: string;
  tipo: "campo_livre";
  campo: string;
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
export type BlocoFilho = BlocoTextoFixo | BlocoCampoLivre | BlocoCampoCustomizado;
export interface BlocoCondicional {
  id: string;
  tipo: "condicional";
  condicao: { campo: "resultado"; valores: ResultadoSessao[] };
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

export const LABELS_RESULTADO: Record<ResultadoSessao, string> = {
  acordo_total: "Acordo Total",
  acordo_parcial: "Acordo Parcial",
  sem_acordo: "Sem Acordo",
  reagendamento: "Reagendamento",
  ausencia_requerente: "Ausência do Requerente",
  ausencia_requerido: "Ausência do Requerido",
};

export const LABELS_PRESENCA: Record<string, string> = {
  mediador: "Mediador(a)",
  requerente: "Parte Requerente",
  requerido: "Parte Requerida",
  advogado_requerente: "Advogado(a) da Requerente",
  advogado_requerido: "Advogado(a) da Requerida",
  preposto: "Preposto(a)",
  procurador: "Procurador(a) do Estado/Município",
};

export type BlocoRenderizado =
  | { tipo: "cabecalho"; titulo: string }
  | {
      tipo: "dados_processo";
      processo: { numeroCnj: string; lotacao?: string | null; comarca?: string | null; classeProcessual?: string | null; assunto?: string | null };
      sessao: { dataSessao: string; horarioInicio: string; horarioEncerramento?: string | null; local?: string | null; modalidade: string; plataformaVirtual?: string | null };
    }
  | { tipo: "presentes"; itens: { chave: string; label: string; nome: string; presente: boolean }[] }
  | { tipo: "texto"; conteudo: string }
  | { tipo: "campo_livre"; label: string; valor: string }
  | { tipo: "campo_customizado"; label: string; valor: string; tipoDado: string }
  | { tipo: "assinatura"; textoFechamento: string; nome: string; cargo: string; matricula?: string };
