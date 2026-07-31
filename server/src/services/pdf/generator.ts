import fs from "fs";
import puppeteer from "puppeteer";

function resolverExecutablePath(): string | undefined {
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

export async function gerarPdfDeHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolverExecutablePath(),
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
