import { CampoExtraido, DadosExtraidosProcesso, ParteExtraida } from "../parser/processo";

function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function melhorCampo(
  a?: CampoExtraido,
  b?: CampoExtraido
): CampoExtraido | undefined {
  if (!a) return b;
  if (!b) return a;
  const ordem = { alta: 3, media: 2, baixa: 1 } as const;
  return ordem[b.confianca] > ordem[a.confianca] ? b : a;
}

/**
 * Consolida os dados extraídos de múltiplos uploads de um mesmo processo
 * (ex: capa + despacho + procuração), sem sobrescrever dados já mais confiáveis.
 * Partes são unidas por nome+polo, preenchendo lacunas (CPF, advogado, OAB)
 * quando um upload posterior traz informação que o anterior não trouxe.
 */
export function consolidarDadosExtraidos(
  extracoes: DadosExtraidosProcesso[]
): DadosExtraidosProcesso {
  let numeroCnj: CampoExtraido | undefined;
  let classeProcessual: CampoExtraido | undefined;
  let assunto: CampoExtraido | undefined;
  let lotacao: CampoExtraido | undefined;
  let comarca: CampoExtraido | undefined;
  let dataAudiencia: CampoExtraido | undefined;
  const partesPorChave = new Map<string, ParteExtraida>();

  for (const extracao of extracoes) {
    numeroCnj = melhorCampo(numeroCnj, extracao.numeroCnj);
    classeProcessual = melhorCampo(classeProcessual, extracao.classeProcessual);
    assunto = melhorCampo(assunto, extracao.assunto);
    lotacao = melhorCampo(lotacao, extracao.lotacao);
    comarca = melhorCampo(comarca, extracao.comarca);
    dataAudiencia = melhorCampo(dataAudiencia, extracao.dataAudiencia);

    for (const parte of extracao.partes) {
      const chave = `${parte.polo}:${normalizarNome(parte.nomeCompleto)}`;
      const existente = partesPorChave.get(chave);
      if (!existente) {
        partesPorChave.set(chave, parte);
      } else {
        partesPorChave.set(chave, {
          ...existente,
          cpf: existente.cpf || parte.cpf,
          cpfValido: existente.cpf ? existente.cpfValido : parte.cpfValido,
          advogadoNome: existente.advogadoNome || parte.advogadoNome,
          advogadoOab: existente.advogadoOab || parte.advogadoOab,
        });
      }
    }
  }

  return {
    numeroCnj,
    classeProcessual,
    assunto,
    lotacao,
    comarca,
    dataAudiencia,
    partes: Array.from(partesPorChave.values()),
  };
}
