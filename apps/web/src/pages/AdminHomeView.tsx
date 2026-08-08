import { Link } from 'react-router-dom';
import type { AuthUser, HealthResponse } from '../api';
import { persistenceLabel } from '../homeUi';

type AdminHomeViewProps = {
  user: AuthUser;
  health: HealthResponse | null;
  onLogout: () => void;
};

export function AdminHomeView({ user, health, onLogout }: AdminHomeViewProps) {
  return (
    <main className="page home-clinical">
      <header className="home-header">
        <div>
          <p className="home-kicker">BenCorp PAD</p>
          <h1 className="home-title">Administração</h1>
          <p className="home-identity">
            <span className="home-role">Admin</span>
            <span className="muted">{user.email}</span>
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary home-logout"
          onClick={onLogout}
        >
          Sair
        </button>
      </header>
      <section className="home-section">
        <h2>Gestão</h2>
        <div className="home-actions">
          <Link className="btn-primary home-cta" to="/admin/users">
            Gerenciar usuários
          </Link>
        </div>
      </section>
      {health ? (
        <p className="persistence-badge home-persistence">
          Persistência: <strong>{persistenceLabel(health)}</strong>
        </p>
      ) : null}
    </main>
  );
}
