export function aplicarMascaraCpf(valorDigitado: string): string {
  const d = valorDigitado.replace(/\D/g, "").slice(0, 11);
  let resultado = d;
  if (d.length > 3) resultado = `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length > 6) resultado = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 9)
    resultado = `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  return resultado;
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
