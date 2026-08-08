import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { AuthUser } from './api';
import { buildHomeSnapshot } from './homeSnapshot';
import type { HomeFilaItem } from './homeUi';
import { AdminHomeView } from './pages/AdminHomeView';
import { ClinicalHomeView } from './pages/ClinicalHomeView';

const enfermeiro: AuthUser = {
  id: 'prof-1',
  email: 'enfermeiro@bencorp.local',
  role: 'ENFERMEIRO',
  active: true,
};

const medico: AuthUser = {
  id: 'med-1',
  email: 'medico@bencorp.local',
  role: 'MEDICO',
  active: true,
};

const admin: AuthUser = {
  id: 'admin-1',
  email: 'admin@bencorp.local',
  role: 'ADMIN',
  active: true,
};

function item(
  overrides: Partial<HomeFilaItem> & Pick<HomeFilaItem, 'id'>,
): HomeFilaItem {
  return {
    status: 'AGUARDANDO',
    riskClassification: 'VERMELHO',
    professionalId: null,
    startedAt: null,
    encaminhadoDeId: null,
    patientName: 'Ana Teste',
    tempoEsperaSegundos: 300,
    ...overrides,
  };
}

const emptySnapshot = buildHomeSnapshot([], 'prof-1');

describe('ClinicalHomeView', () => {
  it('renderiza cockpit clínico com contagens e retomar', () => {
    const snapshot = buildHomeSnapshot(
      [
        item({ id: 'w1', tempoEsperaSegundos: 400 }),
        item({
          id: 'mine',
          status: 'EM_ANDAMENTO',
          professionalId: 'prof-1',
          patientName: 'Bruno',
          startedAt: '2026-08-08T11:00:00.000Z',
        }),
      ],
      'prof-1',
    );

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ClinicalHomeView
          user={enfermeiro}
          health={{
            status: 'ok',
            persistenceMode: 'memory',
            databaseConnected: false,
          }}
          loadState="ready"
          errorMessage={null}
          snapshot={snapshot}
          onLogout={() => undefined}
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Painel clínico');
    expect(html).toContain('Fila agora');
    expect(html).toContain('Maiores esperas');
    expect(html).toContain('Retomar sala — Bruno');
    expect(html).toContain('href="/atendimentos/mine"');
    expect(html).toContain('Ir para a fila');
    expect(html).toContain('href="/fila"');
    expect(html).not.toContain('encaminhados=1');
    expect(html).toContain('memory (demo sem Postgres)');
    expect(html).toContain('Ana Teste');
    expect(html).toContain('Risco Vermelho');
    expect(html).toContain('Abrir');
    expect(html).toContain('href="/atendimentos/w1"');
    expect(html).not.toContain('Gerenciar usuários');
    expect(html).not.toContain('Encaminhados');
  });

  it('exibe labels de persistência write-behind', () => {
    const htmlOnline = renderToStaticMarkup(
      <MemoryRouter>
        <ClinicalHomeView
          user={enfermeiro}
          health={{
            status: 'ok',
            persistenceMode: 'write-behind',
            databaseConnected: true,
          }}
          loadState="ready"
          errorMessage={null}
          snapshot={emptySnapshot}
          onLogout={() => undefined}
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(htmlOnline).toContain('write-behind (memória → Postgres)');

    const htmlOffline = renderToStaticMarkup(
      <MemoryRouter>
        <ClinicalHomeView
          user={enfermeiro}
          health={{
            status: 'ok',
            persistenceMode: 'write-behind',
            databaseConnected: false,
          }}
          loadState="ready"
          errorMessage={null}
          snapshot={emptySnapshot}
          onLogout={() => undefined}
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(htmlOffline).toContain(
      'write-behind (só memória; Postgres offline)',
    );
  });

  it('MEDICO vê CTA encaminhados e contagem Encaminhados', () => {
    const snapshot = buildHomeSnapshot(
      [
        item({
          id: 'e1',
          encaminhadoDeId: 'pai',
          tempoEsperaSegundos: 90,
        }),
      ],
      'med-1',
    );

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ClinicalHomeView
          user={medico}
          health={null}
          loadState="ready"
          errorMessage={null}
          snapshot={snapshot}
          onLogout={() => undefined}
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Ver encaminhados / fila');
    expect(html).toContain('encaminhados=1');
    expect(html).toContain('Encaminhados');
    expect(html).not.toContain('Ir para a fila');
  });

  it('mostra loading da fila', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ClinicalHomeView
          user={enfermeiro}
          health={null}
          loadState="loading"
          errorMessage={null}
          snapshot={null}
          onLogout={() => undefined}
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Carregando fila');
  });

  it('mostra erro com role=alert', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ClinicalHomeView
          user={enfermeiro}
          health={null}
          loadState="error"
          errorMessage="Falha de rede"
          snapshot={null}
          onLogout={() => undefined}
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Falha de rede');
    expect(html).toContain('Tentar de novo');
  });

  it('mostra empty state nas maiores esperas', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ClinicalHomeView
          user={enfermeiro}
          health={null}
          loadState="ready"
          errorMessage={null}
          snapshot={emptySnapshot}
          onLogout={() => undefined}
          onRetry={() => undefined}
        />
      </MemoryRouter>,
    );
    expect(html).toContain('Ninguém aguardando no momento');
  });

  it('ADMIN não vê seções clínicas', () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AdminHomeView
          user={admin}
          health={null}
          onLogout={() => undefined}
        />
      </MemoryRouter>,
    );

    expect(html).toContain('Gerenciar usuários');
    expect(html).not.toContain('Fila agora');
    expect(html).not.toContain('Maiores esperas');
    expect(html).not.toContain('Retomar sala');
    expect(html).not.toContain('Pacientes');
    expect(html).not.toContain('/pacientes');
    expect(html).not.toContain('/fila');
  });
});
