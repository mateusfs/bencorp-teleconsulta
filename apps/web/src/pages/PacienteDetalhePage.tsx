import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { clearSession, getPacienteDetalhe, getStoredUser } from '../api';
import type { PacienteDetalhe } from '../api';

function formatDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR');
}

export function PacienteDetalhePage() {
  const me = getStoredUser();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<PacienteDetalhe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || (me?.role !== 'ENFERMEIRO' && me?.role !== 'MEDICO')) {
      return;
    }
    void getPacienteDetalhe(id)
      .then((data) => {
        setDetail(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      });
  }, [id, me?.role]);

  if (!me) {
    return <Navigate to="/login" replace />;
  }
  if (me.role !== 'ENFERMEIRO' && me.role !== 'MEDICO') {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="page wide">
      <div className="row">
        <h1>Paciente</h1>
        <div className="row gap">
          <Link to="/pacientes">Pacientes</Link>
          <Link to="/fila">Fila</Link>
          <button
            type="button"
            onClick={() => {
              clearSession();
              window.location.href = '/login';
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {detail ? (
        <>
          <section className="card">
            <h2>{detail.paciente.name}</h2>
            <p className="muted">Contato: {detail.paciente.contact}</p>
          </section>

          <section className="card">
            <h2>Histórico de atendimentos</h2>
            {detail.atendimentos.length === 0 ? (
              <p className="muted">Sem atendimentos.</p>
            ) : (
              <ul className="list">
                {detail.atendimentos.map((a) => (
                  <li key={a.id}>
                    <Link to={`/atendimentos/${a.id}`}>
                      {a.status} · risco {a.riskClassification ?? '—'} ·{' '}
                      {formatDate(a.queuedAt)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Prontuários e sinais vitais</h2>
            {detail.prontuarios.length === 0 ? (
              <p className="muted">Sem prontuários.</p>
            ) : (
              detail.prontuarios.map((p) => (
                <article key={p.id} className="card">
                  <p>
                    <strong>Queixa:</strong> {p.queixa || '—'}
                  </p>
                  <p className="muted">
                    PA {p.paSistolica ?? '—'}/{p.paDiastolica ?? '—'} · FC{' '}
                    {p.fc ?? '—'} · Temp {p.temperatura ?? '—'} · SpO2{' '}
                    {p.spo2 ?? '—'}
                  </p>
                  <p className="muted">
                    Atendimento{' '}
                    <Link to={`/atendimentos/${p.atendimentoId}`}>
                      {p.atendimentoId}
                    </Link>
                  </p>
                </article>
              ))
            )}
          </section>
        </>
      ) : !error ? (
        <p className="muted">Carregando…</p>
      ) : null}
    </main>
  );
}
