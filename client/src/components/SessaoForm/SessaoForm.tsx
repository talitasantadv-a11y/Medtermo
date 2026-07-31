import { FormEvent, useMemo, useState } from "react";
import { Modelo, Parte } from "../../types";
import { LABELS_PRESENCA } from "../../types/termo";
import { Spinner } from "../common/Spinner";

interface Props {
  modelos: Modelo[];
  partes: Parte[];
  valoresIniciais?: {
    modeloId?: number;
    dataSessao?: string;
    horarioInicio?: string;
    horarioEncerramento?: string;
    local?: string;
    modalidade?: "presencial" | "virtual";
    plataformaVirtual?: string;
    presencas?: Record<string, boolean>;
  };
  carregando?: boolean;
  onSubmit: (payload: {
    modeloId: number;
    dataSessao: string;
    horarioInicio: string;
    horarioEncerramento?: string;
    local?: string;
    modalidade: "presencial" | "virtual";
    plataformaVirtual?: string;
    presencas: Record<string, boolean>;
  }) => void;
}

function nomeParaItem(item: string, partes: Parte[]): string {
  if (item === "requerente") return partes.filter((p) => p.polo === "requerente").map((p) => p.nomeCompleto).join(", ");
  if (item === "requerido") return partes.filter((p) => p.polo === "requerido").map((p) => p.nomeCompleto).join(", ");
  if (item === "advogado_requerente")
    return partes.find((p) => p.polo === "requerente" && p.advogadoNome)?.advogadoNome || "";
  if (item === "advogado_requerido" || item === "procurador")
    return partes.find((p) => p.polo === "requerido" && p.advogadoNome)?.advogadoNome || "";
  if (item === "preposto") return partes.find((p) => p.polo === "requerido" && p.isPreposto)?.nomeCompleto || "";
  return "";
}

export function SessaoForm({ modelos, partes, valoresIniciais, carregando, onSubmit }: Props) {
  const [modeloId, setModeloId] = useState<number | undefined>(valoresIniciais?.modeloId);
  const [dataSessao, setDataSessao] = useState(valoresIniciais?.dataSessao || "");
  const [horarioInicio, setHorarioInicio] = useState(valoresIniciais?.horarioInicio || "");
  const [horarioEncerramento, setHorarioEncerramento] = useState(valoresIniciais?.horarioEncerramento || "");
  const [local, setLocal] = useState(valoresIniciais?.local || "");
  const [modalidade, setModalidade] = useState<"presencial" | "virtual">(valoresIniciais?.modalidade || "virtual");
  const [plataformaVirtual, setPlataformaVirtual] = useState(valoresIniciais?.plataformaVirtual || "Microsoft Teams");
  const [presencas, setPresencas] = useState<Record<string, boolean>>(valoresIniciais?.presencas || {});

  const modeloSelecionado = useMemo(() => modelos.find((m) => m.id === modeloId), [modelos, modeloId]);
  const blocoPresentes = useMemo(
    () => modeloSelecionado?.blocos.find((b) => b.tipo === "presentes") as { itens: string[] } | undefined,
    [modeloSelecionado]
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!modeloId) return;
    onSubmit({
      modeloId,
      dataSessao,
      horarioInicio,
      horarioEncerramento: horarioEncerramento || undefined,
      local: local || undefined,
      modalidade,
      plataformaVirtual: modalidade === "virtual" ? plataformaVirtual : undefined,
      presencas,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">Modelo de termo</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {modelos.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setModeloId(m.id)}
              className={`card text-left transition-colors ${
                modeloId === m.id ? "border-brand-600 ring-2 ring-brand-100" : "hover:border-neutral-300"
              }`}
            >
              <p className="font-medium text-neutral-800">{m.nome}</p>
              {m.descricao && <p className="mt-1 text-xs text-neutral-500">{m.descricao}</p>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Data da sessão</label>
          <input type="date" className="input" value={dataSessao} onChange={(e) => setDataSessao(e.target.value)} required />
        </div>
        <div>
          <label className="label">Horário de início</label>
          <input type="time" className="input" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} required />
        </div>
        <div>
          <label className="label">Horário de encerramento</label>
          <input
            type="time"
            className="input"
            value={horarioEncerramento}
            onChange={(e) => setHorarioEncerramento(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Modalidade</label>
          <select
            className="input"
            value={modalidade}
            onChange={(e) => setModalidade(e.target.value as "presencial" | "virtual")}
          >
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
          </select>
        </div>
        {modalidade === "virtual" ? (
          <div>
            <label className="label">Plataforma virtual</label>
            <input className="input" value={plataformaVirtual} onChange={(e) => setPlataformaVirtual(e.target.value)} />
          </div>
        ) : (
          <div>
            <label className="label">Local</label>
            <input className="input" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Sala / CEJUSC" />
          </div>
        )}
      </div>

      {blocoPresentes && (
        <div>
          <label className="label">Registro de presenças</label>
          <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
            {blocoPresentes.itens.map((item) => (
              <label key={item} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={presencas[item] ?? false}
                    onChange={(e) => setPresencas((atual) => ({ ...atual, [item]: e.target.checked }))}
                  />
                  {LABELS_PRESENCA[item] || item}
                </span>
                <span className="truncate text-xs text-neutral-400">{nomeParaItem(item, partes)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button type="submit" className="btn-primary w-full" disabled={!modeloId || carregando}>
        {carregando && <Spinner />}
        Continuar
      </button>
    </form>
  );
}
