import { periodoToQueuedAtRange } from './periodo-fila';

describe('periodoToQueuedAtRange', () => {
  const now = new Date('2026-08-07T15:00:00.000Z');

  it('HOJE cobre o dia civil em America/Sao_Paulo', () => {
    const range = periodoToQueuedAtRange('HOJE', now);
    expect(range?.gte?.toISOString()).toBe('2026-08-07T03:00:00.000Z');
    expect(range?.lt?.toISOString()).toBe('2026-08-08T03:00:00.000Z');
  });

  it('ONTEM cobre o dia anterior', () => {
    const range = periodoToQueuedAtRange('ONTEM', now);
    expect(range?.gte?.toISOString()).toBe('2026-08-06T03:00:00.000Z');
    expect(range?.lt?.toISOString()).toBe('2026-08-07T03:00:00.000Z');
  });

  it('ULTIMA_SEMANA cobre 7 dias civis terminando hoje', () => {
    const range = periodoToQueuedAtRange('ULTIMA_SEMANA', now);
    expect(range?.gte?.toISOString()).toBe('2026-08-01T03:00:00.000Z');
    expect(range?.lt?.toISOString()).toBe('2026-08-08T03:00:00.000Z');
  });

  it('TODOS não restringe', () => {
    expect(periodoToQueuedAtRange('TODOS', now)).toBeUndefined();
  });
});
