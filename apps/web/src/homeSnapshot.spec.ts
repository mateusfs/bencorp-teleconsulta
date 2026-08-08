import { describe, expect, it } from 'vitest';
import type { HomeFilaItem } from './homeUi';
import {
  encaminhadosOnlyFromSearch,
  persistenceLabel,
  toHomeFilaItems,
} from './homeUi';
import { buildHomeSnapshot, formatWaitSeconds } from './homeSnapshot';

function item(
  overrides: Partial<HomeFilaItem> & Pick<HomeFilaItem, 'id'>,
): HomeFilaItem {
  return {
    status: 'AGUARDANDO',
    riskClassification: 'VERDE',
    professionalId: null,
    startedAt: null,
    encaminhadoDeId: null,
    patientName: 'Paciente',
    tempoEsperaSegundos: 60,
    ...overrides,
  };
}

describe('homeSnapshot', () => {
  it('formatWaitSeconds formata minutos e segundos', () => {
    expect(formatWaitSeconds(125)).toBe('2m 05s');
    expect(formatWaitSeconds(-1)).toBe('0m 00s');
  });

  it('contagens e top esperas', () => {
    const snapshot = buildHomeSnapshot(
      [
        item({ id: 'a1', tempoEsperaSegundos: 30, patientName: 'Curto' }),
        item({ id: 'a2', tempoEsperaSegundos: 900, patientName: 'Longo' }),
        item({
          id: 'a3',
          status: 'EM_ANDAMENTO',
          professionalId: 'outro',
          tempoEsperaSegundos: 10,
        }),
        item({ id: 'a4', status: 'FINALIZADO', tempoEsperaSegundos: 0 }),
        item({
          id: 'a5',
          status: 'AGUARDANDO',
          encaminhadoDeId: 'pai',
          tempoEsperaSegundos: 120,
          patientName: 'Encaminhado',
        }),
      ],
      'prof-1',
      2,
    );

    expect(snapshot.counts).toEqual({
      aguardando: 3,
      emAndamento: 1,
      finalizado: 1,
      encaminhados: 1,
    });
    expect(snapshot.maioresEsperas.map((row) => row.id)).toEqual(['a2', 'a5']);
    expect(snapshot.retomar).toBeNull();
  });

  it('retomar aponta para EM_ANDAMENTO do profissional (mais recente)', () => {
    const snapshot = buildHomeSnapshot(
      [
        item({
          id: 'old',
          status: 'EM_ANDAMENTO',
          professionalId: 'prof-1',
          startedAt: '2026-08-08T10:00:00.000Z',
          patientName: 'Antigo',
        }),
        item({
          id: 'new',
          status: 'EM_ANDAMENTO',
          professionalId: 'prof-1',
          startedAt: '2026-08-08T11:00:00.000Z',
          patientName: 'Novo',
        }),
        item({
          id: 'other',
          status: 'EM_ANDAMENTO',
          professionalId: 'outro',
          startedAt: '2026-08-08T12:00:00.000Z',
        }),
      ],
      'prof-1',
    );

    expect(snapshot.retomar?.id).toBe('new');
    expect(snapshot.counts.emAndamento).toBe(3);
  });

  it('sem retomar quando não há atendimento do usuário', () => {
    const snapshot = buildHomeSnapshot(
      [
        item({
          id: 'x',
          status: 'EM_ANDAMENTO',
          professionalId: 'outro',
        }),
      ],
      'prof-1',
    );
    expect(snapshot.retomar).toBeNull();
  });
});

describe('homeUi', () => {
  it('toHomeFilaItems omite CPF e contato', () => {
    const slim = toHomeFilaItems([
      {
        id: 'a1',
        patientId: 'p1',
        status: 'AGUARDANDO',
        riskClassification: 'VERDE',
        professionalId: null,
        queuedAt: '2026-08-08T10:00:00.000Z',
        startedAt: null,
        finishedAt: null,
        desfecho: null,
        encaminhadoDeId: null,
        patientName: 'Ana',
        patientContact: '11999990000',
        patientCpf: '39053344705',
        tempoEsperaSegundos: 10,
      },
    ]);
    expect(slim[0]).toEqual({
      id: 'a1',
      status: 'AGUARDANDO',
      riskClassification: 'VERDE',
      professionalId: null,
      startedAt: null,
      encaminhadoDeId: null,
      patientName: 'Ana',
      tempoEsperaSegundos: 10,
    });
    expect(slim[0]).not.toHaveProperty('patientCpf');
    expect(slim[0]).not.toHaveProperty('patientContact');
  });

  it('encaminhadosOnlyFromSearch lê query da fila', () => {
    expect(
      encaminhadosOnlyFromSearch(new URLSearchParams('encaminhados=1')),
    ).toBe(true);
    expect(encaminhadosOnlyFromSearch(new URLSearchParams(''))).toBe(false);
  });

  it('persistenceLabel cobre memory, write-behind e fallback', () => {
    expect(
      persistenceLabel({
        status: 'ok',
        persistenceMode: 'memory',
        databaseConnected: false,
      }),
    ).toBe('memory (demo sem Postgres)');
    expect(
      persistenceLabel({
        status: 'ok',
        persistenceMode: 'write-behind',
        databaseConnected: true,
      }),
    ).toBe('write-behind (memória → Postgres)');
    expect(
      persistenceLabel({
        status: 'ok',
        persistenceMode: 'write-behind',
        databaseConnected: false,
      }),
    ).toBe('write-behind (só memória; Postgres offline)');
    expect(
      persistenceLabel({
        status: 'ok',
        persistenceMode: 'postgres',
        databaseConnected: true,
      }),
    ).toBe('postgres');
  });
});
