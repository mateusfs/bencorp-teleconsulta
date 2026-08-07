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
  Prontuario,
  VideoAccessToken,
} from '../api';
import { ChatPanel } from '../components/ChatPanel';
import { VideoRoom } from '../components/VideoRoom';
import {
  collectVitalErrors,
  isProntuarioComplete,
  labelForProntuarioField,
  missingProntuarioFields,
  parseApiFieldErrors,
  parseRiskClassification,
  toVitalPayload,
  type VitalFieldKey,
} from '../prontuarioCompleteness';
import { labelRisco, labelStatus } from '../labels';

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
  const [saveOk, setSaveOk] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<VitalFieldKey, string>>
  >({});

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
        setDirty(false);
        setSaveOk(false);
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

  const salaOwner =
    item?.status === 'EM_ANDAMENTO' && item.professionalId === me?.id;

  useEffect(() => {
    if (!id || !salaOwner) {
      setVideo(null);
      return;
    }
    let cancelled = false;
    void emitirTokenSala(id)
      .then((token) => {
        if (!cancelled) {
          setVideo(token);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Erro no token de sala',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id, salaOwner]);

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
  const missingFields = prontuario
    ? missingProntuarioFields(prontuario, role)
    : [];
  const formComplete = prontuario
    ? isProntuarioComplete(prontuario, role)
    : false;
  const totalRequired = role === 'MEDICO' ? 10 : 9;
  const filledCount = totalRequired - missingFields.length;
  const canSave = Boolean(canEdit && formComplete && dirty);

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
    if (prontuario && (!isProntuarioComplete(prontuario, role) || dirty)) {
      setError(
        dirty
          ? 'Salve o prontuário antes de encerrar ou encaminhar.'
          : 'Conclua e salve o prontuário antes de encerrar ou encaminhar.',
      );
      setFinishChoice(null);
      return;
    }
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

  async function onSaveProntuario(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!id || !prontuario) return;
    const missing = missingProntuarioFields(prontuario, role);
    const vitals = collectVitalErrors(prontuario);
    if (missing.length > 0 || !dirty) {
      setSaveOk(false);
      setFieldErrors(vitals);
      setError(
        missing.length > 0
          ? `Preencha todos os campos obrigatórios: ${missing
              .map(labelForProntuarioField)
              .join(', ')}`
          : 'Nenhuma alteração para salvar.',
      );
      return;
    }
    try {
      const vitalsPayload = toVitalPayload(prontuario);
      const payload = {
        queixa: prontuario.queixa.trim(),
        anamnese: prontuario.anamnese.trim(),
        conduta: prontuario.conduta.trim(),
        ...vitalsPayload,
        riskClassification: prontuario.riskClassification,
        ...(role === 'MEDICO'
          ? {
              prescricao: prontuario.prescricao.trim(),
              complementoMedico: prontuario.complementoMedico.trim(),
            }
          : {}),
      };
      setProntuario(await updateProntuario(id, payload));
      setItem(await getAtendimento(id));
      setError(null);
      setFieldErrors({});
      setDirty(false);
      setSaveOk(true);
    } catch (err) {
      setSaveOk(false);
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      setFieldErrors(parseApiFieldErrors(message));
      setError(message);
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
    setDirty(true);
    setSaveOk(false);
    setFieldErrors((prev) => {
      const next = { ...prev };
      (Object.keys(partial) as Array<keyof Prontuario>).forEach((key) => {
        if (key in next) {
          delete next[key as VitalFieldKey];
        }
      });
      return next;
    });
    setProntuario((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  function vitalClass(key: VitalFieldKey): string {
    return fieldErrors[key] ? 'field-invalid' : '';
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
            <p className="muted status-line">
              <span className="status-chip">
                Status: <strong>{labelStatus(item.status)}</strong>
              </span>
              {item.desfecho ? (
                <span className="status-chip">Desfecho: {item.desfecho}</span>
              ) : null}
              {item.riskClassification ? (
                <span
                  className={`status-chip risk-chip risk-${item.riskClassification.toLowerCase()}`}
                >
                  Risco: <strong>{labelRisco(item.riskClassification)}</strong>
                </span>
              ) : null}
            </p>
            {isOwner ? (
              <div className="row gap wrap">
                <button type="button" onClick={() => void onCopyLink()}>
                  Copiar link do paciente
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={!formComplete || dirty}
                  title={
                    !formComplete
                      ? 'Conclua o prontuário antes de encerrar'
                      : dirty
                        ? 'Salve o prontuário antes de encerrar'
                        : undefined
                  }
                  onClick={() => setFinishChoice('encerrar')}
                >
                  Encerrar
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={!formComplete || dirty}
                  title={
                    !formComplete
                      ? 'Conclua o prontuário antes de encaminhar'
                      : dirty
                        ? 'Salve o prontuário antes de encaminhar'
                        : undefined
                  }
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
                <VideoRoom
                  key={id}
                  token={video.token}
                  url={video.url}
                  enabled
                />
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
                  perspective="PROFISSIONAL"
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
                  {canEdit ? (
                    <div className="prontuario-progress" aria-live="polite">
                      <div className="prontuario-progress__bar">
                        <span
                          style={{
                            width: `${Math.round(
                              (filledCount / totalRequired) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="muted">
                        {formComplete
                          ? 'Formulário completo — você já pode salvar.'
                          : `${filledCount}/${totalRequired} campos obrigatórios preenchidos`}
                      </p>
                      {!formComplete ? (
                        <p className="prontuario-missing">
                          Faltam:{' '}
                          {missingFields
                            .map(labelForProntuarioField)
                            .join(', ')}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {saveOk ? (
                    <p className="save-ok">Prontuário salvo com sucesso.</p>
                  ) : null}
                  <form
                    className="prontuario-form"
                    onSubmit={(e) => void onSaveProntuario(e)}
                    noValidate
                  >
                    <fieldset className="prontuario-fieldset" disabled={!canEdit}>
                      <legend>Triagem clínica</legend>
                      <label>
                        <span className="field-label">
                          Queixa <span className="req" aria-hidden>*</span>
                        </span>
                        <textarea
                          name="queixa"
                          required
                          value={prontuario.queixa}
                          onChange={(e) => {
                            patchProntuario({ queixa: e.target.value });
                          }}
                        />
                      </label>
                      <label>
                        <span className="field-label">
                          Anamnese <span className="req" aria-hidden>*</span>
                        </span>
                        <textarea
                          name="anamnese"
                          required
                          value={prontuario.anamnese}
                          onChange={(e) => {
                            patchProntuario({ anamnese: e.target.value });
                          }}
                        />
                      </label>
                      <label>
                        <span className="field-label">
                          Conduta <span className="req" aria-hidden>*</span>
                        </span>
                        <textarea
                          name="conduta"
                          required
                          value={prontuario.conduta}
                          onChange={(e) => {
                            patchProntuario({ conduta: e.target.value });
                          }}
                        />
                      </label>
                      <label>
                        <span className="field-label">
                          Classificação de risco{' '}
                          <span className="req" aria-hidden>*</span>
                        </span>
                        <select
                          name="riskClassification"
                          required
                          value={prontuario.riskClassification ?? ''}
                          onChange={(e) => {
                            patchProntuario({
                              riskClassification: parseRiskClassification(
                                e.target.value,
                              ),
                            });
                          }}
                        >
                          <option value="">Selecione…</option>
                          <option value="VERMELHO">Vermelho</option>
                          <option value="LARANJA">Laranja</option>
                          <option value="AMARELO">Amarelo</option>
                          <option value="VERDE">Verde</option>
                          <option value="AZUL">Azul</option>
                        </select>
                      </label>
                    </fieldset>

                    <fieldset className="prontuario-fieldset" disabled={!canEdit}>
                      <legend>Sinais vitais</legend>
                      <div className="filters">
                        <label className={vitalClass('paSistolica')}>
                          <span className="field-label">
                            PA sistólica{' '}
                            <span className="req" aria-hidden>*</span>
                          </span>
                          <input
                            name="paSistolica"
                            type="number"
                            required
                            min={50}
                            max={300}
                            className={vitalClass('paSistolica')}
                            aria-invalid={Boolean(fieldErrors.paSistolica)}
                            value={prontuario.paSistolica ?? ''}
                            onChange={(e) => {
                              patchProntuario({
                                paSistolica: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              });
                            }}
                          />
                          {fieldErrors.paSistolica ? (
                            <span className="field-error">
                              {fieldErrors.paSistolica}
                            </span>
                          ) : null}
                        </label>
                        <label className={vitalClass('paDiastolica')}>
                          <span className="field-label">
                            PA diastólica{' '}
                            <span className="req" aria-hidden>*</span>
                          </span>
                          <input
                            name="paDiastolica"
                            type="number"
                            required
                            min={20}
                            max={200}
                            className={vitalClass('paDiastolica')}
                            aria-invalid={Boolean(fieldErrors.paDiastolica)}
                            value={prontuario.paDiastolica ?? ''}
                            onChange={(e) => {
                              patchProntuario({
                                paDiastolica: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              });
                            }}
                          />
                          {fieldErrors.paDiastolica ? (
                            <span className="field-error">
                              {fieldErrors.paDiastolica}
                            </span>
                          ) : null}
                        </label>
                        <label className={vitalClass('fc')}>
                          <span className="field-label">
                            FC <span className="req" aria-hidden>*</span>
                          </span>
                          <input
                            name="fc"
                            type="number"
                            required
                            min={20}
                            max={250}
                            className={vitalClass('fc')}
                            aria-invalid={Boolean(fieldErrors.fc)}
                            value={prontuario.fc ?? ''}
                            onChange={(e) => {
                              patchProntuario({
                                fc: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              });
                            }}
                          />
                          {fieldErrors.fc ? (
                            <span className="field-error">{fieldErrors.fc}</span>
                          ) : null}
                        </label>
                        <label className={vitalClass('temperatura')}>
                          <span className="field-label">
                            Temp (°C) <span className="req" aria-hidden>*</span>
                          </span>
                          <input
                            name="temperatura"
                            type="number"
                            required
                            step="0.1"
                            min={30}
                            max={45}
                            className={vitalClass('temperatura')}
                            aria-invalid={Boolean(fieldErrors.temperatura)}
                            value={prontuario.temperatura ?? ''}
                            onChange={(e) => {
                              patchProntuario({
                                temperatura: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              });
                            }}
                          />
                          {fieldErrors.temperatura ? (
                            <span className="field-error">
                              {fieldErrors.temperatura}
                            </span>
                          ) : null}
                        </label>
                        <label className={vitalClass('spo2')}>
                          <span className="field-label">
                            SpO₂ <span className="req" aria-hidden>*</span>
                          </span>
                          <input
                            name="spo2"
                            type="number"
                            required
                            min={50}
                            max={100}
                            className={vitalClass('spo2')}
                            aria-invalid={Boolean(fieldErrors.spo2)}
                            value={prontuario.spo2 ?? ''}
                            onChange={(e) => {
                              patchProntuario({
                                spo2: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              });
                            }}
                          />
                          {fieldErrors.spo2 ? (
                            <span className="field-error">
                              {fieldErrors.spo2}
                            </span>
                          ) : null}
                        </label>
                      </div>
                    </fieldset>

                    {role === 'MEDICO' || prontuario.prescricao ? (
                      <fieldset
                        className="prontuario-fieldset"
                        disabled={!canEdit || role !== 'MEDICO'}
                      >
                        <legend>Conduta médica</legend>
                        <label>
                          <span className="field-label">
                            Prescrição
                            {role === 'MEDICO' ? (
                              <>
                                {' '}
                                <span className="req" aria-hidden>*</span>
                              </>
                            ) : null}
                          </span>
                          <textarea
                            name="prescricao"
                            required={role === 'MEDICO'}
                            value={prontuario.prescricao}
                            onChange={(e) => {
                              patchProntuario({
                                prescricao: e.target.value,
                              });
                            }}
                          />
                        </label>
                        <label>
                          <span className="field-label">Complemento médico</span>
                          <textarea
                            name="complementoMedico"
                            value={prontuario.complementoMedico}
                            onChange={(e) => {
                              patchProntuario({
                                complementoMedico: e.target.value,
                              });
                            }}
                          />
                        </label>
                      </fieldset>
                    ) : null}

                    {canEdit ? (
                      <div className="prontuario-actions">
                        <button
                          type="submit"
                          className={canSave ? undefined : 'btn-blocked'}
                          disabled={!canSave}
                          aria-disabled={!canSave}
                        >
                          Salvar prontuário
                        </button>
                        {!formComplete ? (
                          <p className="prontuario-missing">
                            Salvamento bloqueado. Faltam:{' '}
                            {missingFields
                              .map(labelForProntuarioField)
                              .join(', ')}
                          </p>
                        ) : dirty ? (
                          <p className="muted">
                            Formulário completo. Clique em salvar para gravar.
                          </p>
                        ) : (
                          <p className="muted">
                            Prontuário salvo. Encerrar e encaminhar liberados.
                          </p>
                        )}
                      </div>
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
