import { type PrettyOptions } from 'pino-pretty';
import { type SonicBoom } from 'sonic-boom';
import { env } from './env.js';
import { nodeConfig } from './node.js';
import pino from 'pino';
import { resolve } from 'node:path';

/**
 * Das Modul enthält die Konfiguration für den Logger.
 * @packageDocumentation
 */

const logDirDefault = 'log';
const logFileNameDefault = 'server.log';
const logFileDefault = resolve(logDirDefault, logFileNameDefault);

const { LOG_LEVEL, LOG_DIR, LOG_PRETTY, LOG_DEFAULT } = env;
const { nodeEnv } = nodeConfig;

// Default-Einstellung fuer Logging
export const loggerDefaultValue = LOG_DEFAULT?.toLowerCase() === 'true';

const logDir = LOG_DIR === undefined ? LOG_DIR : LOG_DIR.trimEnd();
const logFile =
    logDir === undefined ? logFileDefault : resolve(logDir, logFileNameDefault);
const pretty = LOG_PRETTY?.toLowerCase() === 'true';

// https://getpino.io
// Log-Levels: fatal, error, warn, info, debug, trace
// Alternativen: Winston, log4js, Bunyan
// Pino wird auch von Fastify genutzt.
// https://blog.appsignal.com/2021/09/01/best-practices-for-logging-in-nodejs.html

let logLevel = 'info';
if (
    LOG_LEVEL === 'debug' &&
    nodeEnv !== 'production' &&
    nodeEnv !== 'PRODUCTION' &&
    !loggerDefaultValue
) {
    logLevel = 'debug';
}

if (!loggerDefaultValue) {
    console.debug(
        `logger config: logLevel=${logLevel}, logFile=${logFile}, pretty=${pretty}, loggerDefaultValue=${loggerDefaultValue}`,
    );
}

const fileOptions = {
    level: logLevel,
    target: 'pino/file',
    options: { destination: logFile },
};
const prettyOptions: PrettyOptions = {
    translateTime: 'SYS:standard',
    singleLine: true,
    colorize: true,
    ignore: 'pid,hostname',
};
const prettyTransportOptions = {
    level: logLevel,
    target: 'pino-pretty',
    options: prettyOptions,
};

const options: pino.TransportMultiOptions | pino.TransportSingleOptions = pretty
    ? {
          targets: [fileOptions, prettyTransportOptions],
      }
    : {
          targets: [fileOptions],
      };
// in pino: type ThreadStream = any
// type-coverage:ignore-next-line
const transports = pino.transport(options); // eslint-disable-line @typescript-eslint/no-unsafe-assignment

// https://github.com/pinojs/pino/issues/1160#issuecomment-944081187
export const parentLogger: pino.Logger<SonicBoom> = loggerDefaultValue
    ? pino(pino.destination(logFileDefault))
    : pino({ level: logLevel }, transports); // eslint-disable-line @typescript-eslint/no-unsafe-argument
