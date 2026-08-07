import { ListarFilaAtendimentoUseCase } from '@/app/use-cases/listar-fila-atendimento/listar-fila-atendimento';
import {
  buildAtendimento,
  InMemoryAtendimentoRepository,
} from '@/app/use-cases/__tests__/atendimento-test-doubles';
import { AtendimentoStatus } from '@/entities/atendimento';
import { UserRole } from '@/entities/user-role';

describe('ListarFilaAtendimentoUseCase filtros', () => {
  const now = new Date('2026-08-07T15:00:00.000-03:00');

  function seedRepo(): InMemoryAtendimentoRepository {
    const repo = new InMemoryAtendimentoRepository();
    repo.seed(
      buildAtendimento({
        id: 'hoje-aguardando',
        status: AtendimentoStatus.AGUARDANDO,
        patientName: 'Ana Silva',
        patientCpf: '39053344705',
        queuedAt: new Date('2026-08-07T10:00:00.000-03:00'),
      }),
    );
    repo.seed(
      buildAtendimento({
        id: 'hoje-finalizado',
        status: AtendimentoStatus.FINALIZADO,
        patientName: 'Bruno Costa',
        patientCpf: '11144477735',
        queuedAt: new Date('2026-08-07T11:00:00.000-03:00'),
      }),
    );
    repo.seed(
      buildAtendimento({
        id: 'ontem-aguardando',
        status: AtendimentoStatus.AGUARDANDO,
        patientName: 'Ana Souza',
        patientCpf: '22233344405',
        queuedAt: new Date('2026-08-06T12:00:00.000-03:00'),
      }),
    );
    return repo;
  }

  it('filtra por status', async () => {
    const useCase = new ListarFilaAtendimentoUseCase(seedRepo());
    const rows = await useCase.execute(UserRole.ENFERMEIRO, {
      status: AtendimentoStatus.AGUARDANDO,
      periodo: 'TODOS',
      now,
    });
    expect(rows.map((r) => r.id).sort()).toEqual([
      'hoje-aguardando',
      'ontem-aguardando',
    ]);
  });

  it('filtra por nome parcial (q)', async () => {
    const useCase = new ListarFilaAtendimentoUseCase(seedRepo());
    const rows = await useCase.execute(UserRole.ENFERMEIRO, {
      q: 'ana',
      periodo: 'TODOS',
      now,
    });
    expect(rows.map((r) => r.id).sort()).toEqual([
      'hoje-aguardando',
      'ontem-aguardando',
    ]);
  });

  it('filtra por CPF normalizado (q)', async () => {
    const useCase = new ListarFilaAtendimentoUseCase(seedRepo());
    const rows = await useCase.execute(UserRole.ENFERMEIRO, {
      q: '390.533.447-05',
      periodo: 'TODOS',
      now,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('hoje-aguardando');
  });

  it('filtra por período HOJE e calcula tempoEsperaSegundos', async () => {
    const useCase = new ListarFilaAtendimentoUseCase(seedRepo());
    const rows = await useCase.execute(UserRole.ENFERMEIRO, {
      periodo: 'HOJE',
      now,
    });
    expect(rows.map((r) => r.id).sort()).toEqual([
      'hoje-aguardando',
      'hoje-finalizado',
    ]);
    const ana = rows.find((r) => r.id === 'hoje-aguardando');
    expect(ana?.tempoEsperaSegundos).toBe(5 * 60 * 60);
  });
});
