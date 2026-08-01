# MediaTermo

Aplicação web fullstack para mediadores judiciais gerarem termos de sessão de
mediação/conciliação. O mediador faz upload do PDF do processo exportado do
PJe, o sistema extrai automaticamente os dados processuais, permite escolher
um modelo de termo cadastrado e gera o documento formatado, pronto para
impressão ou anexação ao PJe.

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Banco de dados:** SQLite + Prisma ORM
- **Extração de PDF:** pdf-parse, com fallback para OCR via tesseract.js
- **Geração de PDF:** Puppeteer
- **Autenticação:** JWT + bcrypt

## App desktop (Windows)

Além de rodar como app web, o MediaTermo pode ser empacotado como um
aplicativo desktop (Electron) — um `.exe` que já embute o backend, sem precisar
instalar Node.js. Veja [`desktop/README.md`](desktop/README.md) para como
buildar, ou baixe o instalador mais recente na aba
[**Releases**](../../releases) do repositório (gerado automaticamente pelo
workflow `Build Windows Desktop App`).

## Setup (comando único)

```bash
npm run setup
```

Esse comando instala as dependências de todos os workspaces, gera o Prisma
Client, roda as migrações, popula o banco com os dois modelos pré-cadastrados
("Modelo Geral 334" e "Modelo Fazenda Pública") e sobe o backend (porta 4000)
e o frontend (porta 5173).

Usuário de demonstração criado pelo seed:

- **E-mail:** `demo@mediatermo.com.br`
- **Senha:** `mediatermo123`

Depois do primeiro setup, para subir a aplicação novamente:

```bash
npm start
```

### Geração de PDF (Puppeteer)

Por padrão o Puppeteer baixa seu próprio Chromium durante o `npm install`
(usado no `npm run setup`), então a geração de PDF funciona sem configuração
adicional. Em runtime, o Chromium usado é resolvido nesta ordem:

1. `PUPPETEER_EXECUTABLE_PATH` (variável de ambiente em `server/.env`)
2. `/opt/pw-browsers/chromium` (ambientes que já têm um Chromium pré-instalado)
3. O Chromium baixado pelo próprio Puppeteer

Se preferir reaproveitar um Chrome/Chromium já instalado na sua máquina (e
pular o download), defina `PUPPETEER_EXECUTABLE_PATH` em `server/.env`
apontando para o executável.

## Estrutura

```
mediatermo/
├── client/         # React + TypeScript + Tailwind
├── server/         # Express + TypeScript
├── prisma/         # schema.prisma + seed.ts
├── uploads/         # PDFs enviados pelos mediadores
```

Veja `client/src` e `server/src` para a organização interna (components,
pages, controllers, services, etc.).

## Scripts úteis

| Comando | Descrição |
| --- | --- |
| `npm run setup` | Setup completo (install + migrate + seed + start) |
| `npm start` / `npm run dev` | Sobe backend e frontend em paralelo |
| `npm run db:migrate` | Roda as migrações do Prisma |
| `npm run db:seed` | Popula o banco com os modelos pré-cadastrados |
| `npm run db:studio` | Abre o Prisma Studio |
| `npm run build` | Build de produção do backend e do frontend |

## Fluxo principal

1. **Processo** — informe o número CNJ (com validação de dígito verificador).
   Se o processo já existir, os dados são carregados automaticamente.
2. **Dados do PDF** — envie o PDF do processo (upload com drag-and-drop) ou
   preencha manualmente. Os dados extraídos aparecem destacados para revisão.
3. **Sessão** — escolha o modelo de termo, preencha data/horário/modalidade e
   registre as presenças.
4. **Resultado** — selecione o resultado da sessão; os campos específicos
   (termos do acordo, dados bancários, motivo de reagendamento etc.) aparecem
   dinamicamente conforme o modelo.
5. **Preview e exportação** — revise o termo montado e gere o PDF final, que
   fica salvo no histórico do processo.
