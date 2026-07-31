import { Bloco, BlocoFilho, ResultadoSessao } from "../../types/termo";

export interface UsuarioParaTermo {
  nomeCompleto: string;
  cargo?: string | null;
  registroProfissional?: string | null;
}

export interface ParteParaTermo {
  polo: string;
  nomeCompleto: string;
  advogadoNome?: string | null;
  advogadoOab?: string | null;
  isPreposto?: boolean;
}

export interface ProcessoParaTermo {
  numeroCnj: string;
  lotacao?: string | null;
  comarca?: string | null;
  classeProcessual?: string | null;
  assunto?: string | null;
}

export interface SessaoParaTermo {
  dataSessao: Date | string;
  horarioInicio: string;
  horarioEncerramento?: string | null;
  local?: string | null;
  modalidade: string;
  plataformaVirtual?: string | null;
  presencas?: Record<string, boolean> | null;
  resultado?: string | null;
  termosAcordo?: string | null;
  dadosExtras?: Record<string, string> | null;
  reagendamentoData?: Date | string | null;
  reagendamentoMotivo?: string | null;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function formatarDataExtenso(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getUTCDate()).padStart(2, "0")} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

function nomesDoPolo(partes: ParteParaTermo[], polo: "requerente" | "requerido"): string {
  return partes
    .filter((p) => p.polo === polo)
    .map((p) => p.nomeCompleto)
    .join(" e ");
}

function advogadoDoPolo(partes: ParteParaTermo[], polo: "requerente" | "requerido") {
  const parte = partes.find((p) => p.polo === polo && p.advogadoNome);
  return { nome: parte?.advogadoNome || "", oab: parte?.advogadoOab || "" };
}

export function montarVariaveis(
  processo: ProcessoParaTermo,
  partes: ParteParaTermo[],
  sessao: SessaoParaTermo,
  usuario: UsuarioParaTermo
): Record<string, string> {
  const advReq = advogadoDoPolo(partes, "requerente");
  const advReqdo = advogadoDoPolo(partes, "requerido");

  return {
    numero_cnj: processo.numeroCnj || "",
    lotacao: processo.lotacao || "",
    data_extenso: formatarDataExtenso(sessao.dataSessao),
    horario_inicio: sessao.horarioInicio || "",
    horario_encerramento: sessao.horarioEncerramento || "",
    nome_mediador: usuario.nomeCompleto || "",
    cargo_mediador: usuario.cargo || "Mediador(a) Judicial",
    matricula_mediador: usuario.registroProfissional || "",
    nome_requerente: nomesDoPolo(partes, "requerente"),
    nome_requerido: nomesDoPolo(partes, "requerido"),
    adv_requerente: advReq.nome,
    adv_requerido: advReqdo.nome,
    oab_requerente: advReq.oab,
    oab_requerido: advReqdo.oab,
    reagendamento_data: sessao.reagendamentoData
      ? formatarDataExtenso(sessao.reagendamentoData)
      : "",
    reagendamento_motivo: sessao.reagendamentoMotivo || "",
    plataforma_virtual: sessao.plataformaVirtual || "",
  };
}

export function resolverTexto(conteudo: string, variaveis: Record<string, string>): string {
  return conteudo.replace(/\{(\w+)\}/g, (match, chave) =>
    variaveis[chave] !== undefined && variaveis[chave] !== ""
      ? variaveis[chave]
      : match
  );
}

const LABELS_PRESENCA: Record<string, string> = {
  mediador: "Mediador(a)",
  requerente: "Parte Requerente",
  requerido: "Parte Requerida",
  advogado_requerente: "Advogado(a) da Requerente",
  advogado_requerido: "Advogado(a) da Requerida",
  preposto: "Preposto(a)",
  procurador: "Procurador(a) do Estado/Município",
};

function nomeParaItemPresenca(
  item: string,
  partes: ParteParaTermo[],
  usuario: UsuarioParaTermo
): string {
  switch (item) {
    case "mediador":
      return usuario.nomeCompleto;
    case "requerente":
      return nomesDoPolo(partes, "requerente");
    case "requerido":
      return nomesDoPolo(partes, "requerido");
    case "advogado_requerente":
      return advogadoDoPolo(partes, "requerente").nome;
    case "advogado_requerido":
    case "procurador":
      return advogadoDoPolo(partes, "requerido").nome;
    case "preposto":
      return partes.find((p) => p.polo === "requerido" && p.isPreposto)?.nomeCompleto || "";
    default:
      return "";
  }
}

export interface ItemPresencaRenderizado {
  chave: string;
  label: string;
  nome: string;
  presente: boolean;
}

export type BlocoRenderizado =
  | { tipo: "cabecalho"; titulo: string }
  | { tipo: "dados_processo"; processo: ProcessoParaTermo; sessao: SessaoParaTermo; partes: ParteParaTermo[] }
  | { tipo: "presentes"; itens: ItemPresencaRenderizado[] }
  | { tipo: "texto"; conteudo: string }
  | { tipo: "campo_livre"; label: string; valor: string }
  | { tipo: "campo_customizado"; label: string; valor: string; tipoDado: string }
  | { tipo: "assinatura"; textoFechamento: string; nome: string; cargo: string; matricula?: string };

function renderizarBlocoFilho(
  filho: BlocoFilho,
  variaveis: Record<string, string>,
  sessao: SessaoParaTermo
): BlocoRenderizado {
  if (filho.tipo === "texto_fixo") {
    return { tipo: "texto", conteudo: resolverTexto(filho.conteudo, variaveis) };
  }
  if (filho.tipo === "campo_livre") {
    const valor =
      filho.campo === "termos_acordo"
        ? sessao.termosAcordo || ""
        : filho.campo === "reagendamento_motivo"
        ? sessao.reagendamentoMotivo || ""
        : sessao.dadosExtras?.[filho.campo] || "";
    return { tipo: "campo_livre", label: filho.label, valor };
  }
  // campo_customizado
  const valor = sessao.dadosExtras?.[filho.definicao.nome] || "";
  return {
    tipo: "campo_customizado",
    label: filho.definicao.label,
    valor,
    tipoDado: filho.definicao.tipo,
  };
}

export function montarTermo(
  blocos: Bloco[],
  processo: ProcessoParaTermo,
  partes: ParteParaTermo[],
  sessao: SessaoParaTermo,
  usuario: UsuarioParaTermo
): BlocoRenderizado[] {
  const variaveis = montarVariaveis(processo, partes, sessao, usuario);
  const resultado = sessao.resultado as ResultadoSessao | null | undefined;
  const renderizados: BlocoRenderizado[] = [];

  for (const bloco of blocos) {
    switch (bloco.tipo) {
      case "cabecalho":
        renderizados.push({ tipo: "cabecalho", titulo: bloco.titulo });
        break;
      case "dados_processo":
        renderizados.push({ tipo: "dados_processo", processo, sessao, partes });
        break;
      case "presentes": {
        const itens: ItemPresencaRenderizado[] = bloco.itens.map((chave) => ({
          chave,
          label: LABELS_PRESENCA[chave] || chave,
          nome: nomeParaItemPresenca(chave, partes, usuario),
          presente: sessao.presencas?.[chave] ?? false,
        }));
        renderizados.push({ tipo: "presentes", itens });
        break;
      }
      case "texto_fixo":
        renderizados.push({ tipo: "texto", conteudo: resolverTexto(bloco.conteudo, variaveis) });
        break;
      case "campo_livre":
        renderizados.push(renderizarBlocoFilho(bloco, variaveis, sessao));
        break;
      case "campo_customizado":
        renderizados.push(renderizarBlocoFilho(bloco, variaveis, sessao));
        break;
      case "condicional": {
        if (!resultado || !bloco.condicao.valores.includes(resultado)) break;
        for (const filho of bloco.blocos) {
          renderizados.push(renderizarBlocoFilho(filho, variaveis, sessao));
        }
        break;
      }
      case "assinatura":
        renderizados.push({
          tipo: "assinatura",
          textoFechamento: bloco.textoFechamento
            ? resolverTexto(bloco.textoFechamento, variaveis)
            : "",
          nome: usuario.nomeCompleto,
          cargo: usuario.cargo || "Mediador(a) Judicial",
          matricula: bloco.mostrarMatricula ? usuario.registroProfissional || "" : undefined,
        });
        break;
    }
  }

  return renderizados;
}

export function camposObrigatoriosFaltantes(
  blocos: Bloco[],
  sessao: SessaoParaTermo
): string[] {
  const faltantes: string[] = [];
  const resultado = sessao.resultado as ResultadoSessao | null | undefined;

  for (const bloco of blocos) {
    if (bloco.tipo === "condicional") {
      if (!resultado || !bloco.condicao.valores.includes(resultado)) continue;
      for (const filho of bloco.blocos) {
        if (filho.tipo === "campo_livre" && filho.obrigatorio) {
          const valor =
            filho.campo === "termos_acordo"
              ? sessao.termosAcordo
              : filho.campo === "reagendamento_motivo"
              ? sessao.reagendamentoMotivo
              : sessao.dadosExtras?.[filho.campo];
          if (!valor) faltantes.push(filho.label);
        }
        if (filho.tipo === "campo_customizado" && filho.definicao.obrigatorio) {
          const valor = sessao.dadosExtras?.[filho.definicao.nome];
          if (!valor) faltantes.push(filho.definicao.label);
        }
      }
    }
  }

  if ((resultado === "acordo_total" || resultado === "acordo_parcial") && !sessao.termosAcordo) {
    if (!faltantes.includes("Termos do Acordo")) faltantes.push("Termos do Acordo");
  }

  return faltantes;
}
