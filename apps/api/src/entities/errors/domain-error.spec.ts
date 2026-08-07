import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableStateError,
  ValidationError,
} from './domain-error';

describe('DomainError hierarchy', () => {
  it('expõe códigos HTTP esperados pelo case', () => {
    expect(new UnauthorizedError().code).toBe('UNAUTHORIZED');
    expect(new ForbiddenError().code).toBe('FORBIDDEN');
    expect(new NotFoundError().code).toBe('NOT_FOUND');
    expect(new ConflictError().code).toBe('CONFLICT');
    expect(new UnprocessableStateError().code).toBe('UNPROCESSABLE');
    expect(new ValidationError().code).toBe('VALIDATION');
  });
});
