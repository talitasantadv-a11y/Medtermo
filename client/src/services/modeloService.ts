import { api } from "./api";
import { Modelo } from "../types";
import { Bloco, CampoCustomizadoDef } from "../types/termo";

export async function listarModelos(ativo?: boolean): Promise<Modelo[]> {
  const { data } = await api.get<{ modelos: Modelo[] }>("/modelos", {
    params: ativo !== undefined ? { ativo } : {},
  });
  return data.modelos;
}

export async function obterModelo(id: number): Promise<Modelo> {
  const { data } = await api.get<{ modelo: Modelo }>(`/modelos/${id}`);
  return data.modelo;
}

export interface ModeloPayload {
  nome: string;
  descricao?: string;
  blocos: Bloco[];
  camposCustomizados?: CampoCustomizadoDef[];
  ativo?: boolean;
  cejuscId?: number | null;
}

export async function criarModelo(payload: ModeloPayload): Promise<Modelo> {
  const { data } = await api.post<{ modelo: Modelo }>("/modelos", payload);
  return data.modelo;
}

export async function atualizarModelo(id: number, payload: Partial<ModeloPayload>): Promise<Modelo> {
  const { data } = await api.put<{ modelo: Modelo }>(`/modelos/${id}`, payload);
  return data.modelo;
}

export async function removerModelo(id: number): Promise<void> {
  await api.delete(`/modelos/${id}`);
}
