import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { clearSession, fetchHealth, getStoredUser } from '../api';
import type { HealthResponse } from '../api';

export function HomePage() {
  const user = getStoredUser();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    void fetchHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="page narrow">
      <h1>BenCorp PAD</h1>
      {health ? (
        <p className="persistence-badge">
          Persistência: <strong>{health.persistenceMode}</strong>
          {health.persistenceMode === 'memory'
            ? ' (demo sem Postgres)'
            : null}
          {health.persistenceMode === 'write-behind'
            ? health.databaseConnected
              ? ' (memória → Postgres)'
              : ' (só memória; Postgres offline)'
            : null}
        </p>
      ) : null}
      <p>
        Olá, <strong>{user.email}</strong> ({user.role})
      </p>
      <div className="row gap">
        {user.role === 'ADMIN' ? (
          <Link to="/admin/users">Gerenciar usuários</Link>
        ) : null}
        {user.role === 'ENFERMEIRO' || user.role === 'MEDICO' ? (
          <>
            <Link to="/fila">Fila de Pronto Atendimento</Link>
            <Link to="/pacientes">Pacientes</Link>
          </>
        ) : null}
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
    </main>
  );
}
