import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AtualizarProntuarioDto } from '@/externals/nest/pipes/prontuarios/prontuario.dto';

describe('AtualizarProntuarioDto vitais', () => {
  async function validatePayload(payload: Record<string, unknown>) {
    const dto = plainToInstance(AtualizarProntuarioDto, payload);
    return validate(dto);
  }

  it('aceita vitais dentro da faixa', async () => {
    const errors = await validatePayload({
      paSistolica: 120,
      paDiastolica: 80,
      fc: 72,
      temperatura: 36.5,
      spo2: 98,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejeita vitais fora da faixa com mensagem em PT-BR', async () => {
    const errors = await validatePayload({
      paSistolica: 40,
      spo2: 101,
      fc: 19.5,
    });
    const messages = errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    );
    expect(messages).toEqual(
      expect.arrayContaining([
        'PA sistólica deve ser no mínimo 50',
        'SpO₂ deve ser no máximo 100',
        'FC deve ser um número inteiro',
      ]),
    );
  });

  it('permite null e omitidos (parcial)', async () => {
    const errors = await validatePayload({
      queixa: 'dor',
      paSistolica: null,
    });
    expect(errors).toHaveLength(0);
  });
});
