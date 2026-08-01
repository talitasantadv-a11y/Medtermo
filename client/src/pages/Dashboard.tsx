import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Processo } from "../types";
import { excluirProcesso, listarProcessos } from "../services/processoService";
import { mensagemErro } from "../services/api";
import { BadgeStatusSessao } from "../components/common/Badge";
import { Spinner } from "../components/common/Spinner";
import { formatarDataBr } from "../utils/formatacao";

const FILTROS_STATUS = [
  { valor: "", label: "Todos" },
  { valor: "pendente", label: "Pendente" },
  { valor: "em_andamento", label: "Em andamento" },
  { valor: "finalizado", label: "Finalizado" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");

  async function handleExcluir(e: React.MouseEvent, p: Processo) {
    e.stopPropagation();
    if (!confirm(`Excluir a mediação do processo ${p.numeroCnj}? Essa ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await excluirProcesso(p.id);
      toast.success("Mediação excluída.");
      carregar();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  }

  async function carregar() {
    setCarregando(true);
    try {
      const dados = await listarProcessos({ busca: busca || undefined, status: status || undefined });
      setProcessos(dados);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(carregar, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, status]);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Minhas Mediações</h1>
          <p className="text-sm text-neutral-500">Acompanhe seus processos e sessões</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/nova-mediacao")}>
          + Nova Mediação
        </button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          className="input sm:max-w-xs"
          placeholder="Buscar por número CNJ..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-neutral-100 p-1">
          {FILTROS_STATUS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setStatus(f.valor)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                status === f.valor ? "bg-white shadow-sm text-brand-800" : "text-neutral-500"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner tamanho={28} />
        </div>
      ) : processos.length === 0 ? (
        <div className="card text-center text-neutral-500">
          Nenhuma mediação encontrada.{" "}
          <button className="text-brand-700 underline" onClick={() => navigate("/nova-mediacao")}>
            Iniciar uma nova mediação
          </button>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {processos.map((p) => {
            const requerentes = p.partes.filter((pt) => pt.polo === "requerente").map((pt) => pt.nomeCompleto).join(", ");
            const requeridos = p.partes.filter((pt) => pt.polo === "requerido").map((pt) => pt.nomeCompleto).join(", ");
            const podeExcluir = p.ultimaSessao?.status !== "finalizado";
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/processos/${p.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/processos/${p.id}`)}
                className="card cursor-pointer text-left transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-medium text-neutral-800">{p.numeroCnj}</span>
                  <div className="flex items-center gap-2">
                    <BadgeStatusSessao status={p.statusAtual || "pendente"} />
                    {podeExcluir && (
                      <button
                        type="button"
                        title="Excluir mediação"
                        className="text-neutral-300 hover:text-red-600"
                        onClick={(e) => handleExcluir(e, p)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <p className="truncate text-sm text-neutral-600">
                  <span className="text-neutral-400">Req.: </span>
                  {requerentes || "—"}
                </p>
                <p className="truncate text-sm text-neutral-600">
                  <span className="text-neutral-400">Reqdo.: </span>
                  {requeridos || "—"}
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  {p.ultimaSessao
                    ? `Última sessão: ${formatarDataBr(p.ultimaSessao.dataSessao)}`
                    : "Nenhuma sessão registrada"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
