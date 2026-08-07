import { CancelarAtendimentoUseCase } from './cancelar-atendimento';
import {
  buildAtendimento,
  InMemoryAtendimentoRepository,
} from '../__tests__/atendimento-test-doubles';
import { AtendimentoStatus } from '@/entities/atendimento';
import { UnprocessableStateError } from '@/entities/errors/domain-error';

describe('CancelarAtendimentoUseCase', () => {
  it('cancela AGUARDANDO', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const item = buildAtendimento();
    repo.seed(item);
    const useCase = new CancelarAtendimentoUseCase(repo);

    const result = await useCase.execute(item.id);
    expect(result.status).toBe(AtendimentoStatus.CANCELADO);
  });

  it('recusa cancelar EM_ANDAMENTO com 422', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const item = buildAtendimento({
      status: AtendimentoStatus.EM_ANDAMENTO,
      professionalId: 'p1',
    });
    repo.seed(item);
    const useCase = new CancelarAtendimentoUseCase(repo);

    await expect(useCase.execute(item.id)).rejects.toBeInstanceOf(
      UnprocessableStateError,
    );
  });
});
