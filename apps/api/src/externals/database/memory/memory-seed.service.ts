import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AtendimentoStatus, ClassificacaoRisco } from '@/entities/atendimento';
import { UserRole } from '@/entities/user-role';
import { MemoryAtendimento, MemoryStore } from './memory-store';

const DEFAULT_PASSWORD = 'Senha@123';

@Injectable()
export class MemorySeedService implements OnModuleInit {
  private readonly logger = new Logger(MemorySeedService.name);

  constructor(private readonly store: MemoryStore) {}

  async onModuleInit(): Promise<void> {
    if (this.store.users.size > 0) {
      return;
    }
    await this.seed();
    this.logger.log('MemoryStore seeded (demo sem Postgres)');
  }

  async seed(): Promise<void> {
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const now = new Date();

    const users = [
      { email: 'admin@bencorp.local', role: UserRole.ADMIN },
      { email: 'enfermeiro@bencorp.local', role: UserRole.ENFERMEIRO },
      { email: 'medico@bencorp.local', role: UserRole.MEDICO },
    ];

    for (const u of users) {
      const id = this.store.newId();
      this.store.users.set(id, {
        id,
        email: u.email,
        passwordHash,
        role: u.role,
        active: true,
        createdAt: now,
        updatedAt: now,
      });
    }

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
      const patientId = this.store.newId();
      this.store.patients.set(patientId, {
        id: patientId,
        name: p.name,
        cpf: p.cpf,
        contact: p.contact,
        createdAt: now,
        updatedAt: now,
      });

      const atendimento: MemoryAtendimento = {
        id: this.store.newId(),
        patientId,
        status: AtendimentoStatus.AGUARDANDO,
        riskClassification: p.risk,
        professionalId: null,
        queuedAt: now,
        startedAt: null,
        finishedAt: null,
        desfecho: null,
        encaminhadoDeId: null,
        createdAt: now,
        updatedAt: now,
        patientName: p.name,
        patientContact: p.contact,
        patientCpf: p.cpf,
      };
      this.store.atendimentos.set(atendimento.id, atendimento);
    }

    this.store.clearDirty();
  }
}
