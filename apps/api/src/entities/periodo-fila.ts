export type PeriodoFila = 'HOJE' | 'ONTEM' | 'ULTIMA_SEMANA' | 'TODOS';

const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000;

function ymdInSaoPaulo(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function saoPauloDayStartUtc(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000${offsetIso()}`);
}

function offsetIso(): string {
  const totalMinutes = Math.abs(SAO_PAULO_OFFSET_MS) / 60000;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  const sign = SAO_PAULO_OFFSET_MS <= 0 ? '-' : '+';
  return `${sign}${hours}:${minutes}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const base = saoPauloDayStartUtc(ymd);
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  return ymdInSaoPaulo(next);
}

export type QueuedAtRange = {
  gte?: Date;
  lt?: Date;
};

export function periodoToQueuedAtRange(
  periodo: PeriodoFila,
  now = new Date(),
): QueuedAtRange | undefined {
  if (periodo === 'TODOS') {
    return undefined;
  }

  const today = ymdInSaoPaulo(now);

  if (periodo === 'HOJE') {
    return {
      gte: saoPauloDayStartUtc(today),
      lt: saoPauloDayStartUtc(addDaysYmd(today, 1)),
    };
  }

  if (periodo === 'ONTEM') {
    const yesterday = addDaysYmd(today, -1);
    return {
      gte: saoPauloDayStartUtc(yesterday),
      lt: saoPauloDayStartUtc(today),
    };
  }

  const weekStart = addDaysYmd(today, -6);
  return {
    gte: saoPauloDayStartUtc(weekStart),
    lt: saoPauloDayStartUtc(addDaysYmd(today, 1)),
  };
}

export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
