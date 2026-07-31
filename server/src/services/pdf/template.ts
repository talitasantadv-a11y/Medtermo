import { BlocoRenderizado } from "../termo/builder";

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragrafos(texto: string): string {
  return texto
    .split(/\n+/)
    .filter((p) => p.trim())
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
}

function renderizarBloco(bloco: BlocoRenderizado): string {
  switch (bloco.tipo) {
    case "cabecalho":
      return `<h1 class="titulo">${escapeHtml(bloco.titulo)}</h1>`;

    case "dados_processo": {
      const { processo, sessao } = bloco;
      const dataFormatada = sessao.dataSessao
        ? new Date(sessao.dataSessao).toLocaleDateString("pt-BR", { timeZone: "UTC" })
        : "";
      return `
        <table class="dados-processo">
          <tbody>
            <tr><th>Processo nº</th><td>${escapeHtml(processo.numeroCnj || "")}</td></tr>
            <tr><th>Lotação</th><td>${escapeHtml(processo.lotacao || "")}</td></tr>
            <tr><th>Comarca</th><td>${escapeHtml(processo.comarca || "")}</td></tr>
            ${
              processo.classeProcessual || processo.assunto
                ? `<tr><th>Classe / Assunto</th><td>${escapeHtml(processo.classeProcessual || "")}${
                    processo.assunto ? " — " + escapeHtml(processo.assunto) : ""
                  }</td></tr>`
                : ""
            }
            <tr><th>Data / Horário</th><td>${escapeHtml(dataFormatada)} — ${escapeHtml(
        sessao.horarioInicio || ""
      )}${sessao.horarioEncerramento ? " às " + escapeHtml(sessao.horarioEncerramento) : ""}</td></tr>
            <tr><th>Local / Modalidade</th><td>${escapeHtml(sessao.local || "")} (${escapeHtml(
        sessao.modalidade === "virtual" ? "Virtual" : "Presencial"
      )}${sessao.plataformaVirtual ? " — " + escapeHtml(sessao.plataformaVirtual) : ""})</td></tr>
          </tbody>
        </table>`;
    }

    case "presentes":
      return `
        <div class="secao">
          <h2>Presentes</h2>
          <ul class="presentes">
            ${bloco.itens
              .map(
                (item) =>
                  `<li><span class="check">${item.presente ? "☑" : "☐"}</span> <strong>${escapeHtml(
                    item.label
                  )}</strong>${item.nome ? ": " + escapeHtml(item.nome) : ""}</li>`
              )
              .join("")}
          </ul>
        </div>`;

    case "texto":
      return `<div class="texto">${paragrafos(bloco.conteudo)}</div>`;

    case "campo_livre":
      return `
        <div class="campo">
          <h3>${escapeHtml(bloco.label)}</h3>
          <div class="texto">${paragrafos(bloco.valor || "—")}</div>
        </div>`;

    case "campo_customizado":
      return `
        <div class="campo-customizado">
          <strong>${escapeHtml(bloco.label)}:</strong> ${escapeHtml(bloco.valor || "—")}
        </div>`;

    case "assinatura":
      return `
        <div class="assinatura">
          ${bloco.textoFechamento ? `<div class="texto">${paragrafos(bloco.textoFechamento)}</div>` : ""}
          <div class="linha-assinatura">
            <p>_________________________________________</p>
            <p><strong>${escapeHtml(bloco.nome)}</strong></p>
            <p>${escapeHtml(bloco.cargo)}</p>
            ${bloco.matricula ? `<p>Matrícula: ${escapeHtml(bloco.matricula)}</p>` : ""}
          </div>
        </div>`;

    default:
      return "";
  }
}

export function renderizarHtmlTermo(blocos: BlocoRenderizado[]): string {
  const corpo = blocos.map(renderizarBloco).join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 24mm 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Times New Roman", Georgia, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a1a;
  }
  .titulo {
    text-align: center;
    font-size: 15pt;
    letter-spacing: 0.5px;
    margin-bottom: 20px;
    text-transform: uppercase;
  }
  table.dados-processo {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 18px;
  }
  table.dados-processo th {
    text-align: left;
    width: 160px;
    vertical-align: top;
    padding: 3px 8px 3px 0;
    font-weight: 600;
    color: #333;
  }
  table.dados-processo td {
    padding: 3px 0;
  }
  .secao { margin-bottom: 16px; }
  .secao h2 {
    font-size: 12pt;
    text-transform: uppercase;
    border-bottom: 1px solid #999;
    padding-bottom: 2px;
    margin-bottom: 8px;
  }
  ul.presentes { list-style: none; padding: 0; margin: 0; }
  ul.presentes li { margin-bottom: 4px; }
  .check { display: inline-block; width: 16px; }
  .texto { margin-bottom: 12px; text-align: justify; }
  .texto p { margin: 0 0 10px 0; }
  .campo { margin-bottom: 14px; }
  .campo h3 { font-size: 11.5pt; margin-bottom: 4px; }
  .campo-customizado { margin-bottom: 6px; }
  .assinatura { margin-top: 36px; }
  .linha-assinatura { margin-top: 48px; text-align: center; }
  .linha-assinatura p { margin: 2px 0; }
</style>
</head>
<body>
${corpo}
</body>
</html>`;
}
