import { randomUUID } from "crypto";
import type {
  Bloco,
  BlocoCondicional,
  BlocoFilho,
  CampoCustomizadoDef,
} from "../../types/termo";

function id() {
  return randomUUID();
}

const TEXTO_TOLERANCIA_AUSENCIA = `Aberta a sessão no horário designado, foi observada a tolerância regimental de 10 (dez) minutos para o comparecimento das partes. Decorrido o prazo sem o comparecimento da parte devidamente intimada, e diante da ausência não justificada, a sessão foi encerrada, registrando-se que a ausência da parte devidamente intimada à sessão de conciliação/mediação é considerada ato atentatório à dignidade da justiça, nos termos do artigo 334, § 8º, do Código de Processo Civil, sujeitando o faltoso à multa de até dois por cento da vantagem econômica pretendida ou do valor da causa.`;

const TEXTO_REAGENDAMENTO = `Diante do exposto, e considerando o motivo acima registrado, a sessão foi redesignada para nova data, ficando as partes desde já cientes e intimadas de que deverão comparecer à nova sessão de conciliação/mediação a ser realizada em {reagendamento_data}, sob as penas da lei.`;

const TEXTO_GRAVACAO_VIDEOCONFERENCIA = `Nos termos do artigo 25 do Provimento nº 15/2020 da Corregedoria-Geral de Justiça, a presente sessão realizada por videoconferência foi gravada em áudio e vídeo, ficando o arquivo correspondente arquivado junto aos autos do processo para fins de registro e eventual consulta.`;

const TEXTO_DISPENSA_ASSINATURA = `Em razão da realização da sessão por videoconferência, fica dispensada a assinatura das partes e advogados no presente termo, nos termos do artigo 26 do Provimento nº 15/2020 da Corregedoria-Geral de Justiça, sendo a gravação e o registro em ata considerados suficientes para fins de documentação do ato.`;

// ---------------------------------------------------------------------------
// Modelo 1 — Modelo Geral 334 (audiência do art. 334 do CPC)
// ---------------------------------------------------------------------------
export function blocosModeloGeral334(): Bloco[] {
  const condicionalAcordo: BlocoCondicional = {
    id: id(),
    tipo: "condicional",
    condicao: { campo: "resultado", valores: ["acordo_total", "acordo_parcial"] },
    blocos: [
      {
        id: id(),
        tipo: "campo_livre",
        campo: "termos_acordo",
        label: "Termos do Acordo",
        placeholder: "Descreva os termos do acordo firmado entre as partes...",
        obrigatorio: true,
      },
      {
        id: id(),
        tipo: "texto_fixo",
        conteudo:
          "As partes dão-se mútua e recíproca quitação quanto ao objeto da presente demanda, nada mais tendo a reclamar uma da outra, seja a que título for, em relação aos fatos discutidos nestes autos.",
      },
      {
        id: id(),
        tipo: "texto_fixo",
        conteudo: "Por fim, as partes requerem a homologação do acordo.",
      },
    ],
  };

  const condicionalSemAcordo: BlocoCondicional = {
    id: id(),
    tipo: "condicional",
    condicao: { campo: "resultado", valores: ["sem_acordo"] },
    blocos: [
      {
        id: id(),
        tipo: "texto_fixo",
        conteudo:
          "Realizada a declaração de abertura e o procedimento de conciliação/mediação, com aplicação das técnicas apropriadas, as partes NÃO fizeram acordo nesta oportunidade.",
      },
      {
        id: id(),
        tipo: "texto_fixo",
        conteudo:
          "Fica a parte requerida advertida de que, nos termos do artigo 335, inciso I, do Código de Processo Civil, o prazo para contestação passará a fluir a partir da presente data, observadas as demais disposições legais aplicáveis.",
      },
    ],
  };

  const condicionalAusencia: BlocoCondicional = {
    id: id(),
    tipo: "condicional",
    condicao: {
      campo: "resultado",
      valores: ["ausencia_requerente", "ausencia_requerido"],
    },
    blocos: [{ id: id(), tipo: "texto_fixo", conteudo: TEXTO_TOLERANCIA_AUSENCIA }],
  };

  const condicionalReagendamento: BlocoCondicional = {
    id: id(),
    tipo: "condicional",
    condicao: { campo: "resultado", valores: ["reagendamento"] },
    blocos: [
      {
        id: id(),
        tipo: "campo_livre",
        campo: "reagendamento_motivo",
        label: "Motivo do reagendamento",
        placeholder: "Descreva o motivo do reagendamento da sessão...",
        obrigatorio: true,
      },
      { id: id(), tipo: "texto_fixo", conteudo: TEXTO_REAGENDAMENTO },
    ],
  };

  return [
    { id: id(), tipo: "cabecalho", titulo: "TERMO DE AUDIÊNCIA" },
    { id: id(), tipo: "dados_processo", mostrarClasseAssunto: true },
    {
      id: id(),
      tipo: "presentes",
      itens: [
        "mediador",
        "requerente",
        "advogado_requerente",
        "requerido",
        "preposto",
        "advogado_requerido",
      ],
    },
    {
      id: id(),
      tipo: "texto_fixo",
      conteudo:
        "Aberta a sessão de conciliação, nos moldes da Resolução 125/2010 do Conselho Nacional de Justiça – CNJ e do artigo 334 do Código de Processo Civil, na modalidade virtual de realização de audiência (sistema {plataforma_virtual}), conforme Provimento 15/2020 CGJ, e Ofício 28/2020 CEJUSC, sob a condução de {nome_mediador} ({cargo_mediador}), tendo sido franqueada a palavra às partes e seus procuradores para a tentativa de composição amigável do litígio.",
    },
    condicionalAcordo,
    condicionalSemAcordo,
    condicionalAusencia,
    condicionalReagendamento,
    { id: id(), tipo: "texto_fixo", conteudo: TEXTO_GRAVACAO_VIDEOCONFERENCIA },
    { id: id(), tipo: "texto_fixo", conteudo: TEXTO_DISPENSA_ASSINATURA },
    {
      id: id(),
      tipo: "assinatura",
      textoFechamento:
        "Nada mais havendo, foi lavrado o presente termo, que vai assinado eletronicamente por quem de direito.",
      mostrarMatricula: true,
    },
  ];
}

// ---------------------------------------------------------------------------
// Modelo 2 — Modelo Fazenda Pública
// ---------------------------------------------------------------------------
export function camposCustomizadosModeloFazenda(): CampoCustomizadoDef[] {
  return [
    {
      nome: "valor_rpv",
      label: "Valor RPV (R$)",
      tipo: "monetario",
      obrigatorio: true,
      placeholder: "0,00",
    },
    {
      nome: "prazo_pagamento_dias",
      label: "Prazo de pagamento (dias)",
      tipo: "texto",
      obrigatorio: true,
      placeholder: "Ex: 60",
    },
    {
      nome: "banco",
      label: "Banco",
      tipo: "texto",
      obrigatorio: true,
    },
    {
      nome: "agencia",
      label: "Agência",
      tipo: "texto",
      obrigatorio: true,
    },
    {
      nome: "conta_corrente",
      label: "Conta corrente",
      tipo: "texto",
      obrigatorio: true,
    },
    {
      nome: "titular_conta",
      label: "Titular da conta",
      tipo: "texto",
      obrigatorio: true,
    },
    {
      nome: "cpf_titular",
      label: "CPF do titular",
      tipo: "texto",
      obrigatorio: true,
    },
  ];
}

export function blocosModeloFazenda(): Bloco[] {
  const campos = camposCustomizadosModeloFazenda();

  const condicionalAcordo: BlocoCondicional = {
    id: id(),
    tipo: "condicional",
    condicao: { campo: "resultado", valores: ["acordo_total", "acordo_parcial"] },
    blocos: [
      {
        id: id(),
        tipo: "campo_livre",
        campo: "termos_acordo",
        label: "Termos do Acordo / Honorários",
        placeholder: "Descreva os termos do acordo e, se houver, os honorários...",
        obrigatorio: true,
      },
      {
        id: id(),
        tipo: "texto_fixo",
        conteudo:
          "As partes renunciam expressamente à incidência de juros e correção monetária sobre o valor ora acordado a partir da presente data, nos termos do acordo firmado.",
      },
      ...campos.map(
        (definicao): BlocoFilho => ({
          id: id(),
          tipo: "campo_customizado" as const,
          definicao,
        })
      ),
      {
        id: id(),
        tipo: "texto_fixo",
        conteudo:
          "As partes dão-se mútua e recíproca quitação quanto ao objeto da presente demanda, nada mais tendo a reclamar uma da outra, seja a que título for, em relação aos fatos discutidos nestes autos.",
      },
      {
        id: id(),
        tipo: "texto_fixo",
        conteudo: "Por fim, as partes requerem a homologação do acordo.",
      },
    ],
  };

  const condicionalSemAcordo: BlocoCondicional = {
    id: id(),
    tipo: "condicional",
    condicao: { campo: "resultado", valores: ["sem_acordo"] },
    blocos: [
      {
        id: id(),
        tipo: "texto_fixo",
        conteudo:
          "Realizada a declaração de abertura e o procedimento de conciliação/mediação, com aplicação das técnicas apropriadas, as partes NÃO fizeram acordo nesta oportunidade, devendo o processo prosseguir em seus ulteriores termos.",
      },
    ],
  };

  const condicionalAusencia: BlocoCondicional = {
    id: id(),
    tipo: "condicional",
    condicao: {
      campo: "resultado",
      valores: ["ausencia_requerente", "ausencia_requerido"],
    },
    blocos: [{ id: id(), tipo: "texto_fixo", conteudo: TEXTO_TOLERANCIA_AUSENCIA }],
  };

  const condicionalReagendamento: BlocoCondicional = {
    id: id(),
    tipo: "condicional",
    condicao: { campo: "resultado", valores: ["reagendamento"] },
    blocos: [
      {
        id: id(),
        tipo: "campo_livre",
        campo: "reagendamento_motivo",
        label: "Motivo do reagendamento",
        placeholder: "Descreva o motivo do reagendamento da sessão...",
        obrigatorio: true,
      },
      { id: id(), tipo: "texto_fixo", conteudo: TEXTO_REAGENDAMENTO },
    ],
  };

  return [
    { id: id(), tipo: "cabecalho", titulo: "TERMO DE SESSÃO DE CONCILIAÇÃO/MEDIAÇÃO" },
    { id: id(), tipo: "dados_processo", mostrarClasseAssunto: true },
    {
      id: id(),
      tipo: "presentes",
      itens: ["mediador", "requerente", "advogado_requerente", "requerido", "procurador"],
    },
    {
      id: id(),
      tipo: "texto_fixo",
      conteudo:
        "Aberta a sessão de conciliação/mediação, nos moldes da Resolução 125/2010 do Conselho Nacional de Justiça – CNJ e do Provimento nº 15, de 10/05/2020, da Corregedoria-Geral de Justiça, sob condução de {nome_mediador} ({cargo_mediador}), foi franqueada a palavra às partes e seus procuradores para a tentativa de composição amigável do litígio envolvendo a Fazenda Pública.",
    },
    condicionalAcordo,
    condicionalSemAcordo,
    condicionalAusencia,
    condicionalReagendamento,
    { id: id(), tipo: "texto_fixo", conteudo: TEXTO_GRAVACAO_VIDEOCONFERENCIA },
    {
      id: id(),
      tipo: "assinatura",
      textoFechamento:
        "Nada mais havendo, foi lavrado o presente termo, que vai assinado eletronicamente por quem de direito.",
      mostrarMatricula: true,
    },
  ];
}
