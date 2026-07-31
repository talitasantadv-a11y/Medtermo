import { Bloco, BlocoFilho, BlocoRenderizado, LABELS_PRESENCA, ResultadoSessao } from "../types/termo";
import { formatarDataExtenso } from "./formatacao";

export interface DadosExemplo {
  numeroCnj: string;
  lotacao: string;
  comarca: string;
  classeProcessual: string;
  assunto: string;
  nomeRequerente: string;
  nomeRequerido: string;
  advRequerente: string;
  advRequerido: string;
  oabRequerente: string;
  oabRequerido: string;
  dataSessao: string;
  horarioInicio: string;
  horarioEncerramento: string;
  local: string;
  modalidade: "presencial" | "virtual";
  plataformaVirtual: string;
  nomeMediador: string;
  cargoMediador: string;
  matriculaMediador: string;
  resultado: ResultadoSessao;
  termosAcordo: string;
  reagendamentoData: string;
  reagendamentoMotivo: string;
  dadosExtras: Record<string, string>;
}

export const DADOS_EXEMPLO_PADRAO: DadosExemplo = {
  numeroCnj: "0001234-56.2026.8.26.0100",
  lotacao: "CEJUSC — 1ª Vara Cível",
  comarca: "São Paulo",
  classeProcessual: "Procedimento Comum Cível",
  assunto: "Indenização por Danos Morais",
  nomeRequerente: "Maria da Silva",
  nomeRequerido: "João Pereira",
  advRequerente: "Dr. Carlos Souza",
  advRequerido: "Dra. Ana Lima",
  oabRequerente: "SP 123456",
  oabRequerido: "SP 654321",
  dataSessao: new Date().toISOString().slice(0, 10),
  horarioInicio: "14:00",
  horarioEncerramento: "14:45",
  local: "Sala Virtual 3",
  modalidade: "virtual",
  plataformaVirtual: "Microsoft Teams",
  nomeMediador: "Talita Santos",
  cargoMediador: "Mediadora Judicial",
  matriculaMediador: "CEJUSC-001/2024",
  resultado: "acordo_total",
  termosAcordo: "As partes acordam o pagamento de R$ 5.000,00 em 3 parcelas mensais.",
  reagendamentoData: "",
  reagendamentoMotivo: "",
  dadosExtras: {
    valor_rpv: "R$ 5.000,00",
    prazo_pagamento_dias: "60",
    banco: "Banco do Brasil",
    agencia: "1234-5",
    conta_corrente: "98765-4",
    titular_conta: "Maria da Silva",
    cpf_titular: "123.456.789-00",
  },
};

function variaveis(d: DadosExemplo): Record<string, string> {
  return {
    numero_cnj: d.numeroCnj,
    lotacao: d.lotacao,
    data_extenso: formatarDataExtenso(d.dataSessao),
    horario_inicio: d.horarioInicio,
    horario_encerramento: d.horarioEncerramento,
    nome_mediador: d.nomeMediador,
    cargo_mediador: d.cargoMediador,
    matricula_mediador: d.matriculaMediador,
    nome_requerente: d.nomeRequerente,
    nome_requerido: d.nomeRequerido,
    adv_requerente: d.advRequerente,
    adv_requerido: d.advRequerido,
    oab_requerente: d.oabRequerente,
    oab_requerido: d.oabRequerido,
    reagendamento_data: d.reagendamentoData ? formatarDataExtenso(d.reagendamentoData) : "",
    reagendamento_motivo: d.reagendamentoMotivo,
    plataforma_virtual: d.plataformaVirtual,
  };
}

function resolverTexto(conteudo: string, vars: Record<string, string>): string {
  return conteudo.replace(/\{(\w+)\}/g, (match, chave) => (vars[chave] ? vars[chave] : match));
}

function nomeParaItemPresenca(item: string, d: DadosExemplo): string {
  switch (item) {
    case "mediador":
      return d.nomeMediador;
    case "requerente":
      return d.nomeRequerente;
    case "requerido":
      return d.nomeRequerido;
    case "advogado_requerente":
      return d.advRequerente;
    case "advogado_requerido":
    case "procurador":
      return d.advRequerido;
    default:
      return "";
  }
}

function renderizarFilho(filho: BlocoFilho, vars: Record<string, string>, d: DadosExemplo): BlocoRenderizado {
  if (filho.tipo === "texto_fixo") {
    return { tipo: "texto", conteudo: resolverTexto(filho.conteudo, vars) };
  }
  if (filho.tipo === "campo_livre") {
    const valor =
      filho.campo === "termos_acordo"
        ? d.termosAcordo
        : filho.campo === "reagendamento_motivo"
        ? d.reagendamentoMotivo
        : d.dadosExtras[filho.campo] || "";
    return { tipo: "campo_livre", label: filho.label, valor };
  }
  const valor = d.dadosExtras[filho.definicao.nome] || "";
  return { tipo: "campo_customizado", label: filho.definicao.label, valor, tipoDado: filho.definicao.tipo };
}

export function montarTermoPreview(blocos: Bloco[], d: DadosExemplo): BlocoRenderizado[] {
  const vars = variaveis(d);
  const renderizados: BlocoRenderizado[] = [];

  for (const bloco of blocos) {
    switch (bloco.tipo) {
      case "cabecalho":
        renderizados.push({ tipo: "cabecalho", titulo: bloco.titulo });
        break;
      case "dados_processo":
        renderizados.push({
          tipo: "dados_processo",
          processo: {
            numeroCnj: d.numeroCnj,
            lotacao: d.lotacao,
            comarca: d.comarca,
            classeProcessual: bloco.mostrarClasseAssunto ? d.classeProcessual : undefined,
            assunto: bloco.mostrarClasseAssunto ? d.assunto : undefined,
          },
          sessao: {
            dataSessao: d.dataSessao,
            horarioInicio: d.horarioInicio,
            horarioEncerramento: d.horarioEncerramento,
            local: d.local,
            modalidade: d.modalidade,
            plataformaVirtual: d.plataformaVirtual,
          },
        });
        break;
      case "presentes":
        renderizados.push({
          tipo: "presentes",
          itens: bloco.itens.map((chave) => ({
            chave,
            label: LABELS_PRESENCA[chave] || chave,
            nome: nomeParaItemPresenca(chave, d),
            presente: true,
          })),
        });
        break;
      case "texto_fixo":
        renderizados.push({ tipo: "texto", conteudo: resolverTexto(bloco.conteudo, vars) });
        break;
      case "campo_livre":
      case "campo_customizado":
        renderizados.push(renderizarFilho(bloco, vars, d));
        break;
      case "condicional":
        if (!bloco.condicao.valores.includes(d.resultado)) break;
        for (const filho of bloco.blocos) renderizados.push(renderizarFilho(filho, vars, d));
        break;
      case "assinatura":
        renderizados.push({
          tipo: "assinatura",
          textoFechamento: bloco.textoFechamento ? resolverTexto(bloco.textoFechamento, vars) : "",
          nome: d.nomeMediador,
          cargo: d.cargoMediador,
          matricula: bloco.mostrarMatricula ? d.matriculaMediador : undefined,
        });
        break;
    }
  }

  return renderizados;
}
