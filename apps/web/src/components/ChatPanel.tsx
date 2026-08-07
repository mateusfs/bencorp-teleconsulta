import { useEffect, useState } from 'react';
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
};

export function ChatPanel({
  atendimentoId,
  accessToken,
  enabled,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !accessToken) {
      return;
    }

    const client = io(`${API_URL}/chat`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    client.on('connect', () => {
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

    client.on('message', (msg: ChatMessageView) => {
      setMessages((prev) => [...prev, msg]);
    });

    client.on('connect_error', (err) => {
      setError(err.message);
    });

    setSocket(client);

    return () => {
      client.disconnect();
      setSocket(null);
    };
  }, [atendimentoId, accessToken, enabled]);

  async function onSend(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!socket || !text.trim()) {
      return;
    }
    socket.emit('message', { atendimentoId, text: text.trim() }, () => {
      setText('');
    });
  }

  return (
    <div className="chat-panel">
      <h3>Chat</h3>
      {error ? <p className="error">{error}</p> : null}
      <ul className="chat-list">
        {messages.map((msg) => (
          <li key={msg.id}>
            <span className="muted">{msg.authorKind}</span> — {msg.body}
          </li>
        ))}
      </ul>
      <form className="chat-form" onSubmit={(e) => void onSend(e)}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem"
          disabled={!enabled}
        />
        <button type="submit" disabled={!enabled || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
