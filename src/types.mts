import type { Logger } from '@myrotvorets/otel-utils';
import type { Request } from 'express';

export type LoggerFromRequestFunction = (req: Request) => Logger | undefined;
