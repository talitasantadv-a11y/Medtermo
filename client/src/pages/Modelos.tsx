import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Modelo } from "../types";
import {
  atualizarModelo,
  criarModelo,
  listarModelos,
  removerModelo,
} from "../services/modeloService";
import { mensagemErro } from "../services/api";
import { Spinner } from "../components/common/Spinner";
import { ModeloEditor, ModeloEditorPayload } from "../components/ModeloEditor/ModeloEditor";

export default function Modelos() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<Modelo | null | "novo">(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      setModelos(await listarModelos());
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar(payload: ModeloEditorPayload) {
    setSalvando(true);
    try {
      if (editando === "novo") {
        await criarModelo(payload);
        toast.success("Modelo criado com sucesso.");
      } else if (editando) {
        await atualizarModelo(editando.id, payload);
        toast.success("Modelo atualizado com sucesso.");
      }
      setEditando(null);
      carregar();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(modelo: Modelo) {
    if (!confirm(`Remover o modelo "${modelo.nome}"?`)) return;
    try {
      await removerModelo(modelo.id);
      toast.success("Modelo removido.");
      carregar();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  }

  async function handleToggleAtivo(modelo: Modelo) {
    try {
      await atualizarModelo(modelo.id, { ativo: !modelo.ativo });
      carregar();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  }

  if (editando) {
    return (
      <div>
        <h1 className="mb-6 text-xl font-semibold text-neutral-900">
          {editando === "novo" ? "Novo Modelo" : `Editar: ${editando.nome}`}
        </h1>
        <ModeloEditor
          modeloInicial={editando === "novo" ? null : editando}
          salvando={salvando}
          onSalvar={handleSalvar}
          onCancelar={() => setEditando(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Modelos de Termo</h1>
          <p className="text-sm text-neutral-500">Gerencie os templates usados para gerar os termos.</p>
        </div>
        <button className="btn-primary" onClick={() => setEditando("novo")}>
          + Novo Modelo
        </button>
      </div>

      {carregando ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner tamanho={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {modelos.map((m) => (
            <div key={m.id} className="card">
              <div className="mb-2 flex items-start justify-between">
                <h2 className="font-medium text-neutral-800">{m.nome}</h2>
                <span className={`badge ${m.ativo ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                  {m.ativo ? "ativo" : "inativo"}
                </span>
              </div>
              <p className="mb-4 text-sm text-neutral-500">{m.descricao}</p>
              <p className="mb-4 text-xs text-neutral-400">{m.blocos.length} bloco(s)</p>
              <div className="flex gap-2">
                <button className="btn-secondary flex-1" onClick={() => setEditando(m)}>
                  Editar
                </button>
                <button className="btn-secondary" onClick={() => handleToggleAtivo(m)}>
                  {m.ativo ? "Desativar" : "Ativar"}
                </button>
                <button className="btn-danger" onClick={() => handleRemover(m)}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
