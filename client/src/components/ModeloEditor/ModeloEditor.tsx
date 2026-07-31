import { useMemo, useState } from "react";
import { Modelo } from "../../types";
import { Bloco, ResultadoSessao, TipoBloco } from "../../types/termo";
import { BlocoFormFields } from "./BlocoFormFields";
import { CondicionalFilhos } from "./CondicionalFilhos";
import { TermoPreview } from "../TermoPreview/TermoPreview";
import { DADOS_EXEMPLO_PADRAO, montarTermoPreview } from "../../utils/montarTermoPreview";
import { Spinner } from "../common/Spinner";

const TIPOS_ADICIONAVEIS: { tipo: TipoBloco; label: string }[] = [
  { tipo: "cabecalho", label: "Cabeçalho" },
  { tipo: "dados_processo", label: "Dados do Processo" },
  { tipo: "presentes", label: "Presentes" },
  { tipo: "texto_fixo", label: "Texto Fixo" },
  { tipo: "condicional", label: "Condicional" },
  { tipo: "campo_livre", label: "Campo Livre" },
  { tipo: "campo_customizado", label: "Campo Customizado" },
  { tipo: "assinatura", label: "Assinatura" },
];

const ROTULOS_BLOCO: Record<TipoBloco, string> = {
  cabecalho: "Cabeçalho",
  dados_processo: "Dados do Processo",
  presentes: "Presentes",
  texto_fixo: "Texto Fixo",
  condicional: "Condicional",
  campo_livre: "Campo Livre",
  campo_customizado: "Campo Customizado",
  assinatura: "Assinatura",
};

function resumoBloco(bloco: Bloco): string {
  switch (bloco.tipo) {
    case "cabecalho":
      return bloco.titulo || "(sem título)";
    case "texto_fixo":
      return bloco.conteudo.slice(0, 60) || "(vazio)";
    case "campo_livre":
      return bloco.label;
    case "campo_customizado":
      return bloco.definicao.label;
    case "condicional":
      return bloco.condicao.valores.join(", ") || "(nenhuma condição)";
    case "presentes":
      return `${bloco.itens.length} item(ns)`;
    default:
      return "";
  }
}

function criarBlocoPadrao(tipo: TipoBloco): Bloco {
  const id = crypto.randomUUID();
  switch (tipo) {
    case "cabecalho":
      return { id, tipo, titulo: "TERMO DE SESSÃO" };
    case "dados_processo":
      return { id, tipo, mostrarClasseAssunto: true };
    case "presentes":
      return { id, tipo, itens: ["mediador", "requerente", "requerido"] };
    case "texto_fixo":
      return { id, tipo, conteudo: "" };
    case "condicional":
      return { id, tipo, condicao: { campo: "resultado", valores: [] }, blocos: [] };
    case "campo_livre":
      return { id, tipo, campo: "", label: "Novo campo", obrigatorio: false };
    case "campo_customizado":
      return {
        id,
        tipo,
        definicao: { nome: "", label: "Novo campo customizado", tipo: "texto", obrigatorio: false },
      };
    case "assinatura":
      return { id, tipo, textoFechamento: "", mostrarMatricula: true };
  }
}

export interface ModeloEditorPayload {
  nome: string;
  descricao: string;
  blocos: Bloco[];
  ativo: boolean;
}

export function ModeloEditor({
  modeloInicial,
  salvando,
  onSalvar,
  onCancelar,
}: {
  modeloInicial: Modelo | null;
  salvando: boolean;
  onSalvar: (payload: ModeloEditorPayload) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(modeloInicial?.nome || "");
  const [descricao, setDescricao] = useState(modeloInicial?.descricao || "");
  const [ativo, setAtivo] = useState(modeloInicial?.ativo ?? true);
  const [blocos, setBlocos] = useState<Bloco[]>(modeloInicial?.blocos || []);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [arrastandoIndice, setArrastandoIndice] = useState<number | null>(null);
  const [resultadoExemplo, setResultadoExemplo] = useState<ResultadoSessao>("acordo_total");

  const preview = useMemo(
    () => montarTermoPreview(blocos, { ...DADOS_EXEMPLO_PADRAO, resultado: resultadoExemplo }),
    [blocos, resultadoExemplo]
  );

  function atualizarBloco(indice: number, novo: Bloco) {
    setBlocos((atual) => atual.map((b, i) => (i === indice ? novo : b)));
  }

  function removerBloco(indice: number) {
    setBlocos((atual) => atual.filter((_, i) => i !== indice));
  }

  function adicionarBloco(tipo: TipoBloco) {
    const novo = criarBlocoPadrao(tipo);
    setBlocos((atual) => [...atual, novo]);
    setExpandidoId(novo.id);
  }

  function moverBloco(origem: number, destino: number) {
    setBlocos((atual) => {
      const copia = [...atual];
      const [removido] = copia.splice(origem, 1);
      copia.splice(destino, 0, removido);
      return copia;
    });
  }

  function handleSalvar() {
    onSalvar({ nome, descricao, blocos, ativo });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card space-y-3">
          <div>
            <label className="label">Nome do modelo</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
            Modelo ativo (disponível para uso em novas sessões)
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-700">Blocos do termo</p>
          <div className="space-y-2">
            {blocos.map((bloco, indice) => {
              const expandido = expandidoId === bloco.id;
              return (
                <div
                  key={bloco.id}
                  draggable
                  onDragStart={() => setArrastandoIndice(indice)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (arrastandoIndice !== null && arrastandoIndice !== indice) {
                      moverBloco(arrastandoIndice, indice);
                    }
                    setArrastandoIndice(null);
                  }}
                  className={`card cursor-move transition-shadow ${arrastandoIndice === indice ? "opacity-50" : ""}`}
                >
                  <div
                    className="flex items-center justify-between gap-2"
                    onClick={() => setExpandidoId(expandido ? null : bloco.id)}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-neutral-300">⠿⠿</span>
                      <span className="badge bg-brand-50 text-brand-700">{ROTULOS_BLOCO[bloco.tipo]}</span>
                      <span className="truncate text-sm text-neutral-600">{resumoBloco(bloco)}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="text-neutral-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removerBloco(indice);
                        }}
                      >
                        ✕
                      </button>
                      <span className="text-neutral-400">{expandido ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {expandido && (
                    <div className="mt-3 border-t border-neutral-100 pt-3" onClick={(e) => e.stopPropagation()}>
                      <BlocoFormFields bloco={bloco} onChange={(novo) => atualizarBloco(indice, novo)} />
                      {bloco.tipo === "condicional" && (
                        <div className="mt-3">
                          <CondicionalFilhos
                            filhos={bloco.blocos}
                            onChange={(novosFilhos) =>
                              atualizarBloco(indice, { ...bloco, blocos: novosFilhos })
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {blocos.length === 0 && (
              <p className="card text-center text-sm text-neutral-400">Nenhum bloco adicionado ainda.</p>
            )}
          </div>
        </div>

        <div className="card">
          <p className="mb-2 text-sm font-semibold text-neutral-700">Adicionar bloco</p>
          <div className="flex flex-wrap gap-2">
            {TIPOS_ADICIONAVEIS.map((t) => (
              <button
                key={t.tipo}
                type="button"
                className="btn-secondary !px-2.5 !py-1.5 text-xs"
                onClick={() => adicionarBloco(t.tipo)}
              >
                + {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" onClick={handleSalvar} disabled={salvando || !nome}>
            {salvando && <Spinner />}
            Salvar modelo
          </button>
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-700">Preview em tempo real</p>
          <select
            className="input !w-auto !py-1.5 text-xs"
            value={resultadoExemplo}
            onChange={(e) => setResultadoExemplo(e.target.value as ResultadoSessao)}
          >
            <option value="acordo_total">Simular: Acordo Total</option>
            <option value="acordo_parcial">Simular: Acordo Parcial</option>
            <option value="sem_acordo">Simular: Sem Acordo</option>
            <option value="reagendamento">Simular: Reagendamento</option>
            <option value="ausencia_requerente">Simular: Ausência Requerente</option>
            <option value="ausencia_requerido">Simular: Ausência Requerido</option>
          </select>
        </div>
        <div className="max-h-[80vh] overflow-y-auto rounded-lg bg-neutral-100 p-4">
          <TermoPreview blocos={preview} />
        </div>
      </div>
    </div>
  );
}
