import fs from "fs";

/**
 * Gera o PDF do termo a partir do HTML montado.
 *
 * - Fora do Electron (modo web): usa Puppeteer com um Chromium real.
 * - Dentro do Electron (app desktop): usa `webContents.printToPDF`, que
 *   reaproveita o Chromium já embutido no próprio Electron, evitando ter que
 *   empacotar um Chromium extra só para o Puppeteer no instalador.
 */
export async function gerarPdfDeHtml(html: string): Promise<Buffer> {
  if (process.versions.electron) {
    return gerarPdfViaElectron(html);
  }
  return gerarPdfViaPuppeteer(html);
}

async function gerarPdfViaElectron(html: string): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { BrowserWindow } = require("electron");

  const janela = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true },
  });

  try {
    await janela.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    const pdf = await janela.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      margins: { marginType: "none" },
    });
    return Buffer.from(pdf);
  } finally {
    janela.destroy();
  }
}

function resolverExecutablePathPuppeteer(puppeteer: typeof import("puppeteer")): string | undefined {
  const doEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (doEnv && fs.existsSync(doEnv)) return doEnv;

  const candidato = "/opt/pw-browsers/chromium";
  if (fs.existsSync(candidato)) return candidato;

  try {
    const padrao = puppeteer.executablePath();
    if (padrao && fs.existsSync(padrao)) return padrao;
  } catch {
    // ignora — puppeteer decide em runtime
  }
  return undefined;
}

async function gerarPdfViaPuppeteer(html: string): Promise<Buffer> {
  const puppeteer = await import("puppeteer");

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolverExecutablePathPuppeteer(puppeteer),
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "24mm", bottom: "24mm", left: "20mm", right: "20mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
