import { api } from "./api";
import { Sessao } from "../types";
import { BlocoRenderizado } from "../types/termo";

export interface CriarSessaoPayload {
  processoId: number;
  modeloId: number;
  dataSessao: string;
  horarioInicio: string;
  horarioEncerramento?: string;
  local?: string;
  modalidade: "presencial" | "virtual";
  plataformaVirtual?: string;
  presencas?: Record<string, boolean>;
}

export async function criarSessao(payload: CriarSessaoPayload): Promise<Sessao> {
  const { data } = await api.post<{ sessao: Sessao }>("/sessoes", payload);
  return data.sessao;
}

export async function listarSessoesPorProcesso(processoId: number): Promise<Sessao[]> {
  const { data } = await api.get<{ sessoes: Sessao[] }>("/sessoes", { params: { processoId } });
  return data.sessoes;
}

export async function obterSessao(id: number): Promise<Sessao> {
  const { data } = await api.get<{ sessao: Sessao }>(`/sessoes/${id}`);
  return data.sessao;
}

export async function atualizarSessao(id: number, payload: Partial<Sessao>): Promise<Sessao> {
  const { data } = await api.put<{ sessao: Sessao }>(`/sessoes/${id}`, payload);
  return data.sessao;
}

export async function obterTermoMontado(
  id: number
): Promise<{ termo: BlocoRenderizado[]; camposObrigatoriosFaltantes: string[] }> {
  const { data } = await api.get(`/sessoes/${id}/termo`);
  return data;
}

export async function baixarPdfSessao(id: number, nomeArquivoSugerido: string): Promise<void> {
  const response = await api.get(`/sessoes/${id}/pdf`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivoSugerido;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
