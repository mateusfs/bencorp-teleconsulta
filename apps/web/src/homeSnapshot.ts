import type { HomeFilaItem } from './homeUi';

export type HomeCounts = {
  aguardando: number;
  emAndamento: number;
  finalizado: number;
  encaminhados: number;
};

export type HomeSnapshot = {
  counts: HomeCounts;
  maioresEsperas: HomeFilaItem[];
  retomar: HomeFilaItem | null;
};

export function formatWaitSeconds(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function buildHomeSnapshot(
  items: HomeFilaItem[],
  userId: string,
  topN = 5,
): HomeSnapshot {
  const counts: HomeCounts = {
    aguardando: 0,
    emAndamento: 0,
    finalizado: 0,
    encaminhados: 0,
  };

  let retomar: HomeFilaItem | null = null;

  for (const item of items) {
    switch (item.status) {
      case 'AGUARDANDO':
        counts.aguardando += 1;
        if (item.encaminhadoDeId) {
          counts.encaminhados += 1;
        }
        break;
      case 'EM_ANDAMENTO':
        counts.emAndamento += 1;
        if (item.professionalId === userId) {
          if (
            !retomar ||
            (item.startedAt ?? '') > (retomar.startedAt ?? '')
          ) {
            retomar = item;
          }
        }
        break;
      case 'FINALIZADO':
        counts.finalizado += 1;
        break;
      default:
        break;
    }
  }

  const maioresEsperas = items
    .filter((item) => item.status === 'AGUARDANDO')
    .slice()
    .sort((a, b) => b.tempoEsperaSegundos - a.tempoEsperaSegundos)
    .slice(0, topN);

  return { counts, maioresEsperas, retomar };
}
