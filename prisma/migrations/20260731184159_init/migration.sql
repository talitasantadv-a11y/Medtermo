-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_completo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "registro_profissional" TEXT,
    "telefone" TEXT,
    "cargo" TEXT DEFAULT 'Mediador(a) Judicial',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "modelos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "blocos" TEXT NOT NULL,
    "campos_customizados" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "modelos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "processos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero_cnj" TEXT NOT NULL,
    "lotacao" TEXT,
    "comarca" TEXT,
    "classe_processual" TEXT,
    "assunto" TEXT,
    "usuario_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "processo_id" INTEGER NOT NULL,
    "polo" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "cpf" TEXT,
    "advogado_nome" TEXT,
    "advogado_oab" TEXT,
    "is_preposto" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partes_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "processos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "processo_id" INTEGER NOT NULL,
    "modelo_id" INTEGER NOT NULL,
    "data_sessao" DATETIME NOT NULL,
    "horario_inicio" TEXT NOT NULL,
    "horario_encerramento" TEXT,
    "local" TEXT,
    "modalidade" TEXT NOT NULL,
    "plataforma_virtual" TEXT,
    "presencas" TEXT,
    "resultado" TEXT,
    "termos_acordo" TEXT,
    "dados_extras" TEXT,
    "reagendamento_data" DATETIME,
    "reagendamento_motivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessoes_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "processos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sessoes_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "uploads_processo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "processo_id" INTEGER NOT NULL,
    "arquivo_nome" TEXT NOT NULL,
    "arquivo_path" TEXT NOT NULL,
    "dados_extraidos" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processando',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uploads_processo_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "processos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "processos_numero_cnj_key" ON "processos"("numero_cnj");
