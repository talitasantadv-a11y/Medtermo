import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "../../utils/prisma";
import { paraJson } from "../../utils/json";
import {
  blocosModeloFazenda,
  blocosModeloGeral334,
  camposCustomizadosModeloFazenda,
} from "../termo/modelosPadrao";

/**
 * No app desktop não há `prisma migrate deploy` disponível (não empacotamos o
 * motor de migração do Prisma). Em vez disso, aplicamos o SQL de cada pasta
 * de migração diretamente via `$executeRawUnsafe`, registrando o nome de cada
 * uma em `_desktop_migrations` para nunca reaplicar — o que também permite
 * que futuras atualizações do app apliquem só as migrações novas.
 */
export async function bootstrapBancoDeDados(migrationsDir: string): Promise<void> {
  await garantirTabelaDeControle();

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Diretório de migrações não encontrado: ${migrationsDir}`);
  }

  const pastas = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();

  for (const pasta of pastas) {
    if (await migracaoJaAplicada(pasta)) continue;

    const arquivoSql = path.join(migrationsDir, pasta, "migration.sql");
    if (!fs.existsSync(arquivoSql)) continue;

    for (const statement of statementsDoArquivo(arquivoSql)) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (erro) {
        // Instalação vinda de uma versão anterior do app pode já ter algumas
        // dessas tabelas/colunas — trata como idempotente e segue em frente.
        const mensagem = erro instanceof Error ? erro.message : String(erro);
        if (!/already exists|duplicate column/i.test(mensagem)) throw erro;
      }
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO _desktop_migrations (nome) VALUES (?)`,
      pasta
    );
  }
}

async function garantirTabelaDeControle(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS _desktop_migrations (
      nome TEXT PRIMARY KEY,
      aplicado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

async function migracaoJaAplicada(nome: string): Promise<boolean> {
  const linhas = await prisma.$queryRawUnsafe<{ nome: string }[]>(
    `SELECT nome FROM _desktop_migrations WHERE nome = ?`,
    nome
  );
  return linhas.length > 0;
}

function statementsDoArquivo(caminho: string): string[] {
  const sql = fs.readFileSync(caminho, "utf-8");
  // Remove linhas de comentário (ex: "-- CreateTable") antes de dividir em
  // statements — cada statement gerado pelo Prisma vem precedido de um
  // comentário, então filtrar por "começa com --" descartaria tudo.
  const semComentarios = sql
    .split("\n")
    .filter((linha) => !linha.trim().startsWith("--"))
    .join("\n");
  return semComentarios
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function semearDadosIniciais(): Promise<void> {
  const totalUsuarios = await prisma.usuario.count();
  if (totalUsuarios > 0) return;

  const email = "demo@mediatermo.com.br";
  const senha = "mediatermo123";
  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nomeCompleto: "Talita Santos",
      email,
      senhaHash,
      registroProfissional: "CEJUSC-001/2024",
      telefone: "(11) 99999-0000",
      cargo: "Mediadora Judicial",
    },
  });

  await prisma.modelo.create({
    data: {
      usuarioId: usuario.id,
      nome: "Modelo Geral 334",
      descricao: "Termo de audiência de conciliação/mediação nos moldes do art. 334 do CPC.",
      blocos: paraJson(blocosModeloGeral334()),
      camposCustomizados: paraJson([]),
      ativo: true,
    },
  });
  await prisma.modelo.create({
    data: {
      usuarioId: usuario.id,
      nome: "Modelo Fazenda Pública",
      descricao:
        "Termo de sessão de conciliação/mediação envolvendo a Fazenda Pública, com dados de RPV.",
      blocos: paraJson(blocosModeloFazenda()),
      camposCustomizados: paraJson(camposCustomizadosModeloFazenda()),
      ativo: true,
    },
  });

  console.log(`Banco inicial criado. Usuário de demonstração: ${email} / senha: ${senha}`);
}
