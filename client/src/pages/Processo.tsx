import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Processo as ProcessoType } from "../types";
import { obterProcesso } from "../services/processoService";
import { baixarDocxSessao, baixarPdfSessao } from "../services/sessaoService";
import { mensagemErro } from "../services/api";
import { Spinner } from "../components/common/Spinner";
import { BadgeStatusSessao } from "../components/common/Badge";
import { LABELS_RESULTADO, ResultadoSessao } from "../types/termo";
import { formatarDataBr } from "../utils/formatacao";

export default function Processo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [processo, setProcesso] = useState<ProcessoType | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [baixando, setBaixando] = useState<number | null>(null);
  const [baixandoDocx, setBaixandoDocx] = useState<number | null>(null);

  async function carregar() {
    if (!id) return;
    setCarregando(true);
    try {
      const dados = await obterProcesso(Number(id));
      setProcesso(dados);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleBaixar(sessaoId: number) {
    if (!processo) return;
    setBaixando(sessaoId);
    try {
      await baixarPdfSessao(sessaoId, `termo-${processo.numeroCnj}-sessao-${sessaoId}.pdf`);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setBaixando(null);
    }
  }

  async function handleBaixarDocx(sessaoId: number) {
    if (!processo) return;
    setBaixandoDocx(sessaoId);
    try {
      await baixarDocxSessao(sessaoId, `termo-${processo.numeroCnj}-sessao-${sessaoId}.docx`);
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setBaixandoDocx(null);
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-16 text-brand-700">
        <Spinner tamanho={28} />
      </div>
    );
  }

  if (!processo) return <p className="text-neutral-500">Processo não encontrado.</p>;

  const requerentes = processo.partes.filter((p) => p.polo === "requerente");
  const requeridos = processo.partes.filter((p) => p.polo === "requerido");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-mono text-lg font-semibold text-neutral-900">{processo.numeroCnj}</h1>
          <p className="text-sm text-neutral-500">
            {processo.lotacao || "Lotação não informada"}
            {processo.comarca ? ` • ${processo.comarca}` : ""}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate(`/nova-mediacao?cnj=${encodeURIComponent(processo.numeroCnj)}`)}
        >
          + Nova sessão
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">Requerente(s)</h2>
          {requerentes.map((p, i) => (
            <p key={i} className="text-sm text-neutral-700">
              {p.nomeCompleto} {p.cpf && <span className="text-neutral-400">— {p.cpf}</span>}
              {p.advogadoNome && (
                <span className="block text-xs text-neutral-400">
                  Adv.: {p.advogadoNome} {p.advogadoOab && `(OAB ${p.advogadoOab})`}
                </span>
              )}
            </p>
          ))}
        </div>
        <div className="card">
          <h2 className="mb-2 text-sm font-semibold uppercase text-neutral-500">Requerido(s)</h2>
          {requeridos.map((p, i) => (
            <p key={i} className="text-sm text-neutral-700">
              {p.nomeCompleto} {p.cpf && <span className="text-neutral-400">— {p.cpf}</span>}
              {p.advogadoNome && (
                <span className="block text-xs text-neutral-400">
                  Adv.: {p.advogadoNome} {p.advogadoOab && `(OAB ${p.advogadoOab})`}
                </span>
              )}
            </p>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase text-neutral-500">Histórico de sessões</h2>
        {!processo.sessoes || processo.sessoes.length === 0 ? (
          <p className="card text-sm text-neutral-500">Nenhuma sessão registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {processo.sessoes.map((s) => (
              <div key={s.id} className="card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-neutral-800">
                    {formatarDataBr(s.dataSessao)} às {s.horarioInicio} — {s.modelo?.nome}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <BadgeStatusSessao status={s.status} />
                    {s.resultado && (
                      <span className="badge bg-neutral-100 text-neutral-600">
                        {LABELS_RESULTADO[s.resultado as ResultadoSessao]}
                      </span>
                    )}
                  </div>
                </div>
                {s.status === "finalizado" && (
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => handleBaixarDocx(s.id)}
                      disabled={baixandoDocx === s.id}
                    >
                      {baixandoDocx === s.id && <Spinner />}
                      Word
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => handleBaixar(s.id)}
                      disabled={baixando === s.id}
                    >
                      {baixando === s.id && <Spinner />}
                      PDF
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
