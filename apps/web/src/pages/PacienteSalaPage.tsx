import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { resgatarLinkPaciente } from '../api';
import type { ResgatarLinkResponse } from '../api';
import { ChatPanel } from '../components/ChatPanel';
import { VideoRoom } from '../components/VideoRoom';

export function PacienteSalaPage() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<ResgatarLinkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Link inválido');
      setLoading(false);
      return;
    }
    void resgatarLinkPaciente(token)
      .then((result) => {
        setSession(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Falha ao entrar');
        setLoading(false);
      });
  }, [token]);

  return (
    <main className="page page-sala">
      <h1>Sala do paciente</h1>
      <p className="muted">Acesso por link temporário — sem login.</p>
      {loading ? <p className="muted">Entrando na sala…</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {session ? (
        <div className="sala-grid paciente">
          <section className="card sala-panel">
            <h2>Vídeo</h2>
            <VideoRoom
              token={session.video.token}
              url={session.video.url}
              enabled
            />
          </section>
          <section className="card sala-panel">
            <ChatPanel
              atendimentoId={session.atendimentoId}
              accessToken={session.patientAccessToken}
              enabled
            />
          </section>
        </div>
      ) : null}
    </main>
  );
}
