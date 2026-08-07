import type { AtendimentoStatus, ClassificacaoRisco } from './api';

const STATUS_LABELS: Record<AtendimentoStatus, string> = {
  AGUARDANDO: 'Aguardando',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

const RISCO_LABELS: Record<ClassificacaoRisco, string> = {
  VERMELHO: 'Vermelho',
  LARANJA: 'Laranja',
  AMARELO: 'Amarelo',
  VERDE: 'Verde',
  AZUL: 'Azul',
};

export function labelStatus(status: AtendimentoStatus): string {
  return STATUS_LABELS[status];
}

export function labelRisco(risco: ClassificacaoRisco | null | undefined): string {
  if (!risco) return '—';
  return RISCO_LABELS[risco];
}
