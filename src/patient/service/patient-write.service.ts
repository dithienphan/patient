/**
 * Das Modul besteht aus der Klasse {@linkcode PatientWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import {
    type CreateError,
    type PatientNotExists,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Patient } from '../entity/patient.entity.js';
import { PatientReadService } from './patient-read.service.js';
import RE2 from 're2';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';

/** Typdefinitionen zum Aktualisieren eines Patientes mit `update`. */
export interface UpdateParams {
    /** ID des zu aktualisierenden Patientes. */
    id: number | undefined;
    /** Patient-Objekt mit den aktualisierten Werten. */
    patient: Patient;
    /** Versionsnummer für die aktualisierenden Werte. */
    version: string;
}

/**
 * Die Klasse `PatientWriteService` implementiert den Anwendungskern für das
 * Schreiben von Patienten und greift mit _TypeORM_ auf die DB zu.
 */
@Injectable()
export class PatientWriteService {
    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #repo: Repository<Patient>;

    readonly #readService: PatientReadService;

    readonly #logger = getLogger(PatientWriteService.name);

    constructor(
        @InjectRepository(Patient) repo: Repository<Patient>,
        readService: PatientReadService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
    }

    /**
     * Ein neuer Patient soll angelegt werden.
     * @param patient Des neu abzulegende Patient
     * @returns Die ID des neu angelegten Patientes oder im Fehlerfall
     * [CreateError](../types/patient_service_errors.CreateError.html)
     */
    async create(patient: Patient): Promise<CreateError | number> {
        this.#logger.debug('create: patient=%o', patient);
        const validateResult = await this.#validateCreate(patient);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const patientDb = await this.#repo.save(patient);
        this.#logger.debug('create: patientDb=%o', patientDb);

        return patientDb.id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    /**
     * Ein vorhandener Patient soll aktualisiert werden.
     * @param patient Das zu aktualisierende Patient
     * @param id ID des zu aktualisierenden Patients
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall [UpdateError](../types/patient_service_errors.UpdateError.html)
     */
    async update({
        id,
        patient,
        version,
    }: UpdateParams): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%d, patient=%o, version=%s',
            id,
            patient,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            return { type: 'PatientNotExists', id };
        }

        const validateResult = await this.#validateUpdate(patient, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Patient)) {
            return validateResult;
        }

        const patientNeu = validateResult;
        const merged = this.#repo.merge(patientNeu, patient);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged);
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    }

    async #validateCreate(patient: Patient): Promise<CreateError | undefined> {
        this.#logger.debug('#validateCreate: patient=%o', patient);

        const { versichertennummer } = patient;
        const patienten = await this.#readService.find({ versichertennummer });
        if (patienten.length > 0) {
            return { type: 'VersichertennummerExists', versichertennummer };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #validateUpdate(
        patient: Patient,
        id: number,
        versionStr: string,
    ): Promise<Patient | UpdateError> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: patient=%o, version=%s',
            patient,
            version,
        );

        const resultFindById = await this.#findByIdAndCheckVersion(id, version);
        this.#logger.debug('#validateUpdate: %o', resultFindById);
        return resultFindById;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !PatientWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #findByIdAndCheckVersion(
        id: number,
        version: number,
    ): Promise<Patient | PatientNotExists | VersionOutdated> {
        const patientDb = await this.#readService.findById({ id });
        if (patientDb === undefined) {
            const result: PatientNotExists = { type: 'PatientNotExists', id };
            this.#logger.debug(
                '#checkIdAndVersion: PatientNotExists=%o',
                result,
            );
            return result;
        }

        const versionDb = patientDb.version!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return patientDb;
    }
}
