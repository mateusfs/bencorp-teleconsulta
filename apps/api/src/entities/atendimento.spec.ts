import {
  AtendimentoStatus,
  canTransition,
  assertTransition,
} from './atendimento';

describe('Atendimento state machine', () => {
  it('permite caminho feliz AGUARDANDO → EM_ANDAMENTO → FINALIZADO', () => {
    expect(
      canTransition(
        AtendimentoStatus.AGUARDANDO,
        AtendimentoStatus.EM_ANDAMENTO,
      ),
    ).toBe(true);
    expect(
      canTransition(
        AtendimentoStatus.EM_ANDAMENTO,
        AtendimentoStatus.FINALIZADO,
      ),
    ).toBe(true);
  });

  it('permite CANCELADO somente a partir de AGUARDANDO', () => {
    expect(
      canTransition(AtendimentoStatus.AGUARDANDO, AtendimentoStatus.CANCELADO),
    ).toBe(true);
    expect(
      canTransition(
        AtendimentoStatus.EM_ANDAMENTO,
        AtendimentoStatus.CANCELADO,
      ),
    ).toBe(false);
    expect(
      canTransition(AtendimentoStatus.FINALIZADO, AtendimentoStatus.CANCELADO),
    ).toBe(false);
  });

  it('rejeita transições fora do grafo com UnprocessableStateError', () => {
    expect(() =>
      assertTransition(
        AtendimentoStatus.FINALIZADO,
        AtendimentoStatus.AGUARDANDO,
      ),
    ).toThrow('Transição inválida');
    expect(() =>
      assertTransition(
        AtendimentoStatus.EM_ANDAMENTO,
        AtendimentoStatus.AGUARDANDO,
      ),
    ).toThrow('Transição inválida');
    expect(() =>
      assertTransition(
        AtendimentoStatus.CANCELADO,
        AtendimentoStatus.EM_ANDAMENTO,
      ),
    ).toThrow('Transição inválida');
  });
});
