import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  blocosModeloGeral334,
  blocosModeloFazenda,
  camposCustomizadosModeloFazenda,
} from "../server/src/services/termo/modelosPadrao";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@mediatermo.com.br";
  const senha = "mediatermo123";
  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      nomeCompleto: "Talita Santos",
      email,
      senhaHash,
      registroProfissional: "CEJUSC-001/2024",
      telefone: "(11) 99999-0000",
      cargo: "Mediadora Judicial",
    },
  });

  const modeloGeralExiste = await prisma.modelo.findFirst({
    where: { usuarioId: usuario.id, nome: "Modelo Geral 334" },
  });
  if (!modeloGeralExiste) {
    await prisma.modelo.create({
      data: {
        usuarioId: usuario.id,
        nome: "Modelo Geral 334",
        descricao:
          "Termo de audiência de conciliação/mediação nos moldes do art. 334 do CPC.",
        blocos: JSON.stringify(blocosModeloGeral334()),
        camposCustomizados: JSON.stringify([]),
        ativo: true,
      },
    });
  }

  const modeloFazendaExiste = await prisma.modelo.findFirst({
    where: { usuarioId: usuario.id, nome: "Modelo Fazenda Pública" },
  });
  if (!modeloFazendaExiste) {
    await prisma.modelo.create({
      data: {
        usuarioId: usuario.id,
        nome: "Modelo Fazenda Pública",
        descricao:
          "Termo de sessão de conciliação/mediação envolvendo a Fazenda Pública, com dados de RPV.",
        blocos: JSON.stringify(blocosModeloFazenda()),
        camposCustomizados: JSON.stringify(camposCustomizadosModeloFazenda()),
        ativo: true,
      },
    });
  }

  console.log("Seed concluído.");
  console.log(`Usuário de demonstração: ${email} / senha: ${senha}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
