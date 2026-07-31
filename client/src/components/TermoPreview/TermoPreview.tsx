import { BlocoRenderizado } from "../../types/termo";
import { formatarDataBr } from "../../utils/formatacao";

export function TermoPreview({ blocos }: { blocos: BlocoRenderizado[] }) {
  return (
    <div className="mx-auto max-w-2xl bg-white p-8 font-serif text-[13px] leading-relaxed text-neutral-900 shadow-sm ring-1 ring-neutral-200 sm:p-10">
      {blocos.map((bloco, indice) => (
        <BlocoView key={indice} bloco={bloco} />
      ))}
    </div>
  );
}

function BlocoView({ bloco }: { bloco: BlocoRenderizado }) {
  switch (bloco.tipo) {
    case "cabecalho":
      return <h1 className="mb-5 text-center text-base font-bold uppercase tracking-wide">{bloco.titulo}</h1>;

    case "dados_processo": {
      const { processo, sessao } = bloco;
      return (
        <table className="mb-4 w-full border-collapse">
          <tbody>
            <Linha label="Processo nº" valor={processo.numeroCnj} />
            <Linha label="Lotação" valor={processo.lotacao || ""} />
            <Linha label="Comarca" valor={processo.comarca || ""} />
            {(processo.classeProcessual || processo.assunto) && (
              <Linha
                label="Classe / Assunto"
                valor={`${processo.classeProcessual || ""}${
                  processo.assunto ? " — " + processo.assunto : ""
                }`}
              />
            )}
            <Linha
              label="Data / Horário"
              valor={`${formatarDataBr(sessao.dataSessao)} — ${sessao.horarioInicio}${
                sessao.horarioEncerramento ? " às " + sessao.horarioEncerramento : ""
              }`}
            />
            <Linha
              label="Local / Modalidade"
              valor={`${sessao.local || ""} (${sessao.modalidade === "virtual" ? "Virtual" : "Presencial"}${
                sessao.plataformaVirtual ? " — " + sessao.plataformaVirtual : ""
              })`}
            />
          </tbody>
        </table>
      );
    }

    case "presentes":
      return (
        <div className="mb-4">
          <h2 className="mb-2 border-b border-neutral-300 pb-1 text-[12px] font-semibold uppercase">Presentes</h2>
          <ul className="space-y-1">
            {bloco.itens.map((item) => (
              <li key={item.chave}>
                <span className="inline-block w-4">{item.presente ? "☑" : "☐"}</span>
                <strong>{item.label}</strong>
                {item.nome ? `: ${item.nome}` : ""}
              </li>
            ))}
          </ul>
        </div>
      );

    case "texto":
      return <p className="mb-3 text-justify">{bloco.conteudo}</p>;

    case "campo_livre":
      return (
        <div className="mb-3">
          <h3 className="mb-1 text-[12.5px] font-semibold">{bloco.label}</h3>
          <p className="whitespace-pre-wrap text-justify">{bloco.valor || "—"}</p>
        </div>
      );

    case "campo_customizado":
      return (
        <p className="mb-1.5">
          <strong>{bloco.label}:</strong> {bloco.valor || "—"}
        </p>
      );

    case "assinatura":
      return (
        <div className="mt-8">
          {bloco.textoFechamento && <p className="mb-8 text-justify">{bloco.textoFechamento}</p>}
          <div className="mt-12 text-center">
            <p>_________________________________________</p>
            <p className="font-semibold">{bloco.nome}</p>
            <p>{bloco.cargo}</p>
            {bloco.matricula && <p>Matrícula: {bloco.matricula}</p>}
          </div>
        </div>
      );

    default:
      return null;
  }
}

function Linha({ label, valor }: { label: string; valor: string }) {
  return (
    <tr>
      <th className="w-40 py-0.5 pr-2 text-left align-top font-semibold text-neutral-600">{label}</th>
      <td className="py-0.5">{valor}</td>
    </tr>
  );
}
