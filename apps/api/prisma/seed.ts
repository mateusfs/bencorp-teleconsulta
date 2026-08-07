import { PrismaClient, UserRole, AtendimentoStatus, ClassificacaoRisco } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Senha@123';

async function upsertUser(
  email: string,
  role: UserRole,
  passwordHash: string,
): Promise<void> {
  await prisma.user.upsert({
    where: { email },
    update: { role, passwordHash, active: true },
    create: { email, role, passwordHash, active: true },
  });
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await upsertUser('admin@bencorp.local', UserRole.ADMIN, passwordHash);
  await upsertUser('enfermeiro@bencorp.local', UserRole.ENFERMEIRO, passwordHash);
  await upsertUser('medico@bencorp.local', UserRole.MEDICO, passwordHash);

  const patients = [
    {
      name: 'Ana Souza',
      cpf: '11144477735',
      contact: '11999990001',
      risk: ClassificacaoRisco.AMARELO,
    },
    {
      name: 'Bruno Lima',
      cpf: '39053344705',
      contact: '11999990002',
      risk: ClassificacaoRisco.VERDE,
    },
    {
      name: 'Carla Mendes',
      cpf: '52998224725',
      contact: '11999990003',
      risk: ClassificacaoRisco.LARANJA,
    },
  ];

  for (const p of patients) {
    const patient = await prisma.patient.upsert({
      where: { cpf: p.cpf },
      update: { name: p.name, contact: p.contact },
      create: { name: p.name, cpf: p.cpf, contact: p.contact },
    });

    const open = await prisma.atendimento.findFirst({
      where: {
        patientId: patient.id,
        status: AtendimentoStatus.AGUARDANDO,
      },
    });

    if (!open) {
      await prisma.atendimento.create({
        data: {
          patientId: patient.id,
          status: AtendimentoStatus.AGUARDANDO,
          riskClassification: p.risk,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
