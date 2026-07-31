export const CPF_REGEX = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;

export function formatarCpf(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 11) return raw;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

/** Valida os dígitos verificadores do CPF. */
export function validarCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos os dígitos iguais

  const calcularDigito = (base: string) => {
    let soma = 0;
    let peso = base.length + 1;
    for (const char of base) {
      soma += Number(char) * peso;
      peso--;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcularDigito(cpf.slice(0, 9));
  const d2 = calcularDigito(cpf.slice(0, 9) + d1);

  return cpf.slice(9, 11) === `${d1}${d2}`;
}

export function extrairCpfsDoTexto(
  texto: string
): { valor: string; valido: boolean }[] {
  CPF_REGEX.lastIndex = 0;
  const encontrados = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = CPF_REGEX.exec(texto))) {
    encontrados.add(formatarCpf(match[0]));
  }
  return Array.from(encontrados).map((valor) => ({
    valor,
    valido: validarCpf(valor),
  }));
}
