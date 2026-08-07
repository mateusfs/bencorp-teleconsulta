import { useEffect, useRef, useState } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from 'livekit-client';

type VideoRoomProps = {
  token: string;
  url: string;
  enabled: boolean;
};

export function VideoRoom({ token, url, enabled }: VideoRoomProps) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Desconectado');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !token || !url) {
      return;
    }

    const room = new Room({ adaptiveStream: true, dynacast: true });
    let cancelled = false;

    async function connect(): Promise<void> {
      try {
        setStatus('Conectando…');
        await room.connect(url, token);
        if (cancelled) {
          await room.disconnect();
          return;
        }
        setStatus('Conectado');
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);

        const localVideo = localRef.current;
        for (const publication of room.localParticipant.trackPublications.values()) {
          if (publication.track && publication.track.kind === Track.Kind.Video) {
            publication.track.attach(localVideo!);
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
            }
            if (track.kind === Track.Kind.Audio) {
              const el = track.attach();
              el.dataset.livekitAudio = '1';
              document.body.appendChild(el);
            }
          },
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha no vídeo');
        setStatus('Erro');
      }
    }

    void connect();

    return () => {
      cancelled = true;
      document
        .querySelectorAll('[data-livekit-audio="1"]')
        .forEach((el) => el.remove());
      void room.disconnect();
    };
  }, [enabled, token, url]);

  return (
    <div className="video-room">
      <p className="muted">{status}</p>
      {error ? <p className="error">{error}</p> : null}
      <div className="video-grid">
        <video ref={localRef} autoPlay playsInline muted className="video-tile" />
        <video ref={remoteRef} autoPlay playsInline className="video-tile" />
      </div>
    </div>
  );
}
