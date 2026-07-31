// O conector SQLite do Prisma não suporta o tipo Json nativamente, então os
// campos "JSON" do schema são armazenados como texto e (de)serializados aqui.

export function paraJson(valor: unknown): string {
  return JSON.stringify(valor ?? null);
}

export function deJson<T>(valor: string | null | undefined, fallback: T): T {
  if (!valor) return fallback;
  try {
    return JSON.parse(valor) as T;
  } catch {
    return fallback;
  }
}
