import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    response.status(status).json({
      statusCode: status,
      message:
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as Record<string, unknown>).message || 'Error'
          : exceptionResponse || 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
