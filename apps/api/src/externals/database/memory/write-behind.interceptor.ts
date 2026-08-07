import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WriteBehindFlushService } from '@/externals/database/memory/write-behind-flush.service';

@Injectable()
export class WriteBehindInterceptor implements NestInterceptor {
  constructor(
    @Optional() private readonly flush: WriteBehindFlushService | null,
  ) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      tap({
        next: () => this.flush?.scheduleFlush(),
        error: () => this.flush?.scheduleFlush(),
      }),
    );
  }
}
