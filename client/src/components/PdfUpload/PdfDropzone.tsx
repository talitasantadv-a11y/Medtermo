import { DragEvent, useRef, useState } from "react";
import toast from "react-hot-toast";
import { UploadProcesso } from "../../types";
import { enviarUploadPdf, removerUpload } from "../../services/processoService";
import { mensagemErro } from "../../services/api";
import { Spinner } from "../common/Spinner";

const TAMANHO_MAXIMO = 10 * 1024 * 1024;
const MAX_ARQUIVOS = 5;

interface Props {
  processoId: number;
  uploads: UploadProcesso[];
  onUploadsAlterados: () => void;
}

export function PdfDropzone({ processoId, uploads, onUploadsAlterados }: Props) {
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [nomeAtual, setNomeAtual] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function processarArquivo(arquivo: File) {
    if (!arquivo.name.toLowerCase().endsWith(".pdf") || arquivo.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      toast.error("O arquivo excede o limite de 10MB.");
      return;
    }
    if (uploads.length >= MAX_ARQUIVOS) {
      toast.error(`Limite de ${MAX_ARQUIVOS} arquivos por processo atingido.`);
      return;
    }

    setEnviando(true);
    setNomeAtual(arquivo.name);
    setProgresso(0);
    try {
      await enviarUploadPdf(processoId, arquivo, setProgresso);
      toast.success(`"${arquivo.name}" processado com sucesso.`);
      onUploadsAlterados();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    } finally {
      setEnviando(false);
      setProgresso(0);
      setNomeAtual("");
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setArrastando(false);
    const arquivo = e.dataTransfer.files?.[0];
    if (arquivo) processarArquivo(arquivo);
  }

  async function handleRemover(uploadId: number) {
    try {
      await removerUpload(processoId, uploadId);
      onUploadsAlterados();
    } catch (erro) {
      toast.error(mensagemErro(erro));
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          arrastando ? "border-brand-500 bg-brand-50" : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) processarArquivo(arquivo);
            e.target.value = "";
          }}
        />
        <svg className="mb-2 h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9m0 0-3 3m3-3 3 3M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
        </svg>
        <p className="text-sm font-medium text-neutral-700">
          Arraste o PDF do processo aqui ou clique para selecionar
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          PDF exportado do PJe (capa, despacho, procuração...) — até 10MB, máx. {MAX_ARQUIVOS} arquivos
        </p>
      </div>

      {enviando && (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-neutral-600">
            <span className="flex items-center gap-1.5">
              <Spinner tamanho={12} /> Processando "{nomeAtual}"...
            </span>
            <span>{progresso}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {uploads.length > 0 && (
        <ul className="mt-3 space-y-2">
          {uploads.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-neutral-400">📄</span>
                <span className="truncate">{u.arquivoNome}</span>
                {u.status === "extraido" && (
                  <span className="badge bg-emerald-100 text-emerald-700">extraído</span>
                )}
                {u.status === "processando" && (
                  <span className="badge bg-amber-100 text-amber-700">processando</span>
                )}
                {u.status === "erro" && <span className="badge bg-red-100 text-red-700">erro</span>}
              </div>
              <button
                onClick={() => handleRemover(u.id)}
                className="ml-2 shrink-0 text-neutral-400 hover:text-red-600"
                title="Remover arquivo"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
