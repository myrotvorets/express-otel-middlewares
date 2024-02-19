import type { Request, RequestHandler } from 'express';
import type { Histogram } from '@opentelemetry/api';
import { hrTime, hrTimeDuration, hrTimeToMilliseconds } from '@opentelemetry/core';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import type { OpenApiRequest } from '@myrotvorets/oav-installer';

function isOpenApiRequest(req: Request): req is OpenApiRequest {
    return 'openapi' in req && !!req.openapi;
}

function extractRoute(req: Request): string {
    let route: string | undefined;
    if (isOpenApiRequest(req)) {
        route = req.openapi!.openApiRoute || req.openapi!.expressRoute;
    }

    if (!route && req.route) {
        route = (req.route as Record<'path', string>).path;
    }

    return route ?? '<unknown>';
}

export function requestDurationMiddleware(requestDurationHistogram: Histogram): RequestHandler {
    return (req, res, next): void => {
        const start = hrTime();
        const recordDurarion = (): void => {
            res.removeListener('error', recordDurarion);
            res.removeListener('finish', recordDurarion);
            const end = hrTime();
            const duration = hrTimeDuration(start, end);

            const route = extractRoute(req);

            requestDurationHistogram.record(hrTimeToMilliseconds(duration), {
                [SemanticAttributes.HTTP_METHOD]: req.method,
                [SemanticAttributes.HTTP_ROUTE]: route,
                [SemanticAttributes.HTTP_STATUS_CODE]: res.statusCode,
            });
        };
    
        res.prependOnceListener('error', recordDurarion);
        res.prependOnceListener('finish', recordDurarion);
        next();
    };
}
