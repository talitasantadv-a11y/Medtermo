import { ReactNode } from "react";

const CORES = {
  neutro: "bg-neutral-100 text-neutral-700",
  azul: "bg-blue-100 text-blue-700",
  verde: "bg-emerald-100 text-emerald-700",
  amarelo: "bg-amber-100 text-amber-700",
  vermelho: "bg-red-100 text-red-700",
} as const;

export function Badge({ children, cor = "neutro" }: { children: ReactNode; cor?: keyof typeof CORES }) {
  return <span className={`badge ${CORES[cor]}`}>{children}</span>;
}

export function BadgeExtraidoDoPdf() {
  return <Badge cor="azul">extraído do PDF</Badge>;
}

export function BadgeConfianca({ nivel }: { nivel: "alta" | "media" | "baixa" }) {
  const cor = nivel === "alta" ? "verde" : nivel === "media" ? "amarelo" : "vermelho";
  const texto = nivel === "alta" ? "confiança alta" : nivel === "media" ? "confiança média" : "confiança baixa";
  return <Badge cor={cor}>{texto}</Badge>;
}

export function BadgeStatusSessao({ status }: { status: string }) {
  const map: Record<string, { texto: string; cor: keyof typeof CORES }> = {
    pendente: { texto: "Pendente", cor: "amarelo" },
    em_andamento: { texto: "Em andamento", cor: "azul" },
    finalizado: { texto: "Finalizado", cor: "verde" },
  };
  const info = map[status] || { texto: status, cor: "neutro" };
  return <Badge cor={info.cor}>{info.texto}</Badge>;
}
