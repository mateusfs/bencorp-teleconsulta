import { IniciarAtendimentoUseCase } from './iniciar-atendimento';
import {
  buildAtendimento,
  InMemoryAtendimentoRepository,
} from '../__tests__/atendimento-test-doubles';
import { AtendimentoStatus } from '@/entities/atendimento';
import {
  ConflictError,
  UnprocessableStateError,
} from '@/entities/errors/domain-error';

describe('IniciarAtendimentoUseCase', () => {
  const professionalId = 'prof-1';

  it('inicia atendimento AGUARDANDO com claim atômico', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const item = buildAtendimento();
    repo.seed(item);
    const useCase = new IniciarAtendimentoUseCase(repo);

    const result = await useCase.execute(item.id, professionalId);

    expect(result.status).toBe(AtendimentoStatus.EM_ANDAMENTO);
    expect(result.professionalId).toBe(professionalId);
    expect(result.startedAt).toBeTruthy();
  });

  it('retorna 409 quando claim falha (concorrência)', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const item = buildAtendimento();
    repo.seed(item);
    const useCase = new IniciarAtendimentoUseCase(repo);
    jest.spyOn(repo, 'claimAtomic').mockResolvedValue(null);

    await expect(
      useCase.execute(item.id, professionalId),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('retorna 409 se profissional já tem EM_ANDAMENTO', async () => {
    const repo = new InMemoryAtendimentoRepository();
    repo.seed(
      buildAtendimento({
        id: 'a1',
        status: AtendimentoStatus.EM_ANDAMENTO,
        professionalId,
      }),
    );
    repo.seed(buildAtendimento({ id: 'a2' }));
    const useCase = new IniciarAtendimentoUseCase(repo);

    await expect(useCase.execute('a2', professionalId)).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('retorna 422 ao iniciar fora de AGUARDANDO', async () => {
    const repo = new InMemoryAtendimentoRepository();
    repo.seed(
      buildAtendimento({
        status: AtendimentoStatus.FINALIZADO,
      }),
    );
    const useCase = new IniciarAtendimentoUseCase(repo);
    const id = [...(await repo.listFila({}))].at(0)!.id;

    await expect(useCase.execute(id, professionalId)).rejects.toBeInstanceOf(
      UnprocessableStateError,
    );
  });
});
