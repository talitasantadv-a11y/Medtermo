import { useEffect, useState } from "react";
import { DadosExtraidosProcesso, Parte } from "../../types";
import { BadgeConfianca, BadgeExtraidoDoPdf } from "../common/Badge";
import { aplicarMascaraCpf, validarCpf } from "../../utils/cpf";

interface CampoEstado {
  valor: string;
  extraido: boolean;
  confianca?: "alta" | "media" | "baixa";
}

interface ParteEstado extends CampoEstado {
  polo: "requerente" | "requerido";
  cpf: string;
  cpfExtraido: boolean;
  advogadoNome: string;
  advogadoOab: string;
  isPreposto: boolean;
}

function campoVazio(): CampoEstado {
  return { valor: "", extraido: false };
}

export interface ProcessoRevisado {
  lotacao: string;
  comarca: string;
  classeProcessual: string;
  assunto: string;
  partes: Parte[];
}

interface Props {
  dadosExtraidos: DadosExtraidosProcesso | null;
  partesIniciais?: Parte[];
  onDadosValidados: (dados: ProcessoRevisado, valido: boolean) => void;
}

export function RevisaoDados({ dadosExtraidos, partesIniciais, onDadosValidados }: Props) {
  const [lotacao, setLotacao] = useState<CampoEstado>(campoVazio());
  const [comarca, setComarca] = useState<CampoEstado>(campoVazio());
  const [classeProcessual, setClasseProcessual] = useState<CampoEstado>(campoVazio());
  const [assunto, setAssunto] = useState<CampoEstado>(campoVazio());
  const [partes, setPartes] = useState<ParteEstado[]>([]);

  useEffect(() => {
    if (partesIniciais && partesIniciais.length > 0) {
      setPartes(
        partesIniciais.map((p) => ({
          polo: p.polo,
          valor: p.nomeCompleto,
          cpf: p.cpf || "",
          advogadoNome: p.advogadoNome || "",
          advogadoOab: p.advogadoOab || "",
          isPreposto: p.isPreposto || false,
          extraido: false,
          cpfExtraido: false,
        }))
      );
      return;
    }

    if (dadosExtraidos) {
      if (dadosExtraidos.lotacao)
        setLotacao({ valor: dadosExtraidos.lotacao.valor, extraido: true, confianca: dadosExtraidos.lotacao.confianca });
      if (dadosExtraidos.comarca)
        setComarca({ valor: dadosExtraidos.comarca.valor, extraido: true, confianca: dadosExtraidos.comarca.confianca });
      if (dadosExtraidos.classeProcessual)
        setClasseProcessual({
          valor: dadosExtraidos.classeProcessual.valor,
          extraido: true,
          confianca: dadosExtraidos.classeProcessual.confianca,
        });
      if (dadosExtraidos.assunto)
        setAssunto({ valor: dadosExtraidos.assunto.valor, extraido: true, confianca: dadosExtraidos.assunto.confianca });

      if (dadosExtraidos.partes.length > 0) {
        setPartes(
          dadosExtraidos.partes.map((p) => ({
            polo: p.polo,
            valor: p.nomeCompleto,
            cpf: p.cpf || "",
            advogadoNome: p.advogadoNome || "",
            advogadoOab: p.advogadoOab || "",
            isPreposto: false,
            extraido: true,
            cpfExtraido: !!p.cpf,
            confianca: p.confianca,
          }))
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosExtraidos, partesIniciais]);

  useEffect(() => {
    const temRequerente = partes.some((p) => p.polo === "requerente" && p.valor.trim());
    const temRequerido = partes.some((p) => p.polo === "requerido" && p.valor.trim());
    const cpfsValidos = partes.every((p) => !p.cpf || validarCpf(p.cpf));
    const valido = temRequerente && temRequerido && cpfsValidos;

    onDadosValidados(
      {
        lotacao: lotacao.valor,
        comarca: comarca.valor,
        classeProcessual: classeProcessual.valor,
        assunto: assunto.valor,
        partes: partes.map((p) => ({
          polo: p.polo,
          nomeCompleto: p.valor,
          cpf: p.cpf || undefined,
          advogadoNome: p.advogadoNome || undefined,
          advogadoOab: p.advogadoOab || undefined,
          isPreposto: p.isPreposto,
        })),
      },
      valido
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotacao, comarca, classeProcessual, assunto, partes]);

  function atualizarParte(indice: number, campo: keyof ParteEstado, valor: string | boolean) {
    setPartes((atual) => atual.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)));
  }

  function adicionarParte(polo: "requerente" | "requerido") {
    setPartes((atual) => [
      ...atual,
      { polo, valor: "", cpf: "", advogadoNome: "", advogadoOab: "", isPreposto: false, extraido: false, cpfExtraido: false },
    ]);
  }

  function removerParte(indice: number) {
    setPartes((atual) => atual.filter((_, i) => i !== indice));
  }

  function campoInput(
    label: string,
    estado: CampoEstado,
    setEstado: (v: CampoEstado) => void,
    placeholderVazio: string
  ) {
    return (
      <div>
        <label className="label flex items-center gap-2">
          {label}
          {estado.extraido && <BadgeExtraidoDoPdf />}
          {estado.confianca && <BadgeConfianca nivel={estado.confianca} />}
        </label>
        <input
          className={`input ${estado.extraido ? "input-extraido" : ""}`}
          value={estado.valor}
          placeholder={estado.extraido ? "" : placeholderVazio}
          onChange={(e) => setEstado({ ...estado, valor: e.target.value, extraido: false })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {campoInput("Lotação (Vara/CEJUSC)", lotacao, setLotacao, "não encontrado no PDF — preencha manualmente")}
        {campoInput("Comarca", comarca, setComarca, "não encontrado no PDF — preencha manualmente")}
        {campoInput("Classe processual", classeProcessual, setClasseProcessual, "não encontrado no PDF — preencha manualmente")}
        {campoInput("Assunto", assunto, setAssunto, "não encontrado no PDF — preencha manualmente")}
      </div>

      {(["requerente", "requerido"] as const).map((polo) => (
        <div key={polo}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase text-neutral-500">
              Parte {polo === "requerente" ? "Requerente" : "Requerida"}
            </h3>
            <button
              type="button"
              className="text-xs font-medium text-brand-700 hover:underline"
              onClick={() => adicionarParte(polo)}
            >
              + adicionar
            </button>
          </div>
          <div className="space-y-3">
            {partes
              .map((p, indice) => ({ p, indice }))
              .filter(({ p }) => p.polo === polo)
              .map(({ p, indice }) => {
                const cpfInvalido = !!p.cpf && !validarCpf(p.cpf);
                return (
                  <div key={indice} className="card space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="label flex items-center gap-2">
                          Nome completo
                          {p.extraido && <BadgeExtraidoDoPdf />}
                        </label>
                        <input
                          className={`input ${p.extraido ? "input-extraido" : ""}`}
                          value={p.valor}
                          placeholder="não encontrado no PDF — preencha manualmente"
                          onChange={(e) => atualizarParte(indice, "valor", e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removerParte(indice)}
                        className="mt-6 text-neutral-400 hover:text-red-600"
                        title="Remover parte"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label flex items-center gap-2">
                          CPF
                          {p.cpfExtraido && <BadgeExtraidoDoPdf />}
                        </label>
                        <input
                          className={`input ${p.cpfExtraido ? "input-extraido" : ""} ${
                            cpfInvalido ? "!border-red-400 !bg-red-50" : ""
                          }`}
                          value={p.cpf}
                          placeholder="não encontrado no PDF — preencha manualmente"
                          onChange={(e) => atualizarParte(indice, "cpf", aplicarMascaraCpf(e.target.value))}
                        />
                        {cpfInvalido && (
                          <p className="mt-1 text-xs text-red-600">CPF inválido. Verifique os dígitos.</p>
                        )}
                      </div>
                      {polo === "requerido" && (
                        <div className="flex items-end pb-2.5">
                          <label className="flex items-center gap-2 text-sm text-neutral-600">
                            <input
                              type="checkbox"
                              checked={p.isPreposto}
                              onChange={(e) => atualizarParte(indice, "isPreposto", e.target.checked)}
                            />
                            É preposto(a)
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Advogado(a)</label>
                        <input
                          className={`input ${p.extraido && p.advogadoNome ? "input-extraido" : ""}`}
                          value={p.advogadoNome}
                          placeholder="não encontrado no PDF — preencha manualmente"
                          onChange={(e) => atualizarParte(indice, "advogadoNome", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">OAB</label>
                        <input
                          className={`input ${p.extraido && p.advogadoOab ? "input-extraido" : ""}`}
                          value={p.advogadoOab}
                          placeholder="não encontrado no PDF — preencha manualmente"
                          onChange={(e) => atualizarParte(indice, "advogadoOab", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            {partes.filter((p) => p.polo === polo).length === 0 && (
              <p className="text-sm text-neutral-400">Nenhuma parte adicionada.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
