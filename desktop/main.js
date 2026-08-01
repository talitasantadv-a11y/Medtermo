const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app, BrowserWindow, dialog } = require("electron");

const PORTA_PREFERIDA = 4899;

// Evita problemas de renderização em VMs, sessões remotas (RDP) e drivers de
// GPU antigos/incompatíveis — comum em máquinas corporativas. Aplicativo de
// formulário/documento não depende de aceleração gráfica.
app.disableHardwareAcceleration();

function caminhoDoBundle() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app-bundle")
    : path.join(__dirname, "app-bundle");
}

function obterOuCriarSegredo(userDataDir) {
  const arquivoSegredo = path.join(userDataDir, "secret.key");
  if (fs.existsSync(arquivoSegredo)) {
    return fs.readFileSync(arquivoSegredo, "utf-8").trim();
  }
  const segredo = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(arquivoSegredo, segredo, "utf-8");
  return segredo;
}

function prepararAmbiente() {
  const userDataDir = app.getPath("userData");
  const uploadsDir = path.join(userDataDir, "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const dbPath = path.join(userDataDir, "mediatermo.db").split(path.sep).join("/");

  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.UPLOAD_DIR = uploadsDir;
  process.env.JWT_SECRET = obterOuCriarSegredo(userDataDir);
  process.env.JWT_EXPIRES_IN = "30d";
  process.env.CLIENT_ORIGIN = "*";
}

async function iniciar() {
  prepararAmbiente();

  const bundleRoot = caminhoDoBundle();
  const { iniciarAppDesktop } = require(path.join(bundleRoot, "server", "dist", "desktop.js"));

  const { port } = await iniciarAppDesktop({
    port: PORTA_PREFERIDA,
    clientDistPath: path.join(bundleRoot, "client", "dist"),
    migrationSqlPath: path.join(bundleRoot, "prisma", "migration.sql"),
  });

  const janela = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "MediaTermo",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await janela.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(() => {
  iniciar().catch((erro) => {
    console.error(erro);
    dialog.showErrorBox(
      "MediaTermo — erro ao iniciar",
      `Não foi possível iniciar o aplicativo.\n\n${erro.message || erro}`
    );
    app.quit();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
