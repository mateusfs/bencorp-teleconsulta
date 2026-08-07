import { EncaminharAtendimentoMedicoUseCase } from './encaminhar-atendimento-medico';
import { EncerrarAtendimentoUseCase } from '../encerrar-atendimento/encerrar-atendimento';
import {
  buildAtendimento,
  InMemoryAtendimentoRepository,
  SpyRoomTokenRevoker,
} from '../__tests__/atendimento-test-doubles';
import {
  AtendimentoStatus,
  ClassificacaoRisco,
  DesfechoAtendimento,
} from '@/entities/atendimento';
import { ForbiddenError } from '@/entities/errors/domain-error';
import { UserRole } from '@/entities/user-role';
import { ListarFilaAtendimentoUseCase } from '../listar-fila-atendimento/listar-fila-atendimento';

describe('Encerrar e Encaminhar', () => {
  const professionalId = 'prof-1';

  it('encerra com desfecho ENCERRADO e revoga tokens', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const revoker = new SpyRoomTokenRevoker();
    const item = buildAtendimento({
      status: AtendimentoStatus.EM_ANDAMENTO,
      professionalId,
    });
    repo.seed(item);
    const useCase = new EncerrarAtendimentoUseCase(repo, revoker);

    const result = await useCase.execute(item.id, professionalId);

    expect(result.status).toBe(AtendimentoStatus.FINALIZADO);
    expect(result.desfecho).toBe(DesfechoAtendimento.ENCERRADO);
    expect(revoker.revoked).toEqual([item.id]);
    const children = await repo.listFila({ encaminhadosOnly: true });
    expect(children).toHaveLength(0);
  });

  it('encaminha: finaliza pai, cria filho AGUARDANDO e herda risco', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const revoker = new SpyRoomTokenRevoker();
    const item = buildAtendimento({
      status: AtendimentoStatus.EM_ANDAMENTO,
      professionalId,
      riskClassification: ClassificacaoRisco.LARANJA,
    });
    repo.seed(item);
    const useCase = new EncaminharAtendimentoMedicoUseCase(repo, revoker);

    const result = await useCase.execute(item.id, professionalId);

    expect(result.parent.status).toBe(AtendimentoStatus.FINALIZADO);
    expect(result.parent.desfecho).toBe(DesfechoAtendimento.ENCAMINHADO_MEDICO);
    expect(result.child.status).toBe(AtendimentoStatus.AGUARDANDO);
    expect(result.child.encaminhadoDeId).toBe(item.id);
    expect(result.child.riskClassification).toBe(ClassificacaoRisco.LARANJA);
    expect(revoker.revoked).toEqual([item.id]);
  });

  it('impede encerrar por profissional que não é o dono', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const item = buildAtendimento({
      status: AtendimentoStatus.EM_ANDAMENTO,
      professionalId,
    });
    repo.seed(item);
    const useCase = new EncerrarAtendimentoUseCase(
      repo,
      new SpyRoomTokenRevoker(),
    );

    await expect(useCase.execute(item.id, 'outro')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('filtro encaminhadosOnly só para MEDICO', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const useCase = new ListarFilaAtendimentoUseCase(repo);

    await expect(
      useCase.execute(UserRole.ENFERMEIRO, { encaminhadosOnly: true }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      useCase.execute(UserRole.MEDICO, { encaminhadosOnly: true }),
    ).resolves.toEqual([]);
  });
});
