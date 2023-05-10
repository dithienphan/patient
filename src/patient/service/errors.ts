/**
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Patienten, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

/**
 * Klasse für eine bereits existierende VERSICHERTENNUMMER.
 */
export interface VersichertennummerExists {
    readonly type: 'VersichertennummerExists';
    readonly versichertennummer: string | null | undefined;
    readonly id?: number;
}

/**
 * ggf. Union-Type für diverse Fehler beim Neuanlegen eines Patienten:
 * - {@linkcode VersichertennummerExists}
 */
export type CreateError = VersichertennummerExists;

/**
 * Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export interface VersionInvalid {
    readonly type: 'VersionInvalid';
    readonly version: string | undefined;
}

/**
 * Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export interface VersionOutdated {
    readonly type: 'VersionOutdated';
    readonly id: number;
    readonly version: number;
}

/**
 * Klasse für ein nicht-vorhandenen Patienten beim Ändern.
 */
export interface PatientNotExists {
    readonly type: 'PatientNotExists';
    readonly id: number | undefined;
}

/**
 * Union-Type für Fehler beim Ändern eines Patientes:
 * - {@linkcode PatientNotExists}
 * - {@linkcode VersionInvalid}
 * - {@linkcode VersionOutdated}
 */
export type UpdateError = PatientNotExists | VersionInvalid | VersionOutdated;
