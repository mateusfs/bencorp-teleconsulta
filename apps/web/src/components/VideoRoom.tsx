import { useEffect, useRef, useState } from 'react';
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  createLocalVideoTrack,
  type LocalAudioTrack,
  type LocalVideoTrack,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from 'livekit-client';

type VideoRoomProps = {
  token: string;
  url: string;
  enabled: boolean;
};

type ConnectionPhase =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended'
  | 'error';

type StatusCopy = {
  phase: ConnectionPhase;
  title: string;
  detail: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function humanizeVideoFailure(raw: string): StatusCopy {
  const text = raw.toLowerCase();
  if (
    text.includes('client initiated') ||
    text.includes('publishing rejected') ||
    text.includes('engine not connected')
  ) {
    return {
      phase: 'error',
      title: 'Vídeo instável',
      detail: 'A câmera não entrou a tempo. Toque em Reconectar.',
    };
  }
  if (text.includes('invalid authorization') || text.includes('unauthorized')) {
    return {
      phase: 'error',
      title: 'Sessão de vídeo inválida',
      detail: 'Atualize a página ou reinicie o atendimento.',
    };
  }
  if (
    text.includes('permission') ||
    text.includes('not allowed') ||
    text.includes('denied')
  ) {
    return {
      phase: 'error',
      title: 'Câmera ou microfone bloqueados',
      detail: 'Permita o acesso no navegador e reconecte.',
    };
  }
  if (
    text.includes('failed to fetch') ||
    text.includes('websocket') ||
    text.includes('network') ||
    text.includes('timeout')
  ) {
    return {
      phase: 'error',
      title: 'Não foi possível conectar',
      detail: 'Confirme o LiveKit (porta 7880) e tente de novo.',
    };
  }
  return {
    phase: 'error',
    title: 'Falha no vídeo',
    detail: 'Tente reconectar. Se persistir, reinicie o atendimento.',
  };
}

async function waitUntilConnected(
  room: Room,
  signal: AbortSignal,
): Promise<void> {
  if (room.state === ConnectionState.Connected) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const onConnected = (): void => {
      cleanup();
      resolve();
    };
    const onAbort = (): void => {
      cleanup();
      reject(new Error('client initiated disconnect'));
    };
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('timeout aguardando conexão'));
    }, 12_000);

    function cleanup(): void {
      window.clearTimeout(timer);
      room.off(RoomEvent.Connected, onConnected);
      signal.removeEventListener('abort', onAbort);
    }

    room.on(RoomEvent.Connected, onConnected);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function VideoRoom({ token, url, enabled }: VideoRoomProps) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<StatusCopy>({
    phase: 'idle',
    title: 'Aguardando',
    detail: null,
  });
  const [hasRemote, setHasRemote] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled || !token || !url) {
      setStatus({
        phase: 'idle',
        title: 'Vídeo indisponível',
        detail: null,
      });
      return;
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: false,
    });
    const abort = new AbortController();
    let localVideo: LocalVideoTrack | null = null;
    let localAudio: LocalAudioTrack | null = null;

    function attachLocal(): void {
      if (!localVideo || !localRef.current) return;
      localVideo.attach(localRef.current);
    }

    async function publishMedia(): Promise<void> {
      let lastError: unknown;
      for (let tryIndex = 0; tryIndex < 3; tryIndex += 1) {
        if (abort.signal.aborted) return;
        if (room.state !== ConnectionState.Connected) {
          await sleep(400 * (tryIndex + 1));
          continue;
        }
        try {
          if (!localVideo) {
            localVideo = await createLocalVideoTrack({
              facingMode: 'user',
            });
            attachLocal();
          }
          if (!localAudio) {
            localAudio = await createLocalAudioTrack();
          }
          if (abort.signal.aborted) return;
          await room.localParticipant.publishTrack(localVideo);
          if (abort.signal.aborted) return;
          await room.localParticipant.publishTrack(localAudio);
          setStatus({
            phase: 'connected',
            title: 'Ao vivo',
            detail: 'Câmera e microfone ativos.',
          });
          return;
        } catch (err) {
          lastError = err;
          await sleep(500 * (tryIndex + 1));
        }
      }
      if (abort.signal.aborted) return;
      const raw =
        lastError instanceof Error ? lastError.message : 'Falha no vídeo';
      setStatus(humanizeVideoFailure(raw));
    }

    async function connect(): Promise<void> {
      try {
        setHasRemote(false);
        setStatus({
          phase: 'connecting',
          title: 'Conectando…',
          detail: 'Preparando a sala de vídeo.',
        });
        await room.connect(url, token);
        if (abort.signal.aborted) {
          await room.disconnect();
          return;
        }
        await waitUntilConnected(room, abort.signal);
        if (abort.signal.aborted) return;
        setStatus({
          phase: 'connecting',
          title: 'Conectado',
          detail: 'Ativando câmera e microfone…',
        });
        await publishMedia();
      } catch (err) {
        if (abort.signal.aborted) return;
        const raw = err instanceof Error ? err.message : 'Falha no vídeo';
        setStatus(humanizeVideoFailure(raw));
      }
    }

    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.track?.kind === Track.Kind.Video && localRef.current) {
        publication.track.attach(localRef.current);
      }
    });

    room.on(
      RoomEvent.TrackSubscribed,
      (
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        _participant: RemoteParticipant,
      ) => {
        if (track.kind === Track.Kind.Video && remoteRef.current) {
          track.attach(remoteRef.current);
          setHasRemote(true);
        }
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.dataset.livekitAudio = '1';
          document.body.appendChild(el);
        }
      },
    );

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      if (track.kind === Track.Kind.Video) {
        setHasRemote(false);
      }
    });

    room.on(RoomEvent.Reconnecting, () => {
      if (abort.signal.aborted) return;
      setStatus({
        phase: 'reconnecting',
        title: 'Reconectando…',
        detail: 'A conexão caiu; tentando voltar.',
      });
    });

    room.on(RoomEvent.Reconnected, () => {
      if (abort.signal.aborted) return;
      setStatus({
        phase: 'connected',
        title: 'Ao vivo',
        detail: 'Conexão restabelecida.',
      });
    });

    room.on(RoomEvent.Disconnected, () => {
      if (abort.signal.aborted) return;
      setStatus({
        phase: 'ended',
        title: 'Chamada encerrada',
        detail: 'A conexão de vídeo foi finalizada.',
      });
      setHasRemote(false);
    });

    void connect();

    return () => {
      abort.abort();
      document
        .querySelectorAll('[data-livekit-audio="1"]')
        .forEach((el) => el.remove());
      localVideo?.stop();
      localAudio?.stop();
      void room.disconnect().catch(() => undefined);
    };
  }, [enabled, token, url, attempt]);

  const showBanner = status.phase !== 'connected';
  const canRetry = status.phase === 'error' || status.phase === 'ended';

  return (
    <div className="video-room">
      <div className="video-toolbar">
        <span className={`video-pill video-pill--${status.phase}`}>
          <span className="video-pill__dot" aria-hidden />
          {status.title}
        </span>
        {status.detail ? (
          <span className="video-toolbar__detail">{status.detail}</span>
        ) : null}
        {canRetry ? (
          <button
            type="button"
            className="video-retry"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Reconectar
          </button>
        ) : null}
      </div>

      <div className="video-grid">
        <div className="video-tile-wrap">
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            className="video-tile"
          />
          <span className="video-tile-label">Você</span>
        </div>
        <div className="video-tile-wrap">
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="video-tile"
          />
          <span className="video-tile-label">
            {hasRemote ? 'Participante' : 'Aguardando participante'}
          </span>
          {!hasRemote && status.phase === 'connected' ? (
            <div className="video-tile-empty">
              <p>Aguardando o outro lado entrar na sala</p>
            </div>
          ) : null}
        </div>
      </div>

      {showBanner ? (
        <div
          className={`video-banner video-banner--${status.phase}`}
          role="status"
        >
          <strong>{status.title}</strong>
          {status.detail ? <p>{status.detail}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
