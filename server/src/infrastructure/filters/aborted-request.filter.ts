import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Suppresses ECONNABORTED errors that flood CloudWatch under load tests.
 * These happen when the client disconnects before NestJS finishes reading the
 * request body — expected behavior under extreme stress, not an application bug.
 */
@Catch()
export class AbortedRequestFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isAborted =
      exception instanceof Error &&
      ((exception as NodeJS.ErrnoException).code === 'ECONNABORTED' ||
        (exception as { type?: string }).type === 'request.aborted');

    if (isAborted) {
      this.logger.warn(`Request aborted by client: ${request.method} ${request.url}`);
      if (!response.headersSent) {
        response.status(499).end();
      }
      return;
    }

    // Re-throw everything else so NestJS default handler processes it
    throw exception;
  }
}
