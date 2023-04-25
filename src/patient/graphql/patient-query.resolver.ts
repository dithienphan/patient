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
import { Args, Query, Resolver } from '@nestjs/graphql';
import { BadUserInputError } from './errors.js';
import { type Patient } from '../entity/patient.entity.js';
import { PatientReadService } from '../service/patient-read.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { UseInterceptors } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';

export type PatientDTO = Omit<
    Patient,
    'operationen' | 'aktualisiert' | 'erzeugt'
>;
export interface IdInput {
    id: number;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class PatientQueryResolver {
    readonly #service: PatientReadService;

    readonly #logger = getLogger(PatientQueryResolver.name);

    constructor(service: PatientReadService) {
        this.#service = service;
    }

    @Query()
    async patient(@Args() idInput: IdInput) {
        const { id } = idInput;
        this.#logger.debug('findById: id=%d', id);

        const patient = await this.#service.findById({ id });
        if (patient === undefined) {
            // https://www.apollographql.com/docs/apollo-server/data/errors
            throw new BadUserInputError(
                `Es wurde kein Patient mit der ID ${id} gefunden.`,
            );
        }
        const patientDTO = this.#toPatientDTO(patient);
        this.#logger.debug('findById: patientDTO=%o', patientDTO);
        return patientDTO;
    }

    @Query()
    async patienten(@Args() titel: { titel: string } | undefined) {
        const titelStr = titel?.titel;
        this.#logger.debug('find: titel=%s', titelStr);
        const suchkriterium = titelStr === undefined ? {} : { titel: titelStr };
        const patienten = await this.#service.find(suchkriterium);
        if (patienten.length === 0) {
            throw new BadUserInputError('Es wurden keine B gefunden.');
        }

        const patientenDTO = patienten.map((patient) =>
            this.#toPatientDTO(patient),
        );
        this.#logger.debug('find: patientenDTO=%o', patientenDTO);
        return patientenDTO;
    }

    #toPatientDTO(patient: Patient): PatientDTO {
        return {
            id: patient.id,
            version: patient.version,
            versichertennummer: patient.versichertennummer,
            versicherungsart: patient.versicherungsart,
            intensiv: patient.intensiv,
            geburtsdatum: patient.geburtsdatum,
            diagnose: patient.diagnose,
            name: patient.name,
        };
    }
}
