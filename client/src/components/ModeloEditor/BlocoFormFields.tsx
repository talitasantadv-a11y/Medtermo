import {
  Bloco,
  BlocoFilho,
  LABELS_PRESENCA,
  ResultadoSessao,
  TipoCampoCustomizado,
  VARIAVEIS_DISPONIVEIS,
} from "../../types/termo";

const ITENS_PRESENCA_DISPONIVEIS = [
  "mediador",
  "requerente",
  "advogado_requerente",
  "requerido",
  "preposto",
  "advogado_requerido",
  "procurador",
];

const RESULTADOS: { valor: ResultadoSessao; label: string }[] = [
  { valor: "acordo_total", label: "Acordo Total" },
  { valor: "acordo_parcial", label: "Acordo Parcial" },
  { valor: "sem_acordo", label: "Sem Acordo" },
  { valor: "reagendamento", label: "Reagendamento" },
  { valor: "ausencia_requerente", label: "Ausência Requerente" },
  { valor: "ausencia_requerido", label: "Ausência Requerido" },
];

function VariaveisDisponiveis() {
  return (
    <p className="mt-1.5 text-xs text-neutral-400">
      Variáveis:{" "}
      {VARIAVEIS_DISPONIVEIS.map((v) => (
        <code key={v} className="mr-1 rounded bg-neutral-100 px-1 py-0.5">{`{${v}}`}</code>
      ))}
    </p>
  );
}

export function BlocoFormFields({
  bloco,
  onChange,
}: {
  bloco: Bloco | BlocoFilho;
  onChange: (novo: any) => void;
}) {
  switch (bloco.tipo) {
    case "cabecalho":
      return (
        <div>
          <label className="label">Título do termo</label>
          <input
            className="input"
            value={bloco.titulo}
            onChange={(e) => onChange({ ...bloco, titulo: e.target.value })}
          />
        </div>
      );

    case "dados_processo":
      return (
        <label className="flex items-center gap-2 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={!!bloco.mostrarClasseAssunto}
            onChange={(e) => onChange({ ...bloco, mostrarClasseAssunto: e.target.checked })}
          />
          Exibir classe processual e assunto
        </label>
      );

    case "presentes":
      return (
        <div>
          <label className="label">Itens da lista de presença</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ITENS_PRESENCA_DISPONIVEIS.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={bloco.itens.includes(item)}
                  onChange={(e) => {
                    const novosItens = e.target.checked
                      ? [...bloco.itens, item]
                      : bloco.itens.filter((i) => i !== item);
                    onChange({ ...bloco, itens: novosItens });
                  }}
                />
                {LABELS_PRESENCA[item] || item}
              </label>
            ))}
          </div>
        </div>
      );

    case "texto_fixo":
      return (
        <div>
          <label className="label">Conteúdo</label>
          <textarea
            className="input min-h-[100px]"
            value={bloco.conteudo}
            onChange={(e) => onChange({ ...bloco, conteudo: e.target.value })}
          />
          <VariaveisDisponiveis />
        </div>
      );

    case "campo_livre":
      return (
        <div className="space-y-3">
          <div>
            <label className="label">Rótulo do campo</label>
            <input className="input" value={bloco.label} onChange={(e) => onChange({ ...bloco, label: e.target.value })} />
          </div>
          <div>
            <label className="label">Chave do campo (usada nos dados da sessão)</label>
            <input
              className="input font-mono text-xs"
              value={bloco.campo}
              onChange={(e) => onChange({ ...bloco, campo: e.target.value })}
              placeholder="ex: termos_acordo"
            />
          </div>
          <div>
            <label className="label">Placeholder</label>
            <input
              className="input"
              value={bloco.placeholder || ""}
              onChange={(e) => onChange({ ...bloco, placeholder: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={!!bloco.obrigatorio}
              onChange={(e) => onChange({ ...bloco, obrigatorio: e.target.checked })}
            />
            Obrigatório
          </label>
        </div>
      );

    case "campo_customizado":
      return (
        <div className="space-y-3">
          <div>
            <label className="label">Rótulo</label>
            <input
              className="input"
              value={bloco.definicao.label}
              onChange={(e) => onChange({ ...bloco, definicao: { ...bloco.definicao, label: e.target.value } })}
            />
          </div>
          <div>
            <label className="label">Chave (nome interno)</label>
            <input
              className="input font-mono text-xs"
              value={bloco.definicao.nome}
              onChange={(e) => onChange({ ...bloco, definicao: { ...bloco.definicao, nome: e.target.value } })}
              placeholder="ex: valor_rpv"
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={bloco.definicao.tipo}
              onChange={(e) =>
                onChange({
                  ...bloco,
                  definicao: { ...bloco.definicao, tipo: e.target.value as TipoCampoCustomizado },
                })
              }
            >
              <option value="texto">Texto</option>
              <option value="monetario">Monetário</option>
              <option value="data">Data</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={bloco.definicao.obrigatorio}
              onChange={(e) => onChange({ ...bloco, definicao: { ...bloco.definicao, obrigatorio: e.target.checked } })}
            />
            Obrigatório
          </label>
        </div>
      );

    case "assinatura":
      return (
        <div className="space-y-3">
          <div>
            <label className="label">Texto de fechamento</label>
            <textarea
              className="input min-h-[80px]"
              value={bloco.textoFechamento || ""}
              onChange={(e) => onChange({ ...bloco, textoFechamento: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={!!bloco.mostrarMatricula}
              onChange={(e) => onChange({ ...bloco, mostrarMatricula: e.target.checked })}
            />
            Exibir matrícula do mediador
          </label>
        </div>
      );

    case "condicional":
      return (
        <div>
          <label className="label">Exibir quando o resultado for</label>
          <div className="grid grid-cols-2 gap-1.5">
            {RESULTADOS.map((r) => (
              <label key={r.valor} className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={bloco.condicao.valores.includes(r.valor)}
                  onChange={(e) => {
                    const novosValores = e.target.checked
                      ? [...bloco.condicao.valores, r.valor]
                      : bloco.condicao.valores.filter((v) => v !== r.valor);
                    onChange({ ...bloco, condicao: { ...bloco.condicao, valores: novosValores } });
                  }}
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}
