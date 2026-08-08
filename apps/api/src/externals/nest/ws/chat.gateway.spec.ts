import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import {
  EnviarMensagemChatUseCase,
  ListarMensagensChatUseCase,
} from '@/app/use-cases/chat-sala';
import {
  ForbiddenError,
  ValidationError,
} from '@/entities/errors/domain-error';
import { UserRole } from '@/entities/user-role';
import { ChatGateway } from '@/externals/nest/ws/chat.gateway';

function mockSocket(overrides: Partial<Socket> = {}): Socket {
  return {
    handshake: { auth: { token: 't' }, headers: {} },
    join: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    ...overrides,
  } as unknown as Socket;
}

describe('ChatGateway', () => {
  function setup() {
    const jwt = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    const listar = {
      execute: jest.fn(),
    } as unknown as ListarMensagensChatUseCase;
    const enviar = {
      execute: jest.fn(),
    } as unknown as EnviarMensagemChatUseCase;
    const gateway = new ChatGateway(jwt, listar, enviar);
    gateway.server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    } as unknown as ChatGateway['server'];
    return { gateway, jwt, listar, enviar };
  }

  async function connectProfessional(
    gateway: ChatGateway,
    jwt: JwtService,
    client: Socket,
  ): Promise<void> {
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'prof-1',
      role: UserRole.ENFERMEIRO,
    });
    await gateway.handleConnection(client);
  }

  it('join só após listar e devolve mensagens', async () => {
    const { gateway, jwt, listar } = setup();
    const client = mockSocket();
    await connectProfessional(gateway, jwt, client);
    (listar.execute as jest.Mock).mockResolvedValue([{ id: 'm1' }]);

    const ack = await gateway.join(client, { atendimentoId: ' at-1 ' });

    expect(listar.execute).toHaveBeenCalledWith({
      atendimentoId: 'at-1',
      role: UserRole.ENFERMEIRO,
      professionalUserId: 'prof-1',
      patientAtendimentoId: undefined,
    });
    expect(client.join).toHaveBeenCalledWith('atendimento:at-1');
    expect(ack).toEqual({ ok: true, messages: [{ id: 'm1' }] });
  });

  it('join mapeia DomainError para ack sem entrar na room', async () => {
    const { gateway, jwt, listar } = setup();
    const client = mockSocket();
    await connectProfessional(gateway, jwt, client);
    (listar.execute as jest.Mock).mockRejectedValue(
      new ForbiddenError('Acesso negado'),
    );

    const ack = await gateway.join(client, { atendimentoId: 'at-1' });

    expect(client.join).not.toHaveBeenCalled();
    expect(ack).toEqual({
      ok: false,
      code: 'FORBIDDEN',
      message: 'Acesso negado',
    });
  });

  it('message mapeia ValidationError e não emite', async () => {
    const { gateway, jwt, enviar } = setup();
    const client = mockSocket();
    await connectProfessional(gateway, jwt, client);
    (enviar.execute as jest.Mock).mockRejectedValue(
      new ValidationError('Mensagem vazia'),
    );

    const ack = await gateway.message(client, {
      atendimentoId: 'at-1',
      text: '   ',
    });

    expect(gateway.server.to).not.toHaveBeenCalled();
    expect(ack).toEqual({
      ok: false,
      code: 'VALIDATION',
      message: 'Mensagem vazia',
    });
  });

  it('paciente com atendimento cruzado recebe FORBIDDEN no join', async () => {
    const { gateway, jwt, listar } = setup();
    const client = mockSocket();
    (jwt.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'pac-1',
      kind: 'patient',
      atendimentoId: 'at-outro',
    });
    await gateway.handleConnection(client);

    const ack = await gateway.join(client, { atendimentoId: 'at-1' });

    expect(listar.execute).not.toHaveBeenCalled();
    expect(ack.code).toBe('FORBIDDEN');
    expect(ack.ok).toBe(false);
  });
});
