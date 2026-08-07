import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Observable, tap } from 'rxjs';
import { AuthenticatedUser } from '@/externals/nest/security/authenticated-user';

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
  requestId?: string;
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithUser>();
    const response = http.getResponse<Response>();
    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    const started = Date.now();
    return next.handle().pipe(
      tap(() => {
        const userId = request.user?.userId;
        this.logger.log(
          JSON.stringify({
            requestId,
            method: request.method,
            path: request.originalUrl,
            statusCode: response.statusCode,
            durationMs: Date.now() - started,
            userId: userId ?? null,
          }),
        );
      }),
    );
  }
}
