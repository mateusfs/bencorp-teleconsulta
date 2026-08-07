import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import {
  ConflictError,
  ForbiddenError,
  UnprocessableStateError,
} from '@/entities/errors/domain-error';

describe('DomainExceptionFilter observabilidade', () => {
  const warn = jest.fn();

  beforeEach(() => {
    warn.mockReset();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(warn);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function hostWith(
    path: string,
    userId: string | null,
  ): { host: ArgumentsHost; status: jest.Mock; json: jest.Mock } {
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({
          method: 'POST',
          path,
          requestId: 'req-1',
          user: userId
            ? {
                kind: 'professional' as const,
                userId,
                email: 'a@b.c',
                role: 'ENFERMEIRO',
              }
            : undefined,
        }),
      }),
    } as unknown as ArgumentsHost;
    return { host, status, json };
  }

  it('loga authz_denied em 403', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = hostWith('/pacientes', 'u-1');
    filter.catch(new ForbiddenError('Papel insuficiente'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalled();
    const payload = JSON.parse(warn.mock.calls[0]?.[0] as string) as {
      event: string;
      status: number;
      path: string;
      userId: string;
    };
    expect(payload.event).toBe('authz_denied');
    expect(payload.status).toBe(403);
    expect(payload.path).toBe('/pacientes');
    expect(payload.userId).toBe('u-1');
  });

  it('loga claim_conflict em 409', () => {
    const filter = new DomainExceptionFilter();
    const { host, status } = hostWith('/atendimentos/x/iniciar', 'u-2');
    filter.catch(
      new ConflictError('Atendimento já iniciado por outro profissional'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const payload = JSON.parse(warn.mock.calls[0]?.[0] as string) as {
      event: string;
      status: number;
    };
    expect(payload.event).toBe('claim_conflict');
    expect(payload.status).toBe(409);
  });

  it('loga invalid_state_transition em 422', () => {
    const filter = new DomainExceptionFilter();
    const { host } = hostWith('/atendimentos/x/cancelar', 'u-3');
    filter.catch(new UnprocessableStateError('Transição inválida'), host);

    const payload = JSON.parse(warn.mock.calls[0]?.[0] as string) as {
      event: string;
      status: number;
    };
    expect(payload.event).toBe('invalid_state_transition');
    expect(payload.status).toBe(422);
  });
});
