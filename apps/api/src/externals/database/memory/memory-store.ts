import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  Atendimento,
  AtendimentoStatus,
  ClassificacaoRisco,
  DesfechoAtendimento,
} from '@/entities/atendimento';
import { ChatMessage, PatientInviteLink } from '@/entities/sala';
import { Prontuario } from '@/entities/prontuario';
import { Usuario } from '@/entities/usuario';
import { AuditoriaLeitura } from '@/app/contracts/auditoria-leitura.repository';

export type MemoryPatient = {
  id: string;
  name: string;
  cpf: string;
  contact: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MemoryAtendimento = Atendimento & {
  patientName: string;
  patientContact: string;
  patientCpf: string;
};

@Injectable()
export class MemoryStore {
  readonly users = new Map<string, Usuario>();
  readonly patients = new Map<string, MemoryPatient>();
  readonly atendimentos = new Map<string, MemoryAtendimento>();
  readonly prontuarios = new Map<string, Prontuario>();
  readonly prontuarioByAtendimento = new Map<string, string>();
  readonly invites = new Map<string, PatientInviteLink>();
  readonly chatMessages: ChatMessage[] = [];
  readonly auditorias: AuditoriaLeitura[] = [];
  dirty = false;

  markDirty(): void {
    this.dirty = true;
  }

  clearDirty(): void {
    this.dirty = false;
  }

  newId(): string {
    return randomUUID();
  }

  reset(): void {
    this.users.clear();
    this.patients.clear();
    this.atendimentos.clear();
    this.prontuarios.clear();
    this.prontuarioByAtendimento.clear();
    this.invites.clear();
    this.chatMessages.length = 0;
    this.auditorias.length = 0;
    this.dirty = false;
  }

  stripAtendimento(item: MemoryAtendimento): Atendimento {
    return {
      id: item.id,
      patientId: item.patientId,
      status: item.status,
      riskClassification: item.riskClassification,
      professionalId: item.professionalId,
      queuedAt: item.queuedAt,
      startedAt: item.startedAt,
      finishedAt: item.finishedAt,
      desfecho: item.desfecho,
      encaminhadoDeId: item.encaminhadoDeId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}

export type { AtendimentoStatus, ClassificacaoRisco, DesfechoAtendimento };
