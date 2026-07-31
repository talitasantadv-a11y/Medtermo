// Evita o download do Chromium pelo puppeteer durante `npm install`.
// O caminho do executável do Chromium é resolvido em runtime
// (ver server/src/services/pdf/generator.ts), com suporte a ambientes
// que já possuem um Chromium pré-instalado via PUPPETEER_EXECUTABLE_PATH.
module.exports = {
  skipDownload: true,
};
