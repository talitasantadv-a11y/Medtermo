// Validação e extração do número único de processo no padrão CNJ
// (Resolução 65/2008 do CNJ): NNNNNNN-DD.AAAA.J.TR.OOOO

export const CNJ_REGEX = /(\d{7})-?(\d{2})\.?(\d{4})\.?(\d)\.?(\d{2})\.?(\d{4})/g;

export interface NumeroCnjPartes {
  sequencial: string;
  digitoVerificador: string;
  ano: string;
  segmentoJudiciario: string;
  tribunal: string;
  origem: string;
}

export function formatarCnj(raw: string): string {
  const digitos = raw.replace(/\D/g, "");
  if (digitos.length !== 20) return raw;
  const s = digitos.slice(0, 7);
  const dv = digitos.slice(7, 9);
  const ano = digitos.slice(9, 13);
  const j = digitos.slice(13, 14);
  const tr = digitos.slice(14, 16);
  const o = digitos.slice(16, 20);
  return `${s}-${dv}.${ano}.${j}.${tr}.${o}`;
}

export function partesCnj(numeroCnj: string): NumeroCnjPartes | null {
  const digitos = numeroCnj.replace(/\D/g, "");
  if (digitos.length !== 20) return null;
  return {
    sequencial: digitos.slice(0, 7),
    digitoVerificador: digitos.slice(7, 9),
    ano: digitos.slice(9, 13),
    segmentoJudiciario: digitos.slice(13, 14),
    tribunal: digitos.slice(14, 16),
    origem: digitos.slice(16, 20),
  };
}

/**
 * Valida o dígito verificador do número CNJ usando o algoritmo módulo 97 base 10
 * (mesmo princípio do IBAN), conforme especificado pela Resolução 65/2008 do CNJ.
 */
export function validarCnj(numeroCnj: string): boolean {
  const digitos = numeroCnj.replace(/\D/g, "");
  if (digitos.length !== 20) return false;

  const sequencial = digitos.slice(0, 7);
  const dvInformado = digitos.slice(7, 9);
  const ano = digitos.slice(9, 13);
  const segmento = digitos.slice(13, 14);
  const tribunal = digitos.slice(14, 16);
  const origem = digitos.slice(16, 20);

  // corpo para o cálculo: sequencial + ano + segmento + tribunal + origem, com DV = 00
  const corpo = `${sequencial}${ano}${segmento}${tribunal}${origem}00`;
  const resto = mod97Big(corpo);
  const dvCalculado = String(98 - resto).padStart(2, "0");

  return dvCalculado === dvInformado;
}

function mod97Big(numStr: string): number {
  let resto = 0;
  for (const char of numStr) {
    resto = (resto * 10 + Number(char)) % 97;
  }
  return resto;
}

export function extrairCnjDoTexto(
  texto: string
): { valor: string; valido: boolean } | null {
  CNJ_REGEX.lastIndex = 0;
  const match = CNJ_REGEX.exec(texto);
  if (!match) return null;
  const digitos = match.slice(1, 7).join("");
  const formatado = formatarCnj(digitos);
  return { valor: formatado, valido: validarCnj(formatado) };
}
