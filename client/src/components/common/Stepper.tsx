const PASSOS = [
  "Processo",
  "Dados do PDF",
  "Sessão",
  "Resultado",
  "Preview",
];

export function Stepper({ passoAtual }: { passoAtual: number }) {
  return (
    <ol className="mb-8 flex items-center gap-1 overflow-x-auto sm:gap-2">
      {PASSOS.map((titulo, indice) => {
        const numero = indice + 1;
        const ativo = numero === passoAtual;
        const concluido = numero < passoAtual;
        return (
          <li key={titulo} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  concluido
                    ? "bg-brand-700 text-white"
                    : ativo
                    ? "bg-brand-100 text-brand-800 ring-2 ring-brand-600"
                    : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {concluido ? "✓" : numero}
              </span>
              <span
                className={`hidden text-sm sm:inline ${
                  ativo ? "font-medium text-neutral-900" : "text-neutral-400"
                }`}
              >
                {titulo}
              </span>
            </div>
            {numero < PASSOS.length && <div className="h-px flex-1 bg-neutral-200" />}
          </li>
        );
      })}
    </ol>
  );
}
