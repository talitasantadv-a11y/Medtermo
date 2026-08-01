import { NavLink, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-brand-700 text-white" : "text-neutral-600 hover:bg-neutral-100"
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className="text-lg font-semibold tracking-tight text-brand-800"
            >
              MediaTermo
            </button>
            <nav className="hidden gap-1 sm:flex">
              <NavLink to="/" end className={linkClasses}>
                Painel
              </NavLink>
              <NavLink to="/modelos" className={linkClasses}>
                Modelos
              </NavLink>
              <NavLink to="/cejuscs" className={linkClasses}>
                CEJUSCs
              </NavLink>
              <NavLink to="/perfil" className={linkClasses}>
                Perfil
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-neutral-500 sm:inline">
              {usuario?.nomeCompleto}
            </span>
            <button onClick={sair} className="btn-secondary !px-3 !py-1.5 text-xs">
              Sair
            </button>
          </div>
        </div>
        <nav className="flex gap-1 border-t border-neutral-100 px-4 py-1.5 sm:hidden">
          <NavLink to="/" end className={linkClasses}>
            Painel
          </NavLink>
          <NavLink to="/modelos" className={linkClasses}>
            Modelos
          </NavLink>
          <NavLink to="/cejuscs" className={linkClasses}>
            CEJUSCs
          </NavLink>
          <NavLink to="/perfil" className={linkClasses}>
            Perfil
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
