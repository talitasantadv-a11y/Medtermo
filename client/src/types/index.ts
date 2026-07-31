import { Bloco, CampoCustomizadoDef, Modalidade, Polo, ResultadoSessao, StatusSessao, StatusUpload } from "./termo";

export interface Usuario {
  id: number;
  nomeCompleto: string;
  email: string;
  registroProfissional?: string | null;
  telefone?: string | null;
  cargo?: string | null;
}

export interface Modelo {
  id: number;
  usuarioId: number;
  nome: string;
  descricao?: string | null;
  blocos: Bloco[];
  camposCustomizados?: CampoCustomizadoDef[] | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Parte {
  id?: number;
  processoId?: number;
  polo: Polo;
  nomeCompleto: string;
  cpf?: string | null;
  advogadoNome?: string | null;
  advogadoOab?: string | null;
  isPreposto?: boolean;
  createdAt?: string;
}

export interface Processo {
  id: number;
  numeroCnj: string;
  lotacao?: string | null;
  comarca?: string | null;
  classeProcessual?: string | null;
  assunto?: string | null;
  usuarioId: number;
  createdAt: string;
  partes: Parte[];
  sessoes?: Sessao[];
  uploads?: UploadProcesso[];
  statusAtual?: StatusSessao;
  ultimaSessao?: Sessao | null;
}

export interface Sessao {
  id: number;
  processoId: number;
  modeloId: number;
  modelo?: Modelo;
  dataSessao: string;
  horarioInicio: string;
  horarioEncerramento?: string | null;
  local?: string | null;
  modalidade: Modalidade;
  plataformaVirtual?: string | null;
  presencas?: Record<string, boolean> | null;
  resultado?: ResultadoSessao | null;
  termosAcordo?: string | null;
  dadosExtras?: Record<string, string> | null;
  reagendamentoData?: string | null;
  reagendamentoMotivo?: string | null;
  status: StatusSessao;
  createdAt: string;
  processo?: Processo;
}

export interface CampoExtraido {
  valor: string;
  confianca: "alta" | "media" | "baixa";
  valido?: boolean;
}

export interface ParteExtraida {
  polo: Polo;
  nomeCompleto: string;
  cpf?: string;
  cpfValido?: boolean;
  advogadoNome?: string;
  advogadoOab?: string;
  confianca: "alta" | "media" | "baixa";
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

export interface UploadProcesso {
  id: number;
  processoId: number;
  arquivoNome: string;
  arquivoPath: string;
  dadosExtraidos?: DadosExtraidosProcesso | null;
  status: StatusUpload;
  createdAt: string;
}
