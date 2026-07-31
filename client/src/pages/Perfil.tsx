import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { atualizarPerfil } from "../services/authService";
import { mensagemErro } from "../services/api";
import { Spinner } from "../components/common/Spinner";

export default function Perfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const [nomeCompleto, setNomeCompleto] = useState(usuario?.nomeCompleto || "");
  const [cargo, setCargo] = useState(usuario?.cargo || "");
  const [registroProfissional, setRegistroProfissional] = useState(usuario?.registroProfissional || "");
  const [telefone, setTelefone] = useState(usuario?.telefone || "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const atualizado = await atualizarPerfil({
        nomeCompleto,
        cargo,
        registroProfissional,
        telefone,
        ...(novaSenha ? { senhaAtual, novaSenha } : {}),
      });
      atualizarUsuario(atualizado);
      setSenhaAtual("");
      setNovaSenha("");
      toast.success("Perfil atualizado com sucesso.");
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">Meu Perfil</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Estes dados aparecem no cabeçalho e assinatura dos termos gerados.
      </p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">Nome completo</label>
          <input className="input" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} required />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input bg-neutral-50" value={usuario?.email} disabled />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Cargo</label>
            <input className="input" value={cargo} onChange={(e) => setCargo(e.target.value)} />
          </div>
          <div>
            <label className="label">Matrícula</label>
            <input
              className="input"
              value={registroProfissional}
              onChange={(e) => setRegistroProfissional(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>

        <hr className="border-neutral-100" />
        <p className="text-sm font-medium text-neutral-700">Alterar senha (opcional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Senha atual</label>
            <input
              type="password"
              className="input"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Nova senha</label>
            <input
              type="password"
              className="input"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              minLength={6}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={salvando}>
          {salvando && <Spinner />}
          Salvar alterações
        </button>
      </form>
    </div>
  );
}
