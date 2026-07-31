import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Usuario } from "../types";
import * as authService from "../services/authService";

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (payload: Parameters<typeof authService.registrar>[0]) => Promise<void>;
  sair: () => void;
  atualizarUsuario: (usuario: Usuario) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const salvo = localStorage.getItem("mediatermo_usuario");
    return salvo ? JSON.parse(salvo) : null;
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mediatermo_token");
    if (!token) {
      setCarregando(false);
      return;
    }
    authService
      .buscarPerfil()
      .then((u) => {
        setUsuario(u);
        localStorage.setItem("mediatermo_usuario", JSON.stringify(u));
      })
      .catch(() => {
        localStorage.removeItem("mediatermo_token");
        localStorage.removeItem("mediatermo_usuario");
        setUsuario(null);
      })
      .finally(() => setCarregando(false));
  }, []);

  const persistir = (token: string, u: Usuario) => {
    localStorage.setItem("mediatermo_token", token);
    localStorage.setItem("mediatermo_usuario", JSON.stringify(u));
    setUsuario(u);
  };

  const entrar = async (email: string, senha: string) => {
    const { token, usuario: u } = await authService.login(email, senha);
    persistir(token, u);
  };

  const cadastrar = async (payload: Parameters<typeof authService.registrar>[0]) => {
    const { token, usuario: u } = await authService.registrar(payload);
    persistir(token, u);
  };

  const sair = () => {
    localStorage.removeItem("mediatermo_token");
    localStorage.removeItem("mediatermo_usuario");
    setUsuario(null);
  };

  const atualizarUsuario = (u: Usuario) => {
    localStorage.setItem("mediatermo_usuario", JSON.stringify(u));
    setUsuario(u);
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, cadastrar, sair, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  return ctx;
}
