import { Link, Navigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../api';

export function HomePage() {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="page narrow">
      <h1>BenCorp PAD</h1>
      <p>
        Olá, <strong>{user.email}</strong> ({user.role})
      </p>
      <div className="row gap">
        {user.role === 'ADMIN' ? (
          <Link to="/admin/users">Gerenciar usuários</Link>
        ) : null}
        {user.role === 'ENFERMEIRO' || user.role === 'MEDICO' ? (
          <Link to="/fila">Fila de Pronto Atendimento</Link>
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
