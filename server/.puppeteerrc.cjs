// Por padrão, deixa o puppeteer baixar seu próprio Chromium durante `npm install`
// (necessário para rodar localmente em máquinas sem um Chromium pré-instalado).
// Em ambientes que já possuem um Chromium pronto, defina PUPPETEER_EXECUTABLE_PATH
// em server/.env para reaproveitá-lo e pular o download
// (ver a lógica de resolução em server/src/services/pdf/generator.ts).
module.exports = {};
