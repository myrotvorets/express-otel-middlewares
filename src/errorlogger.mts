import { inspect } from 'node:util';
import { trace } from '@opentelemetry/api';
import type { ErrorMiddlewareOptions, ApiError } from '@myrotvorets/express-microservice-middlewares'
import type { Request } from 'express';
import type { LoggerFromRequestFunction } from './types.mjs';

export function errorLoggerHook(getLoggerFromRequest: LoggerFromRequestFunction): ErrorMiddlewareOptions['beforeSendHook'] {
    return (error: ApiError | null, _originalError: unknown, req: Request): boolean => {
        const logger = getLoggerFromRequest(req);
        if (logger && error) {
            const message = `${error.code}: ${error.message} (${error.status})\n${inspect(error, { depth: 5 })}`;
            trace.getActiveSpan()?.recordException(error);

            if (error.status >= 500) {
                logger.error(message);
            } else if (error.status >= 400) {
                logger.warning(message);
            }
        }

        return true;
    };
}
