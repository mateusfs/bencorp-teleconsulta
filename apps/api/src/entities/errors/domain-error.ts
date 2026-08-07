export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Não autenticado') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Acesso negado') {
    super(message, 'FORBIDDEN');
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 'NOT_FOUND');
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Conflito') {
    super(message, 'CONFLICT');
  }
}

export class UnprocessableStateError extends DomainError {
  constructor(message = 'Transição inválida') {
    super(message, 'UNPROCESSABLE');
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'Dados inválidos') {
    super(message, 'VALIDATION');
  }
}
