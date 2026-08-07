import { AtualizarProntuarioUseCase } from '../atualizar-prontuario/atualizar-prontuario';
import { CriarAdendoProntuarioUseCase } from '../criar-adendo-prontuario/criar-adendo-prontuario';
import { ObterProntuarioPorAtendimentoUseCase } from '../obter-prontuario-por-atendimento/obter-prontuario-por-atendimento';
import { ObterProntuarioPorIdUseCase } from '../obter-prontuario-por-id/obter-prontuario-por-id';
import {
  buildAtendimento,
  InMemoryAtendimentoRepository,
} from '../__tests__/atendimento-test-doubles';
import {
  InMemoryAuditoriaLeituraRepository,
  InMemoryProntuarioRepository,
} from '../__tests__/prontuario-test-doubles';
import {
  AtendimentoStatus,
  ClassificacaoRisco,
  DesfechoAtendimento,
} from '@/entities/atendimento';
import {
  ForbiddenError,
  NotFoundError,
  UnprocessableStateError,
  ValidationError,
} from '@/entities/errors/domain-error';
import { UserRole } from '@/entities/user-role';

describe('Prontuário use cases', () => {
  const professionalId = 'prof-1';

  function setupEmAndamento() {
    const atendimentos = new InMemoryAtendimentoRepository();
    const prontuarios = new InMemoryProntuarioRepository();
    const auditorias = new InMemoryAuditoriaLeituraRepository();
    const atendimento = buildAtendimento({
      status: AtendimentoStatus.EM_ANDAMENTO,
      professionalId,
      riskClassification: ClassificacaoRisco.VERDE,
    });
    atendimentos.seed(atendimento);
    return { atendimentos, prontuarios, auditorias, atendimento };
  }

  it('ADMIN não acessa prontuário', async () => {
    const { atendimentos, prontuarios, auditorias, atendimento } =
      setupEmAndamento();
    const useCase = new ObterProntuarioPorAtendimentoUseCase(
      atendimentos,
      prontuarios,
      auditorias,
    );

    await expect(
      useCase.execute({
        atendimentoId: atendimento.id,
        userId: 'admin',
        role: UserRole.ADMIN,
        endpoint: '/atendimentos/x/prontuario',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('leitura registra auditoria', async () => {
    const { atendimentos, prontuarios, auditorias, atendimento } =
      setupEmAndamento();
    const useCase = new ObterProntuarioPorAtendimentoUseCase(
      atendimentos,
      prontuarios,
      auditorias,
    );

    const prontuario = await useCase.execute({
      atendimentoId: atendimento.id,
      userId: professionalId,
      role: UserRole.ENFERMEIRO,
      endpoint: '/atendimentos/x/prontuario',
    });

    prontuarios.setPatientId(prontuario.id, atendimento.patientId);
    expect(auditorias.rows).toHaveLength(1);
    expect(auditorias.rows[0]?.prontuarioId).toBe(prontuario.id);
  });

  it('enfermeiro atualiza triagem; enfermeiro não prescreve; médico prescreve', async () => {
    const { atendimentos, prontuarios, atendimento } = setupEmAndamento();
    const enfermeiro = new AtualizarProntuarioUseCase(
      atendimentos,
      prontuarios,
    );

    const updated = await enfermeiro.execute({
      atendimentoId: atendimento.id,
      userId: professionalId,
      role: UserRole.ENFERMEIRO,
      data: {
        queixa: 'Dor',
        anamnese: 'Curta',
        paSistolica: 120,
        paDiastolica: 80,
        fc: 72,
        temperatura: 36.5,
        spo2: 98,
        riskClassification: ClassificacaoRisco.AMARELO,
      },
    });

    expect(updated.queixa).toBe('Dor');
    expect(updated.spo2).toBe(98);
    expect(
      (await atendimentos.findById(atendimento.id))?.riskClassification,
    ).toBe(ClassificacaoRisco.AMARELO);

    await expect(
      enfermeiro.execute({
        atendimentoId: atendimento.id,
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
        data: { prescricao: 'Dipirona' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    const withRx = await enfermeiro.execute({
      atendimentoId: atendimento.id,
      userId: professionalId,
      role: UserRole.MEDICO,
      data: { prescricao: 'Dipirona', complementoMedico: 'Obs' },
    });
    expect(withRx.prescricao).toBe('Dipirona');
  });

  it('base imutável após finalização; adendo permitido', async () => {
    const { atendimentos, prontuarios, atendimento } = setupEmAndamento();
    const atualizar = new AtualizarProntuarioUseCase(atendimentos, prontuarios);
    await atualizar.execute({
      atendimentoId: atendimento.id,
      userId: professionalId,
      role: UserRole.ENFERMEIRO,
      data: { queixa: 'Base' },
    });

    await atendimentos.finalize({
      id: atendimento.id,
      desfecho: DesfechoAtendimento.ENCERRADO,
      finishedAt: new Date(),
    });

    await expect(
      atualizar.execute({
        atendimentoId: atendimento.id,
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
        data: { queixa: 'Alterado' },
      }),
    ).rejects.toBeInstanceOf(UnprocessableStateError);

    const adendo = new CriarAdendoProntuarioUseCase(atendimentos, prontuarios);
    const created = await adendo.execute({
      atendimentoId: atendimento.id,
      userId: professionalId,
      role: UserRole.ENFERMEIRO,
      texto: 'Correção via adendo',
    });
    expect(created.texto).toBe('Correção via adendo');

    const byId = new ObterProntuarioPorIdUseCase(
      prontuarios,
      new InMemoryAuditoriaLeituraRepository(),
    );
    const prontuario = await prontuarios.findByAtendimentoId(atendimento.id);
    const loaded = await byId.execute({
      prontuarioId: prontuario!.id,
      userId: professionalId,
      role: UserRole.MEDICO,
      endpoint: '/prontuarios/x',
    });
    expect(loaded.queixa).toBe('Base');
    expect(loaded.adendos).toHaveLength(1);
  });

  it('outro profissional não edita (anti-IDOR de ownership)', async () => {
    const { atendimentos, prontuarios, atendimento } = setupEmAndamento();
    const atualizar = new AtualizarProntuarioUseCase(atendimentos, prontuarios);

    await expect(
      atualizar.execute({
        atendimentoId: atendimento.id,
        userId: 'outro',
        role: UserRole.ENFERMEIRO,
        data: { queixa: 'Hack' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('adendo: ADMIN, texto vazio, não finalizado e sem prontuário', async () => {
    const { atendimentos, prontuarios, atendimento } = setupEmAndamento();
    const adendo = new CriarAdendoProntuarioUseCase(atendimentos, prontuarios);

    await expect(
      adendo.execute({
        atendimentoId: atendimento.id,
        userId: professionalId,
        role: UserRole.ADMIN,
        texto: 'x',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);

    await expect(
      adendo.execute({
        atendimentoId: atendimento.id,
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
        texto: '   ',
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      adendo.execute({
        atendimentoId: atendimento.id,
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
        texto: 'cedo',
      }),
    ).rejects.toBeInstanceOf(UnprocessableStateError);

    await expect(
      adendo.execute({
        atendimentoId: 'missing',
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
        texto: 'x',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    await atendimentos.finalize({
      id: atendimento.id,
      desfecho: DesfechoAtendimento.ENCERRADO,
      finishedAt: new Date(),
    });

    await expect(
      adendo.execute({
        atendimentoId: atendimento.id,
        userId: professionalId,
        role: UserRole.ENFERMEIRO,
        texto: 'sem prontuario',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
