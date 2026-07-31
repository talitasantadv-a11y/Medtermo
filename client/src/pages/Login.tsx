import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { mensagemErro } from "../services/api";
import { Spinner } from "../components/common/Spinner";

export default function Login() {
  const { usuario, entrar, cadastrar } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<"login" | "cadastro">("login");
  const [carregando, setCarregando] = useState(false);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [registroProfissional, setRegistroProfissional] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("Mediador(a) Judicial");

  if (usuario) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "login") {
        await entrar(email, senha);
        toast.success("Bem-vindo(a) de volta!");
      } else {
        await cadastrar({ nomeCompleto, email, senha, registroProfissional, telefone, cargo });
        toast.success("Cadastro realizado com sucesso!");
      }
      navigate("/");
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-brand-800">MediaTermo</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Geração de termos de sessão de mediação/conciliação
          </p>
        </div>

        <div className="card">
          <div className="mb-5 flex gap-1 rounded-lg bg-neutral-100 p-1">
            <button
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                modo === "login" ? "bg-white shadow-sm" : "text-neutral-500"
              }`}
              onClick={() => setModo("login")}
              type="button"
            >
              Entrar
            </button>
            <button
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                modo === "cadastro" ? "bg-white shadow-sm" : "text-neutral-500"
              }`}
              onClick={() => setModo("cadastro")}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === "cadastro" && (
              <div>
                <label className="label">Nome completo</label>
                <input
                  className="input"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {modo === "cadastro" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Matrícula</label>
                    <input
                      className="input"
                      value={registroProfissional}
                      onChange={(e) => setRegistroProfissional(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Telefone</label>
                    <input
                      className="input"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Cargo</label>
                  <input className="input" value={cargo} onChange={(e) => setCargo(e.target.value)} />
                </div>
              </>
            )}

            <button type="submit" className="btn-primary w-full" disabled={carregando}>
              {carregando && <Spinner />}
              {modo === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          {modo === "login" && (
            <p className="mt-4 text-center text-xs text-neutral-400">
              Demonstração: demo@mediatermo.com.br / mediatermo123
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
