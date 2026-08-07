import { Inject, Injectable } from '@nestjs/common';
import {
  ATENDIMENTO_REPOSITORY,
  AtendimentoRepository,
  CreateAtendimentoInput,
} from '@/app/contracts/atendimento.repository';
import { Atendimento } from '@/entities/atendimento';
import { ValidationError } from '@/entities/errors/domain-error';
import { normalizeCpf } from '@/entities/periodo-fila';

@Injectable()
export class CriarSolicitacaoAtendimentoUseCase {
  constructor(
    @Inject(ATENDIMENTO_REPOSITORY)
    private readonly atendimentos: AtendimentoRepository,
  ) {}

  async execute(input: CreateAtendimentoInput): Promise<Atendimento> {
    const name = input.patientName.trim();
    const contact = input.patientContact.trim();
    const cpf = normalizeCpf(input.patientCpf);

    if (!name || !contact || cpf.length !== 11) {
      throw new ValidationError(
        'Nome, contato e CPF (11 dígitos) são obrigatórios',
      );
    }

    return this.atendimentos.create({
      patientName: name,
      patientCpf: cpf,
      patientContact: contact,
      riskClassification: input.riskClassification,
    });
  }
}
