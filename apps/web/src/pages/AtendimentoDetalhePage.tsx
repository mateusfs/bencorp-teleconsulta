import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  clearSession,
  createAdendoProntuario,
  encaminharAtendimento,
  encerrarAtendimento,
  getAtendimento,
  getProntuarioByAtendimento,
  getStoredUser,
  updateProntuario,
} from '../api';
import type {
  AtendimentoFilaItem,
  ClassificacaoRisco,
  Prontuario,
} from '../api';

export function AtendimentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const me = getStoredUser();
  const [item, setItem] = useState<AtendimentoFilaItem | null>(null);
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adendoTexto, setAdendoTexto] = useState('');

  const refresh = useCallback(async (): Promise<void> => {
    if (!id) return;
    try {
      const atendimento = await getAtendimento(id);
      setItem(atendimento);
      if (
        atendimento.status === 'EM_ANDAMENTO' ||
        atendimento.status === 'FINALIZADO'
      ) {
        setProntuario(await getProntuarioByAtendimento(id));
      } else {
        setProntuario(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    }
  }, [id]);

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

  const role = me.role;
  const userId = me.id;

  const isOwner =
    item?.status === 'EM_ANDAMENTO' && item.professionalId === userId;
  const canEdit = Boolean(isOwner && prontuario);
  const canAdendo = item?.status === 'FINALIZADO' && Boolean(prontuario);

  async function onEncerrar(): Promise<void> {
    if (!id) return;
    try {
      setItem(await encerrarAtendimento(id));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encerrar');
    }
  }

  async function onEncaminhar(): Promise<void> {
    if (!id) return;
    try {
      const result = await encaminharAtendimento(id);
      setItem(result.parent);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encaminhar');
    }
  }

  async function onSaveProntuario(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!id || !prontuario) return;
    try {
      const payload = {
        queixa: prontuario.queixa,
        anamnese: prontuario.anamnese,
        conduta: prontuario.conduta,
        paSistolica: prontuario.paSistolica,
        paDiastolica: prontuario.paDiastolica,
        fc: prontuario.fc,
        temperatura: prontuario.temperatura,
        spo2: prontuario.spo2,
        riskClassification: prontuario.riskClassification,
        ...(role === 'MEDICO'
          ? {
              prescricao: prontuario.prescricao,
              complementoMedico: prontuario.complementoMedico,
            }
          : {}),
      };
      setProntuario(await updateProntuario(id, payload));
      setItem(await getAtendimento(id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  async function onAdendo(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!id) return;
    try {
      await createAdendoProntuario(id, adendoTexto);
      setAdendoTexto('');
      setProntuario(await getProntuarioByAtendimento(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no adendo');
    }
  }

  function patchProntuario(partial: Partial<Prontuario>): void {
    setProntuario((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  return (
    <main className="page">
      <div className="row">
        <h1>Sala de Atendimento</h1>
        <div className="row gap">
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

      {item ? (
        <>
          <section className="card">
            <p>
              <strong>{item.patientName}</strong> · {item.patientContact}
            </p>
            <p className="muted">
              Status: {item.status}
              {item.desfecho ? ` · ${item.desfecho}` : ''}
              {item.riskClassification
                ? ` · Risco ${item.riskClassification}`
                : ''}
            </p>
            <p className="muted">
              Vídeo e chat entram no Épico E. Prontuário clínico abaixo.
            </p>
            {isOwner ? (
              <div className="row gap">
                <button type="button" onClick={() => void onEncerrar()}>
                  Encerrar atendimento
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void onEncaminhar()}
                >
                  Encaminhar ao médico
                </button>
              </div>
            ) : null}
          </section>

          {prontuario ? (
            <section className="card">
              <h2>Prontuário</h2>
              <form
                className="prontuario-form"
                onSubmit={(e) => void onSaveProntuario(e)}
              >
                <label>
                  Queixa
                  <textarea
                    disabled={!canEdit}
                    value={prontuario.queixa}
                    onChange={(e) =>
                      patchProntuario({ queixa: e.target.value })
                    }
                  />
                </label>
                <label>
                  Anamnese
                  <textarea
                    disabled={!canEdit}
                    value={prontuario.anamnese}
                    onChange={(e) =>
                      patchProntuario({ anamnese: e.target.value })
                    }
                  />
                </label>
                <div className="filters">
                  <label>
                    PA sistólica
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={prontuario.paSistolica ?? ''}
                      onChange={(e) =>
                        patchProntuario({
                          paSistolica: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </label>
                  <label>
                    PA diastólica
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={prontuario.paDiastolica ?? ''}
                      onChange={(e) =>
                        patchProntuario({
                          paDiastolica: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </label>
                  <label>
                    FC
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={prontuario.fc ?? ''}
                      onChange={(e) =>
                        patchProntuario({
                          fc: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </label>
                  <label>
                    Temp (°C)
                    <input
                      type="number"
                      step="0.1"
                      disabled={!canEdit}
                      value={prontuario.temperatura ?? ''}
                      onChange={(e) =>
                        patchProntuario({
                          temperatura: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </label>
                  <label>
                    SpO₂
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={prontuario.spo2 ?? ''}
                      onChange={(e) =>
                        patchProntuario({
                          spo2: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </label>
                  <label>
                    Classificação de risco
                    <select
                      disabled={!canEdit}
                      value={prontuario.riskClassification ?? ''}
                      onChange={(e) =>
                        patchProntuario({
                          riskClassification: (e.target.value ||
                            null) as ClassificacaoRisco | null,
                        })
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
                </div>
                <label>
                  Conduta
                  <textarea
                    disabled={!canEdit}
                    value={prontuario.conduta}
                    onChange={(e) =>
                      patchProntuario({ conduta: e.target.value })
                    }
                  />
                </label>
                {role === 'MEDICO' || prontuario.prescricao ? (
                  <>
                    <label>
                      Prescrição
                      <textarea
                        disabled={!canEdit || role !== 'MEDICO'}
                        value={prontuario.prescricao}
                        onChange={(e) =>
                          patchProntuario({ prescricao: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Complemento médico
                      <textarea
                        disabled={!canEdit || role !== 'MEDICO'}
                        value={prontuario.complementoMedico}
                        onChange={(e) =>
                          patchProntuario({
                            complementoMedico: e.target.value,
                          })
                        }
                      />
                    </label>
                  </>
                ) : null}
                {canEdit ? (
                  <button type="submit">Salvar prontuário</button>
                ) : (
                  <p className="muted">
                    Edição bloqueada (somente responsável em EM_ANDAMENTO).
                  </p>
                )}
              </form>

              {prontuario.adendos.length > 0 ? (
                <div>
                  <h3>Adendos</h3>
                  <ul>
                    {prontuario.adendos.map((adendo) => (
                      <li key={adendo.id}>
                        <span className="muted">
                          {new Date(adendo.createdAt).toLocaleString('pt-BR')}
                        </span>
                        {' — '}
                        {adendo.texto}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {canAdendo ? (
                <form onSubmit={(e) => void onAdendo(e)}>
                  <h3>Novo adendo</h3>
                  <label>
                    Texto
                    <textarea
                      required
                      value={adendoTexto}
                      onChange={(e) => setAdendoTexto(e.target.value)}
                    />
                  </label>
                  <button type="submit">Registrar adendo</button>
                </form>
              ) : null}
            </section>
          ) : (
            <p className="muted">
              Prontuário disponível após iniciar o atendimento.
            </p>
          )}
        </>
      ) : (
        <p className="muted">Carregando…</p>
      )}
    </main>
  );
}
