import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  clearSession,
  createAdendoProntuario,
  criarLinkPaciente,
  emitirTokenSala,
  encaminharAtendimento,
  encerrarAtendimento,
  getAtendimento,
  getProntuarioByAtendimento,
  getStoredUser,
  getToken,
  updateProntuario,
} from '../api';
import type {
  AtendimentoFilaItem,
  ClassificacaoRisco,
  Prontuario,
  VideoAccessToken,
} from '../api';
import { ChatPanel } from '../components/ChatPanel';
import { VideoRoom } from '../components/VideoRoom';

export function AtendimentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const me = getStoredUser();
  const accessToken = getToken();
  const [item, setItem] = useState<AtendimentoFilaItem | null>(null);
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adendoTexto, setAdendoTexto] = useState('');
  const [video, setVideo] = useState<VideoAccessToken | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [finishChoice, setFinishChoice] = useState<
    'encerrar' | 'encaminhar' | null
  >(null);

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

  useEffect(() => {
    if (
      !id ||
      !item ||
      item.status !== 'EM_ANDAMENTO' ||
      item.professionalId !== me?.id
    ) {
      setVideo(null);
      return;
    }
    void emitirTokenSala(id)
      .then(setVideo)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erro no token de sala');
      });
  }, [id, item, me?.id]);

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
  const salaAtiva = Boolean(isOwner && video && accessToken && id);

  async function onCopyLink(): Promise<void> {
    if (!id) return;
    try {
      const created = await criarLinkPaciente(id);
      setInviteUrl(created.inviteUrl);
      await navigator.clipboard.writeText(created.inviteUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar link');
    }
  }

  async function confirmFinish(): Promise<void> {
    if (!id || !finishChoice) return;
    try {
      if (finishChoice === 'encerrar') {
        setItem(await encerrarAtendimento(id));
      } else {
        const result = await encaminharAtendimento(id);
        setItem(result.parent);
      }
      setFinishChoice(null);
      setVideo(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao finalizar');
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
    <main className="page page-sala">
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
            {isOwner ? (
              <div className="row gap wrap">
                <button type="button" onClick={() => void onCopyLink()}>
                  Copiar link do paciente
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setFinishChoice('encerrar')}
                >
                  Encerrar
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setFinishChoice('encaminhar')}
                >
                  Encaminhar ao médico
                </button>
              </div>
            ) : null}
            {inviteUrl ? (
              <p className="muted break">
                Link: <code>{inviteUrl}</code>
              </p>
            ) : null}
          </section>

          {finishChoice ? (
            <div className="modal-backdrop">
              <div className="card modal">
                <h2>
                  {finishChoice === 'encerrar'
                    ? 'Encerrar atendimento?'
                    : 'Encaminhar ao médico?'}
                </h2>
                <p className="muted">
                  Escolha exclusiva: a sala será encerrada e os tokens
                  revogados.
                </p>
                <div className="row gap">
                  <button type="button" onClick={() => void confirmFinish()}>
                    Confirmar
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setFinishChoice(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="sala-grid">
            <section className="card sala-panel">
              <h2>Vídeo</h2>
              {salaAtiva && video ? (
                <VideoRoom token={video.token} url={video.url} enabled />
              ) : (
                <p className="muted">
                  Vídeo disponível para o responsável em EM_ANDAMENTO.
                </p>
              )}
            </section>

            <section className="card sala-panel">
              {salaAtiva && accessToken && id ? (
                <ChatPanel
                  atendimentoId={id}
                  accessToken={accessToken}
                  enabled
                />
              ) : (
                <>
                  <h3>Chat</h3>
                  <p className="muted">Chat ativo somente na sala em andamento.</p>
                </>
              )}
            </section>

            <section className="card sala-panel">
              <h2>Prontuário</h2>
              {prontuario ? (
                <>
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
                              fc: e.target.value
                                ? Number(e.target.value)
                                : null,
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
                              spo2: e.target.value
                                ? Number(e.target.value)
                                : null,
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
                              patchProntuario({
                                prescricao: e.target.value,
                              })
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
                              {new Date(adendo.createdAt).toLocaleString(
                                'pt-BR',
                              )}
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
                </>
              ) : (
                <p className="muted">
                  Prontuário disponível após iniciar o atendimento.
                </p>
              )}
            </section>
          </div>
        </>
      ) : (
        <p className="muted">Carregando…</p>
      )}
    </main>
  );
}
