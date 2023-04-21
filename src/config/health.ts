/**
 * Das Modul enthält die Konfigurations-Information für Health.
 * @packageDocumentation
 */

import { env } from './env.js';
import { loggerDefaultValue } from './logger.js';

const { HEALTH_PRETTY_PRINT } = env;

/**
 * Das Konfigurationsobjekt für Health.
 */
// "as const" fuer readonly
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions
export const healthConfig = {
    prettyPrint:
        HEALTH_PRETTY_PRINT !== undefined &&
        HEALTH_PRETTY_PRINT.toLowerCase() === 'true',
} as const;

if (!loggerDefaultValue) {
    console.debug('healthConfig: %o', healthConfig);
}
