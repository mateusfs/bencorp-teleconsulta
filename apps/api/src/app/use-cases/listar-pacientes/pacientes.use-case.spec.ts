import { ListarPacientesUseCase } from '@/app/use-cases/listar-pacientes';
import { ObterPacienteDetalheUseCase } from '@/app/use-cases/obter-paciente-detalhe';
import {
  buildPaciente,
  InMemoryPacienteRepository,
} from '@/app/use-cases/__tests__/paciente-test-doubles';
import { InMemoryAuditoriaLeituraRepository } from '@/app/use-cases/__tests__/prontuario-test-doubles';
import { AtendimentoStatus, ClassificacaoRisco } from '@/entities/atendimento';
import { ForbiddenError, NotFoundError } from '@/entities/errors/domain-error';
import { UserRole } from '@/entities/user-role';

describe('Pacientes use cases (Épico F)', () => {
  function seedListRepo(): InMemoryPacienteRepository {
    const repo = new InMemoryPacienteRepository();
    repo.seedPatient(
      buildPaciente({
        id: 'p-ana',
        name: 'Ana Silva',
        cpf: '39053344705',
      }),
    );
    repo.seedPatient(
      buildPaciente({
        id: 'p-bruno',
        name: 'Bruno Costa',
        cpf: '11144477735',
      }),
    );
    return repo;
  }

  it('ADMIN não lista pacientes', async () => {
    const useCase = new ListarPacientesUseCase(seedListRepo());
    await expect(useCase.execute(UserRole.ADMIN, {})).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('lista pacientes para clínico', async () => {
    const useCase = new ListarPacientesUseCase(seedListRepo());
    const rows = await useCase.execute(UserRole.ENFERMEIRO, {});
    expect(rows.map((r) => r.id)).toEqual(['p-ana', 'p-bruno']);
  });

  it('busca por nome parcial', async () => {
    const useCase = new ListarPacientesUseCase(seedListRepo());
    const rows = await useCase.execute(UserRole.MEDICO, { q: 'ana' });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('p-ana');
  });

  it('busca por CPF normalizado', async () => {
    const useCase = new ListarPacientesUseCase(seedListRepo());
    const rows = await useCase.execute(UserRole.ENFERMEIRO, {
      q: '390.533.447-05',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('p-ana');
  });

  it('ADMIN não acessa detalhe', async () => {
    const repo = seedListRepo();
    const useCase = new ObterPacienteDetalheUseCase(
      repo,
      new InMemoryAuditoriaLeituraRepository(),
    );
    await expect(
      useCase.execute({
        patientId: 'p-ana',
        userId: 'admin',
        role: UserRole.ADMIN,
        endpoint: '/pacientes/p-ana',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('detalhe inexistente → NotFound', async () => {
    const useCase = new ObterPacienteDetalheUseCase(
      seedListRepo(),
      new InMemoryAuditoriaLeituraRepository(),
    );
    await expect(
      useCase.execute({
        patientId: 'missing',
        userId: 'prof-1',
        role: UserRole.ENFERMEIRO,
        endpoint: '/pacientes/missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('detalhe retorna histórico e audita cada prontuário', async () => {
    const repo = new InMemoryPacienteRepository();
    const auditorias = new InMemoryAuditoriaLeituraRepository();
    const now = new Date('2026-08-07T12:00:00.000Z');
    repo.seedPatient(
      buildPaciente({ id: 'p-1', name: 'Ana', cpf: '39053344705' }),
    );
    repo.seedHistorico({
      atendimentos: [
        {
          id: 'a-1',
          patientId: 'p-1',
          status: AtendimentoStatus.FINALIZADO,
          riskClassification: ClassificacaoRisco.VERDE,
          professionalId: 'prof-1',
          queuedAt: now,
          startedAt: now,
          finishedAt: now,
          desfecho: null,
          encaminhadoDeId: null,
          createdAt: now,
          updatedAt: now,
        },
      ],
      prontuarios: [
        {
          id: 'pr-1',
          atendimentoId: 'a-1',
          patientId: 'p-1',
          queixa: 'Dor',
          anamnese: '',
          conduta: '',
          prescricao: '',
          complementoMedico: '',
          paSistolica: 120,
          paDiastolica: 80,
          fc: 70,
          temperatura: 36.5,
          spo2: 98,
          riskClassification: ClassificacaoRisco.VERDE,
          createdAt: now,
          updatedAt: now,
          adendos: [],
        },
        {
          id: 'pr-2',
          atendimentoId: 'a-2',
          patientId: 'p-1',
          queixa: 'Febre',
          anamnese: '',
          conduta: '',
          prescricao: '',
          complementoMedico: '',
          paSistolica: null,
          paDiastolica: null,
          fc: null,
          temperatura: 38,
          spo2: null,
          riskClassification: null,
          createdAt: now,
          updatedAt: now,
          adendos: [],
        },
      ],
    });

    const useCase = new ObterPacienteDetalheUseCase(repo, auditorias);
    const detail = await useCase.execute({
      patientId: 'p-1',
      userId: 'prof-1',
      role: UserRole.MEDICO,
      endpoint: '/pacientes/p-1',
    });

    expect(detail.paciente.id).toBe('p-1');
    expect(detail.atendimentos).toHaveLength(1);
    expect(detail.prontuarios).toHaveLength(2);
    expect(detail.prontuarios[0]?.paSistolica).toBe(120);
    expect(detail.prontuarios[0]).not.toHaveProperty('anamnese');
    expect(detail.prontuarios[0]).not.toHaveProperty('adendos');
    expect(auditorias.rows).toHaveLength(2);
    expect(auditorias.rows.map((r) => r.prontuarioId).sort()).toEqual([
      'pr-1',
      'pr-2',
    ]);
    expect(auditorias.rows[0]?.endpoint).toBe('/pacientes/p-1');
  });
});
