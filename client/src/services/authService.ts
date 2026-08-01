import { api } from "./api";
import { Usuario } from "../types";

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", { email, senha });
  return data;
}

export async function registrar(payload: {
  nomeCompleto: string;
  email: string;
  senha: string;
  registroProfissional?: string;
  telefone?: string;
  cargo?: string;
}): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/registrar", payload);
  return data;
}

export async function buscarPerfil(): Promise<Usuario> {
  const { data } = await api.get<{ usuario: Usuario }>("/auth/me");
  return data.usuario;
}

export async function atualizarPerfil(payload: Partial<{
  nomeCompleto: string;
  registroProfissional: string;
  telefone: string;
  cargo: string;
  datajudApiKey: string;
  senhaAtual: string;
  novaSenha: string;
}>): Promise<Usuario> {
  const { data } = await api.put<{ usuario: Usuario }>("/auth/perfil", payload);
  return data.usuario;
}
