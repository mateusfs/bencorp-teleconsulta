import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableStateError,
  ValidationError,
} from '@/entities/errors/domain-error';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.toStatus(exception);

    this.logger.warn(
      JSON.stringify({
        code: exception.code,
        message: exception.message,
        status,
      }),
    );

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
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
    return HttpStatus.BAD_REQUEST;
  }
}
