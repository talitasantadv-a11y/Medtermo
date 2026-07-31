// Extração de números de OAB no texto do processo. Formatos comuns:
// "OAB/SP 123.456", "OAB nº 123456/SP", "OAB: 123456-SP"

export const OAB_REGEX =
  /OAB[\/\s.:nº°]*([A-Z]{2})[\s.:-]*([\d.]{4,7})|OAB[\s.:nº°]*([\d.]{4,7})[\s\/-]*([A-Z]{2})/gi;

export interface OabEncontrada {
  numero: string;
  uf: string;
  valor: string; // formatado "SP 123456"
}

export function extrairOabsDoTexto(texto: string): OabEncontrada[] {
  OAB_REGEX.lastIndex = 0;
  const resultado: OabEncontrada[] = [];
  let match: RegExpExecArray | null;
  while ((match = OAB_REGEX.exec(texto))) {
    const uf = (match[1] || match[4] || "").toUpperCase();
    const numero = (match[2] || match[3] || "").replace(/\D/g, "");
    if (uf && numero) {
      resultado.push({ numero, uf, valor: `${uf} ${numero}` });
    }
  }
  return resultado;
}
