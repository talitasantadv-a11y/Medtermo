import axios from "axios";
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

async function baixarArquivo(
  caminho: string,
  nomeArquivoSugerido: string,
  tipoMime: string
): Promise<void> {
  let response;
  try {
    response = await api.get(caminho, { responseType: "blob" });
  } catch (erro) {
    if (axios.isAxiosError(erro) && erro.response?.data instanceof Blob) {
      const texto = await erro.response.data.text();
      try {
        const corpo = JSON.parse(texto);
        throw new Error(corpo.erro || "Não foi possível gerar o arquivo.");
      } catch {
        throw new Error("Não foi possível gerar o arquivo.");
      }
    }
    throw erro;
  }

  const url = window.URL.createObjectURL(new Blob([response.data], { type: tipoMime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivoSugerido;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function baixarPdfSessao(id: number, nomeArquivoSugerido: string): Promise<void> {
  return baixarArquivo(`/sessoes/${id}/pdf`, nomeArquivoSugerido, "application/pdf");
}

export async function baixarDocxSessao(id: number, nomeArquivoSugerido: string): Promise<void> {
  return baixarArquivo(
    `/sessoes/${id}/docx`,
    nomeArquivoSugerido,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
