import { EmitirTokenSalaUseCase } from '@/app/use-cases/emitir-token-sala/emitir-token-sala';
import { CriarLinkPacienteUseCase } from '@/app/use-cases/criar-link-paciente/criar-link-paciente';
import { ResgatarLinkPacienteUseCase } from '@/app/use-cases/resgatar-link-paciente/resgatar-link-paciente';
import {
  buildAtendimento,
  InMemoryAtendimentoRepository,
} from '@/app/use-cases/__tests__/atendimento-test-doubles';
import { fixedTokenService } from '@/app/use-cases/__tests__/test-doubles';
import {
  FakeVideoRoomProvider,
  hashInviteToken,
  InMemoryPatientInviteRepository,
} from '@/app/use-cases/__tests__/telepresenca-test-doubles';
import { EncerrarAtendimentoUseCase } from '@/app/use-cases/encerrar-atendimento/encerrar-atendimento';
import { AtendimentoStatus } from '@/entities/atendimento';
import {
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnprocessableStateError,
} from '@/entities/errors/domain-error';
import { roomNameForAtendimento } from '@/entities/sala';
import { UserRole } from '@/entities/user-role';
import { RoomTokenRevoker } from '@/app/contracts/room-token-revoker';

describe('Telepresença use cases', () => {
  const professionalId = 'prof-1';

  function emAndamentoRepo(): InMemoryAtendimentoRepository {
    const repo = new InMemoryAtendimentoRepository();
    repo.seed(
      buildAtendimento({
        id: 'at-1',
        patientId: 'pac-1',
        status: AtendimentoStatus.EM_ANDAMENTO,
        professionalId,
      }),
    );
    return repo;
  }

  it('emite token só em EM_ANDAMENTO para o responsável', async () => {
    const video = new FakeVideoRoomProvider();
    const useCase = new EmitirTokenSalaUseCase(emAndamentoRepo(), video);
    const token = await useCase.execute({
      atendimentoId: 'at-1',
      userId: professionalId,
      role: UserRole.ENFERMEIRO,
    });
    expect(token.expiresInSeconds).toBe(15 * 60);
    expect(token.token).toContain('profissional-prof-1');
  });

  it('recusa token fora de EM_ANDAMENTO', async () => {
    const repo = new InMemoryAtendimentoRepository();
    repo.seed(
      buildAtendimento({
        id: 'at-2',
        status: AtendimentoStatus.AGUARDANDO,
        professionalId,
      }),
    );
    const useCase = new EmitirTokenSalaUseCase(
      repo,
      new FakeVideoRoomProvider(),
    );
    await expect(
      useCase.execute({
        atendimentoId: 'at-2',
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
      }),
    ).rejects.toBeInstanceOf(UnprocessableStateError);
  });

  it('ADMIN não emite token', async () => {
    const useCase = new EmitirTokenSalaUseCase(
      emAndamentoRepo(),
      new FakeVideoRoomProvider(),
    );
    await expect(
      useCase.execute({
        atendimentoId: 'at-1',
        userId: professionalId,
        role: UserRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('cria e resgata link single-use; segundo uso falha', async () => {
    const atendimentos = emAndamentoRepo();
    const invites = new InMemoryPatientInviteRepository();
    const video = new FakeVideoRoomProvider();
    const criar = new CriarLinkPacienteUseCase(atendimentos, invites);
    const resgatar = new ResgatarLinkPacienteUseCase(
      atendimentos,
      invites,
      fixedTokenService,
      video,
    );

    const { inviteUrl } = await criar.execute({
      atendimentoId: 'at-1',
      userId: professionalId,
      role: UserRole.ENFERMEIRO,
    });
    const raw = inviteUrl.split('/').pop()!;
    expect(invites.items.size).toBe(1);
    expect([...invites.items.values()][0]?.tokenHash).toBe(
      hashInviteToken(raw),
    );

    const first = await resgatar.execute({ rawToken: raw });
    expect(first.atendimentoId).toBe('at-1');
    expect(first.patientAccessToken).toBe('patient-token-test');
    expect(first.video.token).toContain('paciente-pac-1');

    await expect(resgatar.execute({ rawToken: raw })).rejects.toBeInstanceOf(
      GoneError,
    );
  });

  it('link de outro atendimento → 403', async () => {
    const atendimentos = emAndamentoRepo();
    const invites = new InMemoryPatientInviteRepository();
    const criar = new CriarLinkPacienteUseCase(atendimentos, invites);
    const resgatar = new ResgatarLinkPacienteUseCase(
      atendimentos,
      invites,
      fixedTokenService,
      new FakeVideoRoomProvider(),
    );
    const { inviteUrl } = await criar.execute({
      atendimentoId: 'at-1',
      userId: professionalId,
      role: UserRole.MEDICO,
    });
    const raw = inviteUrl.split('/').pop()!;
    await expect(
      resgatar.execute({
        rawToken: raw,
        expectedAtendimentoId: 'outro-atendimento',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('finalize revoga convites e deleta sala LiveKit', async () => {
    const atendimentos = emAndamentoRepo();
    const invites = new InMemoryPatientInviteRepository();
    const video = new FakeVideoRoomProvider();
    await invites.create({
      atendimentoId: 'at-1',
      tokenHash: 'abc',
      expiresAt: new Date(Date.now() + 60_000),
      createdByUserId: professionalId,
    });
    const revoker: RoomTokenRevoker = {
      async revokeAllForAtendimento(atendimentoId: string): Promise<void> {
        await invites.revokeAllForAtendimento(atendimentoId, new Date());
        await video.deleteRoom(roomNameForAtendimento(atendimentoId));
      },
    };
    const encerrar = new EncerrarAtendimentoUseCase(atendimentos, revoker);
    await encerrar.execute('at-1', professionalId);
    expect([...invites.items.values()][0]?.revokedAt).not.toBeNull();
    expect(video.deletedRooms).toContain(roomNameForAtendimento('at-1'));
  });

  it('emite 404 e ownership; cria link com mesmas regras', async () => {
    const video = new FakeVideoRoomProvider();
    const repo = emAndamentoRepo();
    const emitir = new EmitirTokenSalaUseCase(repo, video);
    await expect(
      emitir.execute({
        atendimentoId: 'missing',
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      emitir.execute({
        atendimentoId: 'at-1',
        userId: 'outro',
        role: UserRole.ENFERMEIRO,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const invites = new InMemoryPatientInviteRepository();
    const criar = new CriarLinkPacienteUseCase(repo, invites);
    await expect(
      criar.execute({
        atendimentoId: 'at-1',
        userId: professionalId,
        role: UserRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      criar.execute({
        atendimentoId: 'missing',
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      criar.execute({
        atendimentoId: 'at-1',
        userId: 'outro',
        role: UserRole.ENFERMEIRO,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('resgatar cobre link inexistente, expirado, revogado e atendimento ausente', async () => {
    const atendimentos = emAndamentoRepo();
    const invites = new InMemoryPatientInviteRepository();
    const resgatar = new ResgatarLinkPacienteUseCase(
      atendimentos,
      invites,
      fixedTokenService,
      new FakeVideoRoomProvider(),
    );

    await expect(
      resgatar.execute({ rawToken: 'nao-existe' }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const expired = await invites.create({
      atendimentoId: 'at-1',
      tokenHash: hashInviteToken('expired-token'),
      expiresAt: new Date(Date.now() - 1000),
      createdByUserId: professionalId,
    });
    expect(expired.id).toBeTruthy();
    await expect(
      resgatar.execute({ rawToken: 'expired-token' }),
    ).rejects.toBeInstanceOf(GoneError);

    await invites.create({
      atendimentoId: 'at-1',
      tokenHash: hashInviteToken('revoked-token'),
      expiresAt: new Date(Date.now() + 60_000),
      createdByUserId: professionalId,
    });
    await invites.revokeAllForAtendimento('at-1', new Date());
    await expect(
      resgatar.execute({ rawToken: 'revoked-token' }),
    ).rejects.toBeInstanceOf(GoneError);

    const orphanInvites = new InMemoryPatientInviteRepository();
    await orphanInvites.create({
      atendimentoId: 'fantasma',
      tokenHash: hashInviteToken('orphan'),
      expiresAt: new Date(Date.now() + 60_000),
      createdByUserId: professionalId,
    });
    const orphanResgatar = new ResgatarLinkPacienteUseCase(
      atendimentos,
      orphanInvites,
      fixedTokenService,
      new FakeVideoRoomProvider(),
    );
    await expect(
      orphanResgatar.execute({ rawToken: 'orphan' }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const finalized = new InMemoryAtendimentoRepository();
    finalized.seed(
      buildAtendimento({
        id: 'at-fin',
        patientId: 'pac-1',
        status: AtendimentoStatus.FINALIZADO,
        professionalId,
      }),
    );
    const finInvites = new InMemoryPatientInviteRepository();
    await finInvites.create({
      atendimentoId: 'at-fin',
      tokenHash: hashInviteToken('fin'),
      expiresAt: new Date(Date.now() + 60_000),
      createdByUserId: professionalId,
    });
    const finResgatar = new ResgatarLinkPacienteUseCase(
      finalized,
      finInvites,
      fixedTokenService,
      new FakeVideoRoomProvider(),
    );
    await expect(
      finResgatar.execute({ rawToken: 'fin' }),
    ).rejects.toBeInstanceOf(GoneError);
  });
});
