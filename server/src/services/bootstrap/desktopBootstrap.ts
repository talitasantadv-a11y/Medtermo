import fs from "fs";
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
 * motor de migração do Prisma). Em vez disso, na primeira execução aplicamos
 * o SQL da migração inicial diretamente via `$executeRawUnsafe` e, a partir
 * daí, o Prisma Client cuida de toda leitura/escrita normalmente.
 */
export async function bootstrapBancoDeDados(migrationSqlPath: string): Promise<void> {
  const jaExiste = await tabelaExiste("usuarios");
  if (jaExiste) return;

  if (!fs.existsSync(migrationSqlPath)) {
    throw new Error(`Arquivo de migração não encontrado: ${migrationSqlPath}`);
  }

  const sql = fs.readFileSync(migrationSqlPath, "utf-8");
  // Remove linhas de comentário (ex: "-- CreateTable") antes de dividir em
  // statements — cada statement gerado pelo Prisma vem precedido de um
  // comentário, então filtrar por "começa com --" descartaria tudo.
  const semComentarios = sql
    .split("\n")
    .filter((linha) => !linha.trim().startsWith("--"))
    .join("\n");
  const statements = semComentarios
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

async function tabelaExiste(nome: string): Promise<boolean> {
  try {
    const resultado = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      nome
    );
    return resultado.length > 0;
  } catch {
    return false;
  }
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
