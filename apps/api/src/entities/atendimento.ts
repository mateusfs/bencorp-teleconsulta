import { UnprocessableStateError } from '@/entities/errors/domain-error';

export enum AtendimentoStatus {
  AGUARDANDO = 'AGUARDANDO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum DesfechoAtendimento {
  ENCERRADO = 'ENCERRADO',
  ENCAMINHADO_MEDICO = 'ENCAMINHADO_MEDICO',
}

export enum ClassificacaoRisco {
  VERMELHO = 'VERMELHO',
  LARANJA = 'LARANJA',
  AMARELO = 'AMARELO',
  VERDE = 'VERDE',
  AZUL = 'AZUL',
}

const TRANSICOES_VALIDAS: Readonly<
  Record<AtendimentoStatus, readonly AtendimentoStatus[]>
> = {
  [AtendimentoStatus.AGUARDANDO]: [
    AtendimentoStatus.EM_ANDAMENTO,
    AtendimentoStatus.CANCELADO,
  ],
  [AtendimentoStatus.EM_ANDAMENTO]: [AtendimentoStatus.FINALIZADO],
  [AtendimentoStatus.FINALIZADO]: [],
  [AtendimentoStatus.CANCELADO]: [],
};

export function canTransition(
  from: AtendimentoStatus,
  to: AtendimentoStatus,
): boolean {
  return TRANSICOES_VALIDAS[from].includes(to);
}

export function assertTransition(
  from: AtendimentoStatus,
  to: AtendimentoStatus,
): void {
  if (!canTransition(from, to)) {
    throw new UnprocessableStateError(`Transição inválida: ${from} → ${to}`);
  }
}

export type Atendimento = {
  id: string;
  patientId: string;
  status: AtendimentoStatus;
  riskClassification: ClassificacaoRisco | null;
  professionalId: string | null;
  queuedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  desfecho: DesfechoAtendimento | null;
  encaminhadoDeId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AtendimentoFilaItem = Atendimento & {
  patientName: string;
  patientContact: string;
  patientCpf: string;
  tempoEsperaSegundos: number;
};
