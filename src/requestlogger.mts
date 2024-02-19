import { requestLogger } from '@myrotvorets/express-request-logger';
import type { RequestHandler } from 'express';
import type { LoggerFromRequestFunction } from './types.mjs';

const emptyRequestHandler: RequestHandler = (_req, _res, next): void => next();

export function requestLoggerMiddleware(service: string, loggerFromRequest: LoggerFromRequestFunction): RequestHandler {
    if (process.env['NODE_ENV'] === 'test') {
        return emptyRequestHandler;
    }

    return requestLogger({
        format: `[${service}] :remote-addr :method :url :req[content-length] :status :res[content-length] :date[iso] :total-time`,
        beforeLogHook: (err, req, _res, line, tokens): string => {
            const logger = loggerFromRequest(req);
            if (logger) {
                const { status } = tokens;
                const statusCode = +(status ?? 0);
                const message = `Status: ${status} len: ${tokens['res[content-length]']} time: ${tokens['total-time']}`;

                if (statusCode >= 500 || err) {
                    logger.error(message);
                } else if (statusCode >= 400) {
                    logger.warning(message);
                } else {
                    logger.info(message);
                }
            }

            return line;
        },
    }) as RequestHandler;
}
