-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "datajud_api_key" TEXT;

-- CreateTable
CREATE TABLE "cejuscs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "logo_path" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cejuscs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_modelos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "cejusc_id" INTEGER,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "blocos" TEXT NOT NULL,
    "campos_customizados" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "modelos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "modelos_cejusc_id_fkey" FOREIGN KEY ("cejusc_id") REFERENCES "cejuscs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_modelos" ("ativo", "blocos", "campos_customizados", "created_at", "descricao", "id", "nome", "updated_at", "usuario_id") SELECT "ativo", "blocos", "campos_customizados", "created_at", "descricao", "id", "nome", "updated_at", "usuario_id" FROM "modelos";
DROP TABLE "modelos";
ALTER TABLE "new_modelos" RENAME TO "modelos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
