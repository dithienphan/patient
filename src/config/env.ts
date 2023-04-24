/**
 * Das Modul enthält Objekte mit Daten aus Umgebungsvariablen.
 * @packageDocumentation
 */

// Umgebungsvariable durch die Konfigurationsdatei .env
// evtl. node-config
import dotenv from 'dotenv';
import process from 'node:process';

// .env nur einlesen, falls nicht in Kubernetes bzw. in der Cloud
dotenv.config();

const {
    // Umgebungsvariable `NODE_ENV` als gleichnamige Konstante, die i.a. einen der
    // folgenden Werte enthält:
    // - `production`, z.B. in einer Cloud,
    // - `development` oder
    // - `test`
    NODE_ENV,
    PORT,
    PATIENT_SERVICE_HOST,
    PATIENT_SERVICE_PORT,
    K8S_TLS,
    DB_TYPE,
    DB_NAME,
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
    DB_PASSWORD_ADMIN,
    DB_POPULATE,
    APOLLO_DEBUG,
    LOG_LEVEL,
    LOG_DIR,
    LOG_PRETTY,
    LOG_DEFAULT,
    HEALTH_PRETTY_PRINT,
    JWT_EXPIRES_IN,
    JWT_ISSUER,
    SMTP_DEACTIVATED,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_LOG,
    START_DB_SERVER,
    USER_PASSWORD_ENCODED,
} = process.env; // eslint-disable-line n/no-process-env

// "as const" fuer readonly
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions

/* eslint-disable @typescript-eslint/naming-convention */
// TODO records als "deeply immutable data structure" (Stage 2)
// https://github.com/tc39/proposal-record-tuple
/**
 * Umgebungsvariable zur Konfiguration
 */
export const env = {
    // Umgebungsvariable `NODE_ENV` als gleichnamige Konstante, die i.a. einen der
    // folgenden Werte enthält:
    // - `production`, z.B. in einer Cloud,
    // - `development` oder
    // - `test`
    NODE_ENV,
    PORT,
    PATIENT_SERVICE_HOST,
    PATIENT_SERVICE_PORT,
    K8S_TLS,
    DB_TYPE,
    DB_NAME,
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
    DB_PASSWORD_ADMIN,
    DB_POPULATE,
    APOLLO_DEBUG,
    LOG_LEVEL,
    LOG_DIR,
    LOG_PRETTY,
    LOG_DEFAULT,
    HEALTH_PRETTY_PRINT,
    JWT_EXPIRES_IN,
    JWT_ISSUER,
    SMTP_DEACTIVATED,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_LOG,
    START_DB_SERVER,
    USER_PASSWORD_ENCODED,
} as const;
/* eslint-enable @typescript-eslint/naming-convention */
