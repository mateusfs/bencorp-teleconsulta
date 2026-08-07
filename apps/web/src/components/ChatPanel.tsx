import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { io, type Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type ChatMessageView = {
  id: string;
  authorKind: 'PROFISSIONAL' | 'PACIENTE';
  body: string;
  createdAt: string;
};

type ChatPanelProps = {
  atendimentoId: string;
  accessToken: string;
  enabled: boolean;
  perspective: 'PROFISSIONAL' | 'PACIENTE';
};

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ChatPanel({
  atendimentoId,
  accessToken,
  enabled,
  perspective,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !accessToken) {
      return;
    }

    const client = io(`${API_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    client.on('connect', () => {
      setConnected(true);
      setError(null);
      client.emit(
        'join',
        { atendimentoId },
        (ack: { ok: boolean; messages?: ChatMessageView[] }) => {
          if (ack?.ok && ack.messages) {
            setMessages(ack.messages);
          }
        },
      );
    });

    client.on('disconnect', () => {
      setConnected(false);
    });

    client.on('message', (msg: ChatMessageView) => {
      setMessages((prev) => [...prev, msg]);
    });

    client.on('connect_error', (err) => {
      setConnected(false);
      setError(
        err.message.toLowerCase().includes('unauthorized')
          ? 'Não foi possível autenticar o chat.'
          : 'Falha na conexão do chat.',
      );
    });

    setSocket(client);

    return () => {
      client.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [atendimentoId, accessToken, enabled]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onSend(event: FormEvent): void {
    event.preventDefault();
    if (!socket || !text.trim()) {
      return;
    }
    const body = text.trim();
    setText('');
    socket.emit('message', { atendimentoId, text: body }, () => undefined);
  }

  return (
    <div className="chat-panel">
      <header className="chat-header">
        <div>
          <h3>Chat da sala</h3>
          <p className="chat-subtitle">Mensagens desta consulta</p>
        </div>
        <span
          className={`chat-presence ${connected ? 'is-online' : 'is-offline'}`}
        >
          {connected ? 'Online' : 'Offline'}
        </span>
      </header>

      {error ? <p className="error chat-error">{error}</p> : null}

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <p className="chat-empty">
            Nenhuma mensagem ainda. Envie a primeira para iniciar a conversa.
          </p>
        ) : (
          messages.map((msg) => {
            const mine = msg.authorKind === perspective;
            return (
              <div
                key={msg.id}
                className={`chat-bubble-row ${mine ? 'is-mine' : 'is-theirs'}`}
              >
                <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                  <span className="chat-bubble-author">
                    {mine
                      ? 'Você'
                      : msg.authorKind === 'PACIENTE'
                        ? 'Paciente'
                        : 'Profissional'}
                  </span>
                  <p className="chat-bubble-body">{msg.body}</p>
                  <time className="chat-bubble-time" dateTime={msg.createdAt}>
                    {formatTime(msg.createdAt)}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form className="chat-composer" onSubmit={onSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma mensagem…"
          disabled={!enabled || !connected}
          aria-label="Mensagem do chat"
        />
        <button type="submit" disabled={!enabled || !connected || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
