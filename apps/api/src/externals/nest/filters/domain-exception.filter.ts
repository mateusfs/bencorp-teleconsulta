import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  GoneError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableStateError,
  ValidationError,
} from '@/entities/errors/domain-error';
import { AuthPrincipal } from '@/externals/nest/security/authenticated-user';

type RequestWithContext = Request & {
  user?: AuthPrincipal;
  requestId?: string;
};

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithContext>();
    const status = this.toStatus(exception);
    const event = this.toEvent(exception);
    const userId =
      request.user?.kind === 'professional'
        ? request.user.userId
        : request.user?.kind === 'patient'
          ? request.user.patientId
          : null;

    this.logger.warn(
      JSON.stringify({
        event,
        code: exception.code,
        message: exception.message,
        status,
        requestId: request.requestId ?? null,
        method: request.method,
        path: request.path,
        userId,
      }),
    );

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }

  private toEvent(error: DomainError): string {
    if (error instanceof ForbiddenError) {
      return 'authz_denied';
    }
    if (error instanceof ConflictError) {
      const message = error.message.toLowerCase();
      if (
        message.includes('já iniciado') ||
        message.includes('em_andamento') ||
        message.includes('em andamento')
      ) {
        return 'claim_conflict';
      }
      return 'conflict';
    }
    if (error instanceof UnauthorizedError) {
      return 'auth_unauthorized';
    }
    if (error instanceof UnprocessableStateError) {
      return 'invalid_state_transition';
    }
    return 'domain_error';
  }

  private toStatus(error: DomainError): number {
    if (error instanceof UnauthorizedError) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (error instanceof ForbiddenError) {
      return HttpStatus.FORBIDDEN;
    }
    if (error instanceof NotFoundError) {
      return HttpStatus.NOT_FOUND;
    }
    if (error instanceof ConflictError) {
      return HttpStatus.CONFLICT;
    }
    if (error instanceof UnprocessableStateError) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    if (error instanceof ValidationError) {
      return HttpStatus.BAD_REQUEST;
    }
    if (error instanceof GoneError) {
      return HttpStatus.GONE;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
