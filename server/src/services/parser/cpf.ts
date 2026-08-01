export const CPF_REGEX = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
export const CNPJ_REGEX = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;

export function formatarCpf(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 11) return raw;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

export function formatarCnpj(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 14) return raw;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
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

/** Valida os dígitos verificadores do CNPJ. */
export function validarCnpj(raw: string): boolean {
  const cnpj = raw.replace(/\D/g, "");
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calcularDigito = (base: string, pesoInicial: number) => {
    let soma = 0;
    let peso = pesoInicial;
    for (const char of base) {
      soma += Number(char) * peso;
      peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcularDigito(cnpj.slice(0, 12), 5);
  const d2 = calcularDigito(cnpj.slice(0, 12) + d1, 6);

  return cnpj.slice(12, 14) === `${d1}${d2}`;
}

/** Valida CPF (11 dígitos) ou CNPJ (14 dígitos) conforme o tamanho informado. */
export function validarDocumento(raw: string): boolean {
  const digitos = raw.replace(/\D/g, "");
  if (digitos.length === 11) return validarCpf(raw);
  if (digitos.length === 14) return validarCnpj(raw);
  return false;
}

export function formatarDocumento(raw: string): string {
  const digitos = raw.replace(/\D/g, "");
  if (digitos.length === 11) return formatarCpf(raw);
  if (digitos.length === 14) return formatarCnpj(raw);
  return raw;
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

/**
 * Extrai CPFs e CNPJs do texto (partes podem ser pessoa física ou jurídica,
 * ex: Fazenda Pública, empresas). CNPJ é checado primeiro pois seu padrão com
 * "/" não seria capturado corretamente pelo regex de CPF.
 */
export function extrairDocumentosDoTexto(
  texto: string
): { valor: string; valido: boolean }[] {
  const encontrados = new Map<string, { valor: string; valido: boolean }>();

  CNPJ_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  const trechosComCnpj: [number, number][] = [];
  while ((match = CNPJ_REGEX.exec(texto))) {
    const valor = formatarCnpj(match[0]);
    encontrados.set(valor, { valor, valido: validarCnpj(valor) });
    trechosComCnpj.push([match.index, match.index + match[0].length]);
  }

  CPF_REGEX.lastIndex = 0;
  while ((match = CPF_REGEX.exec(texto))) {
    // evita capturar um sub-trecho de um CNPJ já encontrado como se fosse CPF
    const dentroDeCnpj = trechosComCnpj.some(
      ([inicio, fim]) => match!.index >= inicio && match!.index < fim
    );
    if (dentroDeCnpj) continue;
    const valor = formatarCpf(match[0]);
    if (!encontrados.has(valor)) {
      encontrados.set(valor, { valor, valido: validarCpf(valor) });
    }
  }

  return Array.from(encontrados.values());
}
