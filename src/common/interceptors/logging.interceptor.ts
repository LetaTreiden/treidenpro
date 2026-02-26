import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { EventsService } from '../../events/events.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly eventsService: EventsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(async () => {
        await this.eventsService.logEvent({
          userId: request.user?.sub,
          eventName: 'http.request',
          payload: {
            method: request.method,
            path: request.originalUrl,
            durationMs: Date.now() - now,
          },
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
