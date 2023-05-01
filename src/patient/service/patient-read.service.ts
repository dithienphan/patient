import {
    Patient,
    type PatientVersicherungsart,
} from './../entity/patient.entity.js';
import { Injectable } from '@nestjs/common';
import { QueryBuilder } from './query-builder.js';
import RE2 from 're2';
import { getLogger } from '../../logger/logger.js';

/**
 * Typdefinition für `findById`
 */
export interface FindByIdParams {
    /** ID des gesuchten Patienten */
    id: number;
    /** Sollen die Operationen mitgeladen werden? */
    mitOperationen?: boolean;
}
/**
 * Suchkriterien für `findById`
 */
export interface Suchkriterien {
    readonly versichertennummer?: string;
    readonly versicherungsart?: PatientVersicherungsart;
    readonly geburtsdatum?: Date;
    readonly intensiv?: boolean;
    readonly diagnose?: string;
    readonly name?: string;
}

/**
 * Die Klasse `PatientReadService` implementiert das Lesen für Patienten und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class PatientReadService {
    static readonly ID_PATTERN = new RE2('^[1-9][\\d]*$');

    readonly #patientProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(PatientReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const patientDummy = new Patient();
        this.#patientProps = Object.getOwnPropertyNames(patientDummy);
        this.#queryBuilder = queryBuilder;
    }

    /**
     * Ein Patienten asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Patienten
     * @returns Der gefundene Patient vom Typ [Patient](patient_entity_patient_entity.Patient.html) oder undefined
     *          in einem Promise aus ES2015 (vgl.: Mono aus Project Reactor oder
     *          Future aus Java)
     */
    async findById({ id, mitOperationen = false }: FindByIdParams) {
        this.#logger.debug('findById: id=%d', id);

        const patient = await this.#queryBuilder
            .buildId({ id, mitOperationen })
            .getOne();
        if (patient === null) {
            this.#logger.debug('findById: Kein Patienten gefunden');
            return;
        }
        this.#logger.debug('findById: patient=%o', patient);
        return patient;
    }

    /**
     * Patienten asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns Ein JSON-Array mit den gefundenen Büchern. Ggf. ist das Array leer.
     */
    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        // Keine Suchkriterien?
        if (suchkriterien === undefined) {
            const patienten = await this.#queryBuilder.build({}).getMany();
            return patienten;
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            const patienten = await this.#queryBuilder
                .build(suchkriterien)
                .getMany();
            return patienten;
        }

        // Falsche Namen fuer Suchkriterien?
        if (!this.#checkKeys(keys)) {
            return [];
        }

        // Das Resultat ist eine leere Liste, falls nichts gefunden
        const patienten = await this.#queryBuilder
            .build(suchkriterien)
            .getMany();
        this.#logger.debug('find: patienten=%o', patienten);

        return patienten;
    }

    #checkKeys(keys: string[]) {
        // Ist jedes Suchkriterium auch eine Property von Patient?
        let validKeys = true;
        keys.forEach((key) => {
            if (!this.#patientProps.includes(key)) {
                this.#logger.debug(
                    '#find: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
