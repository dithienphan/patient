import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Name } from '../entity/name.entity.js';
import { Operation } from '../entity/operation.entity.js';
import { Patient } from '../entity/patient.entity.js';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { typeOrmModuleOptions } from '../../config/db.js';

/** Typdefinitionen für die Suche mit der Patienten-ID. */
export interface BuildIdParams {
    /** ID des gesuchten Patienten. */
    id: number;
    /** Sollen die Operationen mitgeladen werden? */
    mitOperationen?: boolean;
}
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Patienten und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #patientAlias = `${Patient.name
        .charAt(0)
        .toLowerCase()}${Patient.name.slice(1)}`;

    readonly #nameAlias = `${Name.name
        .charAt(0)
        .toLowerCase()}${Name.name.slice(1)}`;

    readonly #operationAlias = `${Operation.name
        .charAt(0)
        .toLowerCase()}${Operation.name.slice(1)}`;

    readonly #repo: Repository<Patient>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Patient) repo: Repository<Patient>) {
        this.#repo = repo;
    }

    /**
     * Ein Patient mit der ID suchen.
     * @param id ID des gesuchten Patienten
     * @returns QueryBuilder
     */
    buildId({ id, mitOperationen = false }: BuildIdParams) {
        const queryBuilder = this.#repo.createQueryBuilder(this.#patientAlias);
        queryBuilder.innerJoinAndSelect(
            `${this.#patientAlias}.name`,
            this.#nameAlias,
        );
        if (mitOperationen) {
            queryBuilder.leftJoinAndSelect(
                `${this.#patientAlias}.operationen`,
                this.#operationAlias,
            );
        }
        queryBuilder.where(`${this.#patientAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Patienten asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    build(suchkriterien: Record<string, any>) {
        this.#logger.debug('build: suchkriterien=%o', suchkriterien);

        let queryBuilder = this.#repo.createQueryBuilder(this.#patientAlias);
        queryBuilder.innerJoinAndSelect(`${this.#patientAlias}.name`, 'name');

        // type-coverage:ignore-next-line
        const { nachname, ...props } = suchkriterien;

        let useWhere = true;

        // Name in der Query: Teilstring des Namens und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (nachname !== undefined && typeof nachname === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#nameAlias}.nachname ${ilike} :nachname`,
                { nachname: `%${nachname}%` },
            );
            useWhere = false;
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = props[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#patientAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#patientAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
