# MediaTermo Desktop

Empacota o MediaTermo como um aplicativo desktop (Electron): a interface roda
numa janela nativa e o backend (Express + Prisma/SQLite) roda embutido no
mesmo processo, sem precisar instalar Node.js, abrir terminal ou configurar
nada. O banco de dados fica em `%APPDATA%/mediatermo-desktop` (Windows).

## Como funciona

- `main.js` é o processo principal do Electron. Ele:
  1. Prepara o ambiente (define `DATABASE_URL`, `UPLOAD_DIR` e um `JWT_SECRET`
     persistido em `app.getPath('userData')`);
  2. Sobe o servidor Express (`server/src/desktop.ts`), que na primeira
     execução (e a cada atualização) aplica as migrações do banco pendentes
     (a partir do SQL de cada pasta em `prisma/migrations`, registrando as já
     aplicadas) e semeia os dois modelos pré-cadastrados + usuário de
     demonstração;
  3. Abre uma janela carregando `http://127.0.0.1:4899/`, servida pelo próprio
     Express (API + arquivos estáticos do client compilado).
- A geração de **PDF** usa `webContents.printToPDF` do próprio Electron (não
  usa Puppeteer no desktop), reaproveitando o Chromium já embutido. A geração
  de **Word (.docx)** usa a biblioteca `docx` (puro JS) e funciona igual ao
  modo web, incluindo logomarca do CEJUSC no cabeçalho.
- A busca de dados no CNJ (DataJud) funciona normalmente no desktop, desde
  que a máquina tenha acesso à internet e o mediador tenha cadastrado sua
  chave da API em Perfil.
- OCR de PDFs escaneados (tesseract.js) **não está disponível** no build
  desktop, para manter o instalador enxuto e evitar uma dependência de rede em
  tempo de execução — PDFs digitais (a grande maioria dos exportados do PJe)
  continuam sendo extraídos normalmente via `pdf-parse`.

## Buildar localmente

```bash
# a partir da raiz do repositório
bash desktop/scripts/build-bundle.sh   # builda client+server e monta desktop/app-bundle/
cd desktop
npm install
npx electron-builder --win nsis portable --x64
```

Os instaladores saem em `desktop/release/`:
- `MediaTermo Setup <versão>.exe` — instalador NSIS (cria atalhos, desinstalador).
- `MediaTermo <versão>.exe` — versão portátil, executa direto sem instalar.

Buildar o alvo Windows a partir de Linux/macOS requer [Wine](https://www.winehq.org/)
instalado (`wine`, `wine64` e `wine32:i386` no Ubuntu/Debian).

## Build oficial (CI)

O workflow `.github/workflows/build-windows-desktop.yml` builda o instalador
em uma máquina Windows real (sem Wine), roda um smoke test iniciando o app
empacotado e checando `http://127.0.0.1:4899/api/health`, e publica os `.exe`
como Release do GitHub. Dispare manualmente pela aba **Actions** do repositório
("Build Windows Desktop App" → **Run workflow**) ou aguarde o push automático
na branch configurada.
