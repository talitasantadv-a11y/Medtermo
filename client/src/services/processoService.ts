import { api } from "./api";
import { DadosExtraidosProcesso, Parte, Processo, UploadProcesso } from "../types";

export async function listarProcessos(params?: { busca?: string; status?: string }): Promise<Processo[]> {
  const { data } = await api.get<{ processos: Processo[] }>("/processos", { params });
  return data.processos;
}

export async function obterProcesso(id: number): Promise<Processo> {
  const { data } = await api.get<{ processo: Processo }>(`/processos/${id}`);
  return data.processo;
}

export async function buscarProcessoPorCnj(
  numeroCnj: string
): Promise<{ encontrado: boolean; cnjValido: boolean; processo: Processo | null }> {
  const { data } = await api.get("/processos/buscar", { params: { numeroCnj } });
  return data;
}

export async function iniciarProcesso(numeroCnj: string): Promise<Processo> {
  const { data } = await api.post<{ processo: Processo }>("/processos/iniciar", { numeroCnj });
  return data.processo;
}

export async function salvarProcesso(payload: {
  numeroCnj: string;
  lotacao?: string;
  comarca?: string;
  classeProcessual?: string;
  assunto?: string;
  partes: Parte[];
}): Promise<Processo> {
  const { data } = await api.post<{ processo: Processo }>("/processos", payload);
  return data.processo;
}

export async function enviarUploadPdf(
  processoId: number,
  arquivo: File,
  onProgress?: (percentual: number) => void
): Promise<UploadProcesso> {
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  const { data } = await api.post<{ upload: UploadProcesso }>(
    `/processos/${processoId}/uploads`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evento) => {
        if (onProgress && evento.total) {
          onProgress(Math.round((evento.loaded * 100) / evento.total));
        }
      },
    }
  );
  return data.upload;
}

export async function listarUploads(
  processoId: number
): Promise<{ uploads: UploadProcesso[]; dadosConsolidados: DadosExtraidosProcesso }> {
  const { data } = await api.get(`/processos/${processoId}/uploads`);
  return data;
}

export async function removerUpload(processoId: number, uploadId: number): Promise<void> {
  await api.delete(`/processos/${processoId}/uploads/${uploadId}`);
}

export async function excluirProcesso(id: number): Promise<void> {
  await api.delete(`/processos/${id}`);
}

export interface DadosCnjDatajud {
  classe?: string;
  assuntos: string[];
  orgaoJulgador?: string;
  tribunal?: string;
  grau?: string;
  dataAjuizamento?: string;
}

export async function consultarCnj(
  numeroCnj: string
): Promise<{ encontrado: boolean; dados?: DadosCnjDatajud }> {
  const { data } = await api.get("/processos/consultar-cnj", { params: { numeroCnj } });
  return data;
}
