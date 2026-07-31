import { BlocoFilho } from "../../types/termo";
import { BlocoFormFields } from "./BlocoFormFields";

const ROTULOS_TIPO: Record<BlocoFilho["tipo"], string> = {
  texto_fixo: "Texto fixo",
  campo_livre: "Campo livre",
  campo_customizado: "Campo customizado",
};

function criarFilhoPadrao(tipo: BlocoFilho["tipo"]): BlocoFilho {
  const id = crypto.randomUUID();
  if (tipo === "texto_fixo") return { id, tipo, conteudo: "" };
  if (tipo === "campo_livre") return { id, tipo, campo: "", label: "Novo campo", obrigatorio: false };
  return {
    id,
    tipo: "campo_customizado",
    definicao: { nome: "", label: "Novo campo customizado", tipo: "texto", obrigatorio: false },
  };
}

export function CondicionalFilhos({
  filhos,
  onChange,
}: {
  filhos: BlocoFilho[];
  onChange: (novos: BlocoFilho[]) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-neutral-300 p-3">
      <p className="text-xs font-semibold uppercase text-neutral-400">Conteúdo exibido nesta condição</p>
      {filhos.map((filho, indice) => (
        <div key={filho.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">{ROTULOS_TIPO[filho.tipo]}</span>
            <button
              type="button"
              className="text-xs text-red-500 hover:underline"
              onClick={() => onChange(filhos.filter((_, i) => i !== indice))}
            >
              remover
            </button>
          </div>
          <BlocoFormFields
            bloco={filho}
            onChange={(novo) => onChange(filhos.map((f, i) => (i === indice ? novo : f)))}
          />
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {(["texto_fixo", "campo_livre", "campo_customizado"] as const).map((tipo) => (
          <button
            key={tipo}
            type="button"
            className="btn-secondary !px-2.5 !py-1 text-xs"
            onClick={() => onChange([...filhos, criarFilhoPadrao(tipo)])}
          >
            + {ROTULOS_TIPO[tipo]}
          </button>
        ))}
      </div>
    </div>
  );
}
