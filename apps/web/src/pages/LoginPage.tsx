import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getStoredUser, login, saveSession } from '../api';

export function LoginPage() {
  const navigate = useNavigate();
  const existing = getStoredUser();
  const [email, setEmail] = useState('admin@bencorp.local');
  const [password, setPassword] = useState('Senha@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (existing) {
    return (
      <Navigate
        to={existing.role === 'ADMIN' ? '/admin/users' : '/'}
        replace
      />
    );
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(email, password);
      saveSession(result);
      navigate(result.user.role === 'ADMIN' ? '/admin/users' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page narrow">
      <h1>BenCorp PAD</h1>
      <p className="muted">Login de profissionais e administradores</p>
      <form onSubmit={onSubmit} className="card">
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
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
