export function aplicarMascaraCnj(valorDigitado: string): string {
  const d = valorDigitado.replace(/\D/g, "").slice(0, 20);
  let resultado = d;
  if (d.length > 7) resultado = `${d.slice(0, 7)}-${d.slice(7)}`;
  if (d.length > 9) resultado = `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9)}`;
  if (d.length > 13)
    resultado = `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13)}`;
  if (d.length > 14)
    resultado = `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(
      14
    )}`;
  if (d.length > 16)
    resultado = `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(
      14,
      16
    )}.${d.slice(16)}`;
  return resultado;
}

function mod97(numStr: string): number {
  let resto = 0;
  for (const char of numStr) {
    resto = (resto * 10 + Number(char)) % 97;
  }
  return resto;
}

export function validarCnj(numeroCnj: string): boolean {
  const digitos = numeroCnj.replace(/\D/g, "");
  if (digitos.length !== 20) return false;

  const sequencial = digitos.slice(0, 7);
  const dvInformado = digitos.slice(7, 9);
  const ano = digitos.slice(9, 13);
  const segmento = digitos.slice(13, 14);
  const tribunal = digitos.slice(14, 16);
  const origem = digitos.slice(16, 20);

  const corpo = `${sequencial}${ano}${segmento}${tribunal}${origem}00`;
  const resto = mod97(corpo);
  const dvCalculado = String(98 - resto).padStart(2, "0");
  return dvCalculado === dvInformado;
}

export function cnjEstaCompleto(numeroCnj: string): boolean {
  return numeroCnj.replace(/\D/g, "").length === 20;
}
