import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  EnviarMensagemChatUseCase,
  ListarMensagensChatUseCase,
} from '@/app/use-cases/chat-sala';
import { UserRole } from '@/entities/user-role';

type SocketAuth = {
  kind: 'professional' | 'patient';
  userId?: string;
  role?: UserRole;
  patientId?: string;
  atendimentoId?: string;
};

type JwtPayload = {
  sub: string;
  kind?: 'professional' | 'patient';
  email?: string;
  role?: UserRole;
  atendimentoId?: string;
};

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly authBySocket = new WeakMap<Socket, SocketAuth>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly listar: ListarMensagensChatUseCase,
    private readonly enviar: EnviarMensagemChatUseCase,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.readToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      this.authBySocket.set(client, this.toAuth(payload));
    } catch (error) {
      this.logger.warn(`WS auth falhou: ${String(error)}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { atendimentoId: string },
  ): Promise<{ ok: boolean; messages: unknown[] }> {
    const auth = this.authBySocket.get(client);
    if (!auth || !body.atendimentoId) {
      return { ok: false, messages: [] };
    }

    this.assertAccess(auth, body.atendimentoId);
    await client.join(this.room(body.atendimentoId));

    const messages = await this.listar.execute({
      atendimentoId: body.atendimentoId,
      role: auth.kind === 'professional' ? auth.role : undefined,
      patientAtendimentoId:
        auth.kind === 'patient' ? auth.atendimentoId : undefined,
    });

    return { ok: true, messages };
  }

  @SubscribeMessage('message')
  async message(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { atendimentoId: string; text: string },
  ): Promise<{ ok: boolean }> {
    const auth = this.authBySocket.get(client);
    if (!auth || !body.atendimentoId) {
      return { ok: false };
    }

    this.assertAccess(auth, body.atendimentoId);

    const saved = await this.enviar.execute({
      atendimentoId: body.atendimentoId,
      body: body.text,
      professionalUserId:
        auth.kind === 'professional' ? auth.userId : undefined,
      role: auth.kind === 'professional' ? auth.role : undefined,
      patientAtendimentoId:
        auth.kind === 'patient' ? auth.atendimentoId : undefined,
    });

    this.server.to(this.room(body.atendimentoId)).emit('message', saved);
    return { ok: true };
  }

  private readToken(client: Socket): string | undefined {
    const fromAuth = client.handshake.auth;
    if (
      typeof fromAuth === 'object' &&
      fromAuth !== null &&
      'token' in fromAuth &&
      typeof fromAuth.token === 'string'
    ) {
      return fromAuth.token;
    }
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string') {
      return header.replace(/^Bearer\s+/i, '');
    }
    return undefined;
  }

  private room(atendimentoId: string): string {
    return `atendimento:${atendimentoId}`;
  }

  private assertAccess(auth: SocketAuth, atendimentoId: string): void {
    if (auth.kind === 'patient' && auth.atendimentoId !== atendimentoId) {
      throw new Error('mismatch');
    }
  }

  private toAuth(payload: JwtPayload): SocketAuth {
    if (payload.kind === 'patient') {
      return {
        kind: 'patient',
        patientId: payload.sub,
        atendimentoId: payload.atendimentoId,
      };
    }
    return {
      kind: 'professional',
      userId: payload.sub,
      role: payload.role,
    };
  }
}
