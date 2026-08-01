export function aplicarMascaraCpf(valorDigitado: string): string {
  const d = valorDigitado.replace(/\D/g, "").slice(0, 11);
  let resultado = d;
  if (d.length > 3) resultado = `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length > 6) resultado = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 9)
    resultado = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return resultado;
}

export function aplicarMascaraCnpj(valorDigitado: string): string {
  const d = valorDigitado.replace(/\D/g, "").slice(0, 14);
  let resultado = d;
  if (d.length > 2) resultado = `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length > 5) resultado = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 8)
    resultado = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  if (d.length > 12)
    resultado = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return resultado;
}

/** Aplica a máscara de CPF ou CNPJ conforme a quantidade de dígitos já digitados. */
export function aplicarMascaraDocumento(valorDigitado: string): string {
  const digitos = valorDigitado.replace(/\D/g, "");
  // Só decide que é CNPJ quando já passou do tamanho máximo de um CPF —
  // assim o usuário digitando um CPF normalmente nunca é interrompido.
  return digitos.length > 11 ? aplicarMascaraCnpj(valorDigitado) : aplicarMascaraCpf(valorDigitado);
}

export function validarCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

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

/** Valida como CPF (11 dígitos) ou CNPJ (14 dígitos) conforme o tamanho. */
export function validarDocumento(raw: string): boolean {
  const digitos = raw.replace(/\D/g, "");
  if (digitos.length === 11) return validarCpf(raw);
  if (digitos.length === 14) return validarCnpj(raw);
  return false;
}
