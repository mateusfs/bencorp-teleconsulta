import { redactSensitivePath } from './redact-sensitive-path';

describe('redactSensitivePath', () => {
  it('mascara token do link do paciente', () => {
    expect(
      redactSensitivePath('/sala/links/abc.secret-token_value/resgatar'),
    ).toBe('/sala/links/[REDACTED]/resgatar');
  });

  it('não altera outros paths', () => {
    expect(redactSensitivePath('/atendimentos/x/sala/token')).toBe(
      '/atendimentos/x/sala/token',
    );
  });
});
