import { Link } from 'react-router-dom';
import type { AuthUser, HealthResponse } from '../api';
import { labelRisco, labelStatus } from '../labels';
import {
  formatWaitSeconds,
  type HomeSnapshot,
} from '../homeSnapshot';
import { persistenceLabel } from '../homeUi';

type LoadState = 'loading' | 'ready' | 'error';

type ClinicalHomeViewProps = {
  user: AuthUser;
  health: HealthResponse | null;
  loadState: LoadState;
  errorMessage: string | null;
  snapshot: HomeSnapshot | null;
  onLogout: () => void;
  onRetry: () => void;
};

export function ClinicalHomeView({
  user,
  health,
  loadState,
  errorMessage,
  snapshot,
  onLogout,
  onRetry,
}: ClinicalHomeViewProps) {
  const isMedico = user.role === 'MEDICO';

  return (
    <main className="page home-clinical">
      <header className="home-header">
        <div>
          <p className="home-kicker">BenCorp PAD</p>
          <h1 className="home-title">Painel clínico</h1>
          <p className="home-identity">
            <span className="home-role">{labelRole(user.role)}</span>
            <span className="muted">{user.email}</span>
          </p>
        </div>
        <button type="button" className="btn-secondary home-logout" onClick={onLogout}>
          Sair
        </button>
      </header>

      <section className="home-section" aria-labelledby="home-agora">
        <h2 id="home-agora">Agora</h2>
        <div className="home-actions">
          {snapshot?.retomar ? (
            <Link
              className="btn-primary home-cta"
              to={`/atendimentos/${snapshot.retomar.id}`}
            >
              Retomar sala — {snapshot.retomar.patientName}
            </Link>
          ) : null}
          <Link
            className={
              snapshot?.retomar ? 'btn-secondary home-cta' : 'btn-primary home-cta'
            }
            to={isMedico ? '/fila?encaminhados=1' : '/fila'}
          >
            {isMedico ? 'Ver encaminhados / fila' : 'Ir para a fila'}
          </Link>
          <Link className="btn-secondary home-cta" to="/pacientes">
            Pacientes
          </Link>
        </div>
      </section>

      <section className="home-section" aria-labelledby="home-fila">
        <h2 id="home-fila">Fila agora</h2>
        {loadState === 'loading' ? (
          <p className="muted">Carregando fila…</p>
        ) : null}
        {loadState === 'error' ? (
          <div className="home-error" role="alert">
            <p>{errorMessage ?? 'Não foi possível carregar a fila.'}</p>
            <button type="button" className="btn-secondary" onClick={onRetry}>
              Tentar de novo
            </button>
          </div>
        ) : null}
        {loadState === 'ready' && snapshot ? (
          <ul className="home-counts" aria-label="Contagens da fila">
            <li>
              <span className="home-count-value">{snapshot.counts.aguardando}</span>
              <span className="home-count-label">
                {labelStatus('AGUARDANDO')}
              </span>
            </li>
            <li>
              <span className="home-count-value">{snapshot.counts.emAndamento}</span>
              <span className="home-count-label">
                {labelStatus('EM_ANDAMENTO')}
              </span>
            </li>
            <li>
              <span className="home-count-value">{snapshot.counts.finalizado}</span>
              <span className="home-count-label">
                {labelStatus('FINALIZADO')}
              </span>
            </li>
            {isMedico ? (
              <li>
                <span className="home-count-value">
                  {snapshot.counts.encaminhados}
                </span>
                <span className="home-count-label">Encaminhados</span>
              </li>
            ) : null}
          </ul>
        ) : null}
      </section>

      <section className="home-section" aria-labelledby="home-esperas">
        <div className="home-section-head">
          <h2 id="home-esperas">Maiores esperas</h2>
          <Link to="/fila">Ver fila completa</Link>
        </div>
        {loadState === 'ready' && snapshot ? (
          snapshot.maioresEsperas.length === 0 ? (
            <p className="muted">Ninguém aguardando no momento.</p>
          ) : (
            <ul className="home-wait-list">
              {snapshot.maioresEsperas.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>{row.patientName}</strong>
                    <span
                      className={
                        row.riskClassification
                          ? `status-chip risk-chip risk-${row.riskClassification.toLowerCase()}`
                          : 'status-chip'
                      }
                    >
                      Risco {labelRisco(row.riskClassification)}
                    </span>
                  </div>
                  <div className="home-wait-meta">
                    <span>{formatWaitSeconds(row.tempoEsperaSegundos)}</span>
                    <Link to={`/atendimentos/${row.id}`}>Abrir</Link>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      {health ? (
        <p className="persistence-badge home-persistence">
          Persistência: <strong>{persistenceLabel(health)}</strong>
        </p>
      ) : null}
    </main>
  );
}

function labelRole(role: AuthUser['role']): string {
  if (role === 'ENFERMEIRO') return 'Enfermeiro';
  if (role === 'MEDICO') return 'Médico';
  return role;
}
