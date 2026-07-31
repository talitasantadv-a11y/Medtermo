import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mediatermo_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (erro) => {
    if (erro.response?.status === 401) {
      localStorage.removeItem("mediatermo_token");
      localStorage.removeItem("mediatermo_usuario");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(erro);
  }
);

export function mensagemErro(erro: unknown): string {
  if (axios.isAxiosError(erro)) {
    return erro.response?.data?.erro || erro.message || "Erro inesperado.";
  }
  return "Erro inesperado.";
}
