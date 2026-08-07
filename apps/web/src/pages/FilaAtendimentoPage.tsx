import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  cancelarAtendimento,
  clearSession,
  createAtendimento,
  getStoredUser,
  iniciarAtendimento,
  listAtendimentos,
} from '../api';
import type {
  AtendimentoFilaItem,
  AtendimentoStatus,
  ClassificacaoRisco,
  PeriodoFila,
} from '../api';

function formatWait(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function FilaAtendimentoPage() {
  const me = getStoredUser();
  const navigate = useNavigate();
  const [items, setItems] = useState<AtendimentoFilaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<AtendimentoStatus | ''>('');
  const [periodo, setPeriodo] = useState<PeriodoFila>('TODOS');
  const [encaminhadosOnly, setEncaminhadosOnly] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientCpf, setPatientCpf] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [risk, setRisk] = useState<ClassificacaoRisco | ''>('');

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setItems(
        await listAtendimentos({
          q: q || undefined,
          status,
          periodo,
          encaminhadosOnly:
            me?.role === 'MEDICO' ? encaminhadosOnly : undefined,
        }),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao listar fila');
    }
  }, [q, status, periodo, encaminhadosOnly, me?.role]);

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

  async function onCreate(event: FormEvent): Promise<void> {
    event.preventDefault();
    try {
      await createAtendimento({
        patientName,
        patientCpf,
        patientContact,
        riskClassification: risk || undefined,
      });
      setPatientName('');
      setPatientCpf('');
      setPatientContact('');
      setRisk('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar');
    }
  }

  async function onIniciar(id: string): Promise<void> {
    try {
      await iniciarAtendimento(id);
      navigate(`/atendimentos/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar');
    }
  }

  async function onCancelar(id: string): Promise<void> {
    try {
      await cancelarAtendimento(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar');
    }
  }

  return (
    <main className="page wide">
      <div className="row">
        <h1>Fila de Pronto Atendimento</h1>
        <div className="row gap">
          <Link to="/">Início</Link>
          <Link to="/pacientes">Pacientes</Link>
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

      <section className="card filters">
        <label>
          Busca (nome/CPF)
          <input value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label>
          Status
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as AtendimentoStatus | '')
            }
          >
            <option value="">Todos</option>
            <option value="AGUARDANDO">Aguardando</option>
            <option value="EM_ANDAMENTO">Em atendimento</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </label>
        <label>
          Período
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as PeriodoFila)}
          >
            <option value="TODOS">Todos</option>
            <option value="HOJE">Hoje</option>
            <option value="ONTEM">Ontem</option>
            <option value="ULTIMA_SEMANA">Última semana</option>
          </select>
        </label>
        {me.role === 'MEDICO' ? (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={encaminhadosOnly}
              onChange={(e) => setEncaminhadosOnly(e.target.checked)}
            />
            Só encaminhados
          </label>
        ) : null}
        <button type="button" onClick={() => void refresh()}>
          Filtrar
        </button>
      </section>

      <section className="card">
        <h2>Nova solicitação</h2>
        <form className="filters" onSubmit={(e) => void onCreate(e)}>
          <label>
            Nome
            <input
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
          </label>
          <label>
            CPF
            <input
              required
              value={patientCpf}
              onChange={(e) => setPatientCpf(e.target.value)}
            />
          </label>
          <label>
            Contato
            <input
              required
              value={patientContact}
              onChange={(e) => setPatientContact(e.target.value)}
            />
          </label>
          <label>
            Risco
            <select
              value={risk}
              onChange={(e) =>
                setRisk(e.target.value as ClassificacaoRisco | '')
              }
            >
              <option value="">—</option>
              <option value="VERMELHO">Vermelho</option>
              <option value="LARANJA">Laranja</option>
              <option value="AMARELO">Amarelo</option>
              <option value="VERDE">Verde</option>
              <option value="AZUL">Azul</option>
            </select>
          </label>
          <button type="submit">Enfileirar</button>
        </form>
      </section>

      <section className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Contato</th>
              <th>Risco</th>
              <th>Status</th>
              <th>Entrada</th>
              <th>Espera</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.patientName}</td>
                <td>{item.patientContact}</td>
                <td>{item.riskClassification ?? '—'}</td>
                <td>{item.status}</td>
                <td>{new Date(item.queuedAt).toLocaleString('pt-BR')}</td>
                <td>{formatWait(item.tempoEsperaSegundos)}</td>
                <td className="actions">
                  {item.status === 'AGUARDANDO' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void onIniciar(item.id)}
                      >
                        Iniciar
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => void onCancelar(item.id)}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : null}
                  <Link to={`/atendimentos/${item.id}`}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
