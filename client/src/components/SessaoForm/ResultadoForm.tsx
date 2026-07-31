import { FormEvent, useMemo, useState } from "react";
import { Modelo, Sessao } from "../../types";
import { BlocoCondicional, LABELS_RESULTADO, ResultadoSessao } from "../../types/termo";
import { formatarMoeda } from "../../utils/formatacao";
import { Spinner } from "../common/Spinner";

interface Props {
  modelo: Modelo;
  sessao: Sessao;
  carregando?: boolean;
  onSubmit: (payload: Partial<Sessao>) => void;
}

const RESULTADOS: ResultadoSessao[] = [
  "acordo_total",
  "acordo_parcial",
  "sem_acordo",
  "reagendamento",
  "ausencia_requerente",
  "ausencia_requerido",
];

export function ResultadoForm({ modelo, sessao, carregando, onSubmit }: Props) {
  const [resultado, setResultado] = useState<ResultadoSessao | undefined>(sessao.resultado || undefined);
  const [termosAcordo, setTermosAcordo] = useState(sessao.termosAcordo || "");
  const [dadosExtras, setDadosExtras] = useState<Record<string, string>>(sessao.dadosExtras || {});
  const [reagendamentoData, setReagendamentoData] = useState(sessao.reagendamentoData?.slice(0, 10) || "");
  const [reagendamentoMotivo, setReagendamentoMotivo] = useState(sessao.reagendamentoMotivo || "");
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const blocosCondicionaisAtivos = useMemo(() => {
    if (!resultado) return [];
    return modelo.blocos.filter(
      (b): b is BlocoCondicional => b.tipo === "condicional" && b.condicao.valores.includes(resultado)
    );
  }, [modelo, resultado]);

  const exigeTermosAcordo = resultado === "acordo_total" || resultado === "acordo_parcial";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTentouEnviar(true);
    if (!resultado) return;
    if (exigeTermosAcordo && !termosAcordo.trim()) return;
    if (resultado === "reagendamento" && !reagendamentoMotivo.trim()) return;

    onSubmit({
      resultado,
      termosAcordo: exigeTermosAcordo ? termosAcordo : sessao.termosAcordo,
      dadosExtras,
      reagendamentoData: resultado === "reagendamento" ? reagendamentoData : null,
      reagendamentoMotivo: resultado === "reagendamento" ? reagendamentoMotivo : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">Resultado da sessão</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RESULTADOS.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setResultado(r)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                resultado === r
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {LABELS_RESULTADO[r]}
            </button>
          ))}
        </div>
      </div>

      {exigeTermosAcordo && (
        <div>
          <label className="label">Termos do Acordo *</label>
          <textarea
            className="input min-h-[120px]"
            value={termosAcordo}
            onChange={(e) => setTermosAcordo(e.target.value)}
            placeholder="Descreva os termos do acordo firmado entre as partes..."
          />
          {tentouEnviar && !termosAcordo.trim() && (
            <p className="mt-1 text-xs text-red-600">Os termos do acordo são obrigatórios.</p>
          )}
        </div>
      )}

      {resultado === "reagendamento" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nova data da sessão</label>
            <input
              type="date"
              className="input"
              value={reagendamentoData}
              onChange={(e) => setReagendamentoData(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Motivo do reagendamento *</label>
            <textarea
              className="input"
              value={reagendamentoMotivo}
              onChange={(e) => setReagendamentoMotivo(e.target.value)}
              placeholder="Descreva o motivo do reagendamento da sessão..."
            />
            {tentouEnviar && !reagendamentoMotivo.trim() && (
              <p className="mt-1 text-xs text-red-600">O motivo do reagendamento é obrigatório.</p>
            )}
          </div>
        </div>
      )}

      {blocosCondicionaisAtivos.map((bloco) =>
        bloco.blocos
          .filter((filho) => filho.tipo === "campo_customizado")
          .map((filho) => {
            if (filho.tipo !== "campo_customizado") return null;
            const { definicao } = filho;
            const valor = dadosExtras[definicao.nome] || "";
            const vazio = definicao.obrigatorio && !valor.trim();
            return (
              <div key={definicao.nome}>
                <label className="label">
                  {definicao.label} {definicao.obrigatorio && "*"}
                </label>
                <input
                  type={definicao.tipo === "data" ? "date" : "text"}
                  className="input"
                  value={valor}
                  placeholder={definicao.placeholder}
                  onChange={(e) => {
                    const novoValor =
                      definicao.tipo === "monetario" ? formatarMoeda(e.target.value) : e.target.value;
                    setDadosExtras((atual) => ({ ...atual, [definicao.nome]: novoValor }));
                  }}
                />
                {tentouEnviar && vazio && (
                  <p className="mt-1 text-xs text-red-600">Campo obrigatório.</p>
                )}
              </div>
            );
          })
      )}

      <button type="submit" className="btn-primary w-full" disabled={!resultado || carregando}>
        {carregando && <Spinner />}
        Continuar para o preview
      </button>
    </form>
  );
}
