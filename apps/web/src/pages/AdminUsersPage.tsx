import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  clearSession,
  createUser,
  getStoredUser,
  listUsers,
  updateUser,
} from '../api';
import type { AuthUser, UserRole } from '../api';

const ROLES: UserRole[] = ['ADMIN', 'ENFERMEIRO', 'MEDICO'];

export function AdminUsersPage() {
  const me = getStoredUser();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Senha@123');
  const [role, setRole] = useState<UserRole>('ENFERMEIRO');

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setUsers(await listUsers());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao listar');
    }
  }, []);

  useEffect(() => {
    if (me?.role === 'ADMIN') {
      void refresh();
    }
  }, [me?.role, refresh]);

  if (!me) {
    return <Navigate to="/login" replace />;
  }
  if (me.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  async function onCreate(event: FormEvent): Promise<void> {
    event.preventDefault();
    try {
      await createUser({ email, password, role });
      setEmail('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar');
    }
  }

  async function toggleActive(user: AuthUser): Promise<void> {
    try {
      await updateUser(user.id, { active: !user.active });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  }

  async function changeRole(user: AuthUser, next: UserRole): Promise<void> {
    try {
      await updateUser(user.id, { role: next });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar papel');
    }
  }

  return (
    <main className="page">
      <header className="row">
        <div>
          <h1>Usuários</h1>
          <p className="muted">Admin · {me.email}</p>
        </div>
        <div className="row gap">
          <Link to="/">Início</Link>
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
      </header>

      {error ? <p className="error">{error}</p> : null}

      <form className="card" onSubmit={onCreate}>
        <h2>Novo usuário</h2>
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <label>
          Papel
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Criar</button>
      </form>

      <section className="card">
        <h2>Lista</h2>
        <table>
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Ativo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) =>
                      void changeRole(user, e.target.value as UserRole)
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{user.active ? 'Sim' : 'Não'}</td>
                <td>
                  <button type="button" onClick={() => void toggleActive(user)}>
                    {user.active ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
