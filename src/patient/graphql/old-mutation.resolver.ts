/*
 * Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
// eslint-disable-next-line max-classes-per-file
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { BadUserInputError } from './errors.js';
import { JwtAuthGraphQlGuard } from '../../security/auth/jwt/jwt-auth-graphql.guard.js';
import { type Name } from '../entity/name.entity.js';
import { Operation } from '../entity/operation.entity.js';
import { Patient } from '../entity/patient.entity.js';
import { PatientDTO } from '../rest/patientDTO.entity.js';
import { PatientWriteService } from '../service/patient-write.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGraphQlGuard } from '../../security/auth/roles/roles-graphql.guard.js';
import { getLogger } from '../../logger/logger.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

export class PatientUpdateDTO extends PatientDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}
@Resolver()
// alternativ: globale Aktivierung der Guards https://docs.nestjs.com/security/authorization#basic-rbac-implementation
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class PatientMutationResolver {
    readonly #service: PatientWriteService;

    readonly #logger = getLogger(PatientMutationResolver.name);

    constructor(service: PatientWriteService) {
        this.#service = service;
    }

    @Mutation()
    @RolesAllowed('arzt', 'rezeptionist')
    async create(@Args('input') patientDTO: PatientDTO) {
        this.#logger.debug('create: patientDTO=%o', patientDTO);

        const patient = this.#patientDtoToPatient(patientDTO);
        const result = await this.#service.create(patient);
        this.#logger.debug('createPatient: result=%o', result);

        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            throw new BadUserInputError(
                this.#errorMsgCreatePatient(result as CreateError),
            );
        }
        return result;
    }

    @Mutation()
    @RolesAllowed('arzt', 'rezeptionist')
    async update(@Args('input') patientDTO: PatientUpdateDTO) {
        this.#logger.debug('update: patient=%o', patientDTO);

        const patient = this.#patientUpdateDtoToPatient(patientDTO);
        const versionStr = `"${patientDTO.version.toString()}"`;

        const result = await this.#service.update({
            id: Number.parseInt(patientDTO.id, 10),
            patient,
            version: versionStr,
        });
        if (typeof result === 'object') {
            throw new BadUserInputError(this.#errorMsgUpdatePatient(result));
        }
        this.#logger.debug('updatePatient: result=%d', result);
        return result;
    }

    #patientDtoToPatient(patientDTO: PatientDTO): Patient {
        const nameDTO = patientDTO.name;
        const name: Name = {
            id: undefined,
            nachname: nameDTO.nachname,
            vorname: nameDTO.vorname,
            patient: undefined,
        };
        const operationen = patientDTO.operationen?.map((operationDTO) => {
            const operation: Operation = {
                id: undefined,
                eingriff: operationDTO.eingriff,
                behandlungsraum: operationDTO.behandlungsraum,
                patient: undefined,
            };
            return operation;
        });
        const patient = {
            id: undefined,
            version: undefined,
            versichertennummer: patientDTO.versichertennummer,
            versicherungsart: patientDTO.versicherungsart,
            geburtsdatum: patientDTO.geburtsdatum,
            intensiv: patientDTO.intensiv,
            diagnose: patientDTO.diagnose,
            name,
            erzeugt: undefined,
            aktualisiert: undefined,
            operationen,
        };

        // Rueckwaertsverweis
        patient.name.patient = patient;
        return patient;
    }

    #patientUpdateDtoToPatient(patientDTO: PatientUpdateDTO): Patient {
        return {
            id: undefined,
            version: undefined,
            versichertennummer: patientDTO.versichertennummer,
            versicherungsart: patientDTO.versicherungsart,
            geburtsdatum: patientDTO.geburtsdatum,
            intensiv: patientDTO.intensiv,
            diagnose: patientDTO.diagnose,
            name: undefined,
            operationen: undefined,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }

    #errorMsgCreatePatient(err: CreateError) {
        switch (err.type) {
            case 'VersichertennummerExists': {
                return `Die Versichertennummer ${err.versichertennummer} existiert bereits`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }

    #errorMsgUpdatePatient(err: UpdateError) {
        switch (err.type) {
            case 'PatientNotExists': {
                return `Es gibt keinen Patienten mit der ID ${err.id}`;
            }
            case 'VersionInvalid': {
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            }
            case 'VersionOutdated': {
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            }
            default: {
                return 'Unbekannter Fehler';
            }
        }
    }
}
