import type { AtendimentoFilaItem, HealthResponse } from './api';

export type HomeFilaItem = Pick<
  AtendimentoFilaItem,
  | 'id'
  | 'status'
  | 'riskClassification'
  | 'professionalId'
  | 'startedAt'
  | 'encaminhadoDeId'
  | 'patientName'
  | 'tempoEsperaSegundos'
>;

export function toHomeFilaItems(rows: AtendimentoFilaItem[]): HomeFilaItem[] {
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    riskClassification: row.riskClassification,
    professionalId: row.professionalId,
    startedAt: row.startedAt,
    encaminhadoDeId: row.encaminhadoDeId,
    patientName: row.patientName,
    tempoEsperaSegundos: row.tempoEsperaSegundos,
  }));
}

export function persistenceLabel(health: HealthResponse): string {
  if (health.persistenceMode === 'memory') {
    return 'memory (demo sem Postgres)';
  }
  if (health.persistenceMode === 'write-behind') {
    return health.databaseConnected
      ? 'write-behind (memória → Postgres)'
      : 'write-behind (só memória; Postgres offline)';
  }
  return health.persistenceMode;
}

export function encaminhadosOnlyFromSearch(
  params: Pick<URLSearchParams, 'get'>,
): boolean {
  return params.get('encaminhados') === '1';
}
