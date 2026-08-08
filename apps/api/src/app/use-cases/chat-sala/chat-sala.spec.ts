import {
  EnviarMensagemChatUseCase,
  ListarMensagensChatUseCase,
} from '@/app/use-cases/chat-sala/chat-sala';
import {
  buildAtendimento,
  InMemoryAtendimentoRepository,
} from '@/app/use-cases/__tests__/atendimento-test-doubles';
import { InMemoryChatMessageRepository } from '@/app/use-cases/__tests__/telepresenca-test-doubles';
import { AtendimentoStatus } from '@/entities/atendimento';
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableStateError,
  ValidationError,
} from '@/entities/errors/domain-error';
import { UserRole } from '@/entities/user-role';

describe('Chat sala use cases', () => {
  function setup() {
    const atendimentos = new InMemoryAtendimentoRepository();
    atendimentos.seed(
      buildAtendimento({
        id: 'at-1',
        status: AtendimentoStatus.EM_ANDAMENTO,
        professionalId: 'prof-1',
      }),
    );
    const messages = new InMemoryChatMessageRepository();
    return {
      listar: new ListarMensagensChatUseCase(atendimentos, messages),
      enviar: new EnviarMensagemChatUseCase(atendimentos, messages),
      messages,
    };
  }

  it('profissional e paciente trocam mensagens em EM_ANDAMENTO', async () => {
    const { listar, enviar } = setup();
    await enviar.execute({
      atendimentoId: 'at-1',
      body: 'Olá paciente',
      professionalUserId: 'prof-1',
      role: UserRole.ENFERMEIRO,
    });
    await enviar.execute({
      atendimentoId: 'at-1',
      body: 'Olá doutor',
      patientAtendimentoId: 'at-1',
    });
    const rows = await listar.execute({
      atendimentoId: 'at-1',
      role: UserRole.ENFERMEIRO,
      professionalUserId: 'prof-1',
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.authorKind).toBe('PROFISSIONAL');
    expect(rows[1]?.authorKind).toBe('PACIENTE');
  });

  it('outro profissional não lê nem envia chat (anti-IDOR)', async () => {
    const { listar, enviar } = setup();
    await expect(
      listar.execute({
        atendimentoId: 'at-1',
        role: UserRole.MEDICO,
        professionalUserId: 'prof-outro',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      enviar.execute({
        atendimentoId: 'at-1',
        body: 'intruso',
        professionalUserId: 'prof-outro',
        role: UserRole.MEDICO,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('recusa mensagem vazia, longa demais e mismatch do paciente', async () => {
    const { enviar } = setup();
    await expect(
      enviar.execute({
        atendimentoId: 'at-1',
        body: '   ',
        professionalUserId: 'prof-1',
        role: UserRole.MEDICO,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      enviar.execute({
        atendimentoId: 'at-1',
        body: 'x'.repeat(4001),
        professionalUserId: 'prof-1',
        role: UserRole.MEDICO,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      enviar.execute({
        atendimentoId: 'at-1',
        body: 'oi',
        patientAtendimentoId: 'outro',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('recusa chat fora de EM_ANDAMENTO no enviar e no listar', async () => {
    const atendimentos = new InMemoryAtendimentoRepository();
    atendimentos.seed(
      buildAtendimento({
        id: 'at-2',
        status: AtendimentoStatus.FINALIZADO,
        professionalId: 'prof-1',
      }),
    );
    const messages = new InMemoryChatMessageRepository();
    const enviar = new EnviarMensagemChatUseCase(atendimentos, messages);
    const listar = new ListarMensagensChatUseCase(atendimentos, messages);
    await expect(
      enviar.execute({
        atendimentoId: 'at-2',
        body: 'tarde demais',
        professionalUserId: 'prof-1',
        role: UserRole.MEDICO,
      }),
    ).rejects.toBeInstanceOf(UnprocessableStateError);

    await expect(
      listar.execute({
        atendimentoId: 'at-2',
        role: UserRole.MEDICO,
        professionalUserId: 'prof-1',
      }),
    ).rejects.toBeInstanceOf(UnprocessableStateError);
  });

  it('listar exige papel clínico ou paciente do atendimento', async () => {
    const { listar, enviar } = setup();
    await expect(
      listar.execute({
        atendimentoId: 'at-1',
        role: UserRole.ADMIN,
        professionalUserId: 'admin',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      listar.execute({
        atendimentoId: 'at-1',
        patientAtendimentoId: 'outro',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      listar.execute({
        atendimentoId: 'missing',
        role: UserRole.ENFERMEIRO,
        professionalUserId: 'prof-1',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      enviar.execute({
        atendimentoId: 'missing',
        body: 'x',
        professionalUserId: 'p',
        role: UserRole.MEDICO,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await expect(
      enviar.execute({
        atendimentoId: 'at-1',
        body: 'x',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const rows = await listar.execute({
      atendimentoId: 'at-1',
      patientAtendimentoId: 'at-1',
    });
    expect(rows).toEqual([]);
  });
});
