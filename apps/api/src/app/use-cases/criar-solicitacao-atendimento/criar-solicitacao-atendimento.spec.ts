import { CriarSolicitacaoAtendimentoUseCase } from './criar-solicitacao-atendimento';
import { ObterAtendimentoUseCase } from '../obter-atendimento/obter-atendimento';
import {
  buildAtendimento,
  InMemoryAtendimentoRepository,
} from '../__tests__/atendimento-test-doubles';
import { AtendimentoStatus } from '@/entities/atendimento';
import { NotFoundError, ValidationError } from '@/entities/errors/domain-error';

describe('CriarSolicitacao e ObterAtendimento', () => {
  it('cria solicitação AGUARDANDO', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const useCase = new CriarSolicitacaoAtendimentoUseCase(repo);

    const created = await useCase.execute({
      patientName: 'Nova Pessoa',
      patientCpf: '390.533.447-05',
      patientContact: '11988887777',
    });

    expect(created.status).toBe(AtendimentoStatus.AGUARDANDO);
  });

  it('valida CPF', async () => {
    const useCase = new CriarSolicitacaoAtendimentoUseCase(
      new InMemoryAtendimentoRepository(),
    );

    await expect(
      useCase.execute({
        patientName: 'X',
        patientCpf: '123',
        patientContact: '11999999999',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('obtém atendimento com paciente', async () => {
    const repo = new InMemoryAtendimentoRepository();
    const item = buildAtendimento();
    repo.seed(item);
    const useCase = new ObterAtendimentoUseCase(repo);

    const found = await useCase.execute(item.id);
    expect(found.patientName).toBe(item.patientName);
  });

  it('404 quando atendimento não existe', async () => {
    const useCase = new ObterAtendimentoUseCase(
      new InMemoryAtendimentoRepository(),
    );

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
