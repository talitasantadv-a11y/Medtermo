import { api } from "./api";
import { Cejusc } from "../types";

export interface CejuscPayload {
  nome: string;
  endereco?: string;
  telefone?: string;
  email?: string;
}

export async function listarCejuscs(): Promise<Cejusc[]> {
  const { data } = await api.get<{ cejuscs: Cejusc[] }>("/cejuscs");
  return data.cejuscs;
}

export async function criarCejusc(payload: CejuscPayload): Promise<Cejusc> {
  const { data } = await api.post<{ cejusc: Cejusc }>("/cejuscs", payload);
  return data.cejusc;
}

export async function atualizarCejusc(id: number, payload: Partial<CejuscPayload>): Promise<Cejusc> {
  const { data } = await api.put<{ cejusc: Cejusc }>(`/cejuscs/${id}`, payload);
  return data.cejusc;
}

export async function removerCejusc(id: number): Promise<void> {
  await api.delete(`/cejuscs/${id}`);
}

export async function enviarLogoCejusc(id: number, arquivo: File): Promise<Cejusc> {
  const formData = new FormData();
  formData.append("logo", arquivo);
  const { data } = await api.post<{ cejusc: Cejusc }>(`/cejuscs/${id}/logo`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.cejusc;
}

export async function removerLogoCejusc(id: number): Promise<Cejusc> {
  const { data } = await api.delete<{ cejusc: Cejusc }>(`/cejuscs/${id}/logo`);
  return data.cejusc;
}

export function urlDoLogo(cejusc?: Pick<Cejusc, "logoPath"> | null): string | null {
  if (!cejusc?.logoPath) return null;
  return `/uploads/${cejusc.logoPath}`;
}
