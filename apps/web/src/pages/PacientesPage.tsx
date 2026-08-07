import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { clearSession, getStoredUser, listPacientes } from '../api';
import type { PacienteResumo } from '../api';

export function PacientesPage() {
  const me = getStoredUser();
  const [items, setItems] = useState<PacienteResumo[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setItems(await listPacientes({ q: q || undefined }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao listar pacientes');
    }
  }, [q]);

  useEffect(() => {
    if (me?.role === 'ENFERMEIRO' || me?.role === 'MEDICO') {
      void refresh();
    }
  }, [me?.role, refresh]);

  if (!me) {
    return <Navigate to="/login" replace />;
  }
  if (me.role !== 'ENFERMEIRO' && me.role !== 'MEDICO') {
    return <Navigate to="/" replace />;
  }

  async function onSearch(event: FormEvent): Promise<void> {
    event.preventDefault();
    await refresh();
  }

  return (
    <main className="page wide">
      <div className="row">
        <h1>Pacientes</h1>
        <div className="row gap">
          <Link to="/">Início</Link>
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

      <form className="card row gap" onSubmit={onSearch}>
        <label>
          Buscar (nome ou CPF)
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome ou CPF"
          />
        </label>
        <button type="submit">Buscar</button>
      </form>

      {error ? <p className="error">{error}</p> : null}

      <ul className="list">
        {items.map((p) => (
          <li key={p.id} className="card">
            <div className="row">
              <div>
                <strong>{p.name}</strong>
                <p className="muted">Contato: {p.contact}</p>
              </div>
              <Link to={`/pacientes/${p.id}`}>Abrir histórico</Link>
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && !error ? (
        <p className="muted">Nenhum paciente encontrado.</p>
      ) : null}
    </main>
  );
}
