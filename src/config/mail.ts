/**
 * Das Modul enthält die Konfiguration für den Mail-Client mit _nodemailer_.
 * @packageDocumentation
 */

import { type Options } from 'nodemailer/lib/smtp-transport';
import { env } from './env.js';
import { loggerDefaultValue } from './logger.js';

const { SMTP_DEACTIVATED, SMTP_HOST, SMTP_PORT, SMTP_LOG } = env;

export const mailDeactivated = SMTP_DEACTIVATED?.toLowerCase() === 'true';
// Hochschule Karlsruhe:   smtp.h-ka.de
// nullish coalescing
const host = SMTP_HOST ?? 'smtp';
// Hochschule Karlsruhe:   25
const port = Number.parseInt(SMTP_PORT ?? '25', 10);
const logger = SMTP_LOG?.toLowerCase() === 'true';

/**
 * Konfiguration für den Mail-Client mit _nodemailer_.
 */
// TODO records als "deeply immutable data structure" (Stage 2)
// https://github.com/tc39/proposal-record-tuple
export const mailConfig: Options = {
    host,
    port,
    secure: false,

    // Googlemail:
    // service: 'gmail',
    // auth: {
    //     user: 'Meine.Benutzerkennung@gmail.com',
    //     pass: 'mypassword'
    // }

    priority: 'normal',
    logger,
} as const;
Object.freeze(mailConfig);
if (!loggerDefaultValue) {
    console.debug('mailConfig: %o', mailConfig);
}
