/* eslint-disable max-lines */
/**
 * Das Modul besteht aus der Controller-Klasse für Schreiben an der REST-Schnittstelle.
 * @packageDocumentation
 */

import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Body,
    Controller,
    //Delete,
    Headers,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { type CreateError, type UpdateError } from '../service/errors.js';
import { PatientDTO, PatientDtoOhneRef } from './patientDTO.entity.js';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../../security/auth/jwt/jwt-auth.guard.js';
import { type Name } from '../entity/name.entity.js';
import { type Operation } from '../entity/operation.entity.js';
import { type Patient } from '../entity/patient.entity.js';
import { PatientWriteService } from '../service/patient-write.service.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { RolesAllowed } from '../../security/auth/roles/roles-allowed.decorator.js';
import { RolesGuard } from '../../security/auth/roles/roles.guard.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/**
 * Die Controller-Klasse für die Verwaltung von Patienten.
 */
@Controller(paths.rest)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Patient API')
@ApiBearerAuth()
export class PatientWriteController {
    readonly #service: PatientWriteService;

    readonly #logger = getLogger(PatientWriteController.name);

    constructor(service: PatientWriteService) {
        this.#service = service;
    }

    /**
     * Ein neuer Patient wird asynchron angelegt. Das neu anzulegende Patient ist als
     * JSON-Datensatz im Request-Objekt enthalten. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit das neu angelegte Patient abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn der Name oder die VERSICHERTENNUMMER-Nummer bereits
     * existieren.
     *
     * @param patient JSON-Daten für ein Patient im Request-Body.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @RolesAllowed('arzt', 'rezeptionist')
    @ApiOperation({ summary: 'Einen neuen Patienten anlegen' })
    @ApiCreatedResponse({ description: 'Erfolgreich neu angelegt' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Patientdaten' })
    async create(
        @Body() patientDTO: PatientDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('create: patientDTO=%o', patientDTO);

        const patient = this.#patientDtoToPatient(patientDTO);
        const result = await this.#service.create(patient);
        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            return this.#handleCreateError(result as CreateError, res);
        }

        const location = `${getBaseUri(req)}/${result as number}`;
        this.#logger.debug('create: location=%s', location);
        return res.location(location).send();
    }

    /**
     * Ein vorhandener Patient wird asynchron aktualisiert.
     *
     * Im Request-Objekt von Express muss die ID des zu aktualisierenden Patientes
     * als Pfad-Parameter enthalten sein. Außerdem muss im Rumpf das zu
     * aktualisierende Patient als JSON-Datensatz enthalten sein. Damit die
     * Aktualisierung überhaupt durchgeführt werden kann, muss im Header
     * `If-Match` auf die korrekte Version für optimistische Synchronisation
     * gesetzt sein.
     *
     * Bei erfolgreicher Aktualisierung wird der Statuscode `204` (`No Content`)
     * gesetzt und im Header auch `ETag` mit der neuen Version mitgeliefert.
     *
     * Falls die Versionsnummer fehlt, wird der Statuscode `428` (`Precondition
     * required`) gesetzt; und falls sie nicht korrekt ist, der Statuscode `412`
     * (`Precondition failed`). Falls Constraints verletzt sind, wird der
     * Statuscode `400` (`Bad Request`) gesetzt und genauso auch wenn der neue
     * Name oder die neue VERSICHERTENNUMMER-Nummer bereits existieren.
     *
     * @param patient Patientdaten im Body des Request-Objekts.
     * @param id Pfad-Paramater für die ID.
     * @param version Versionsnummer aus dem Header _If-Match_.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params
    @Put(':id')
    @RolesAllowed('arzt', 'rezeptionist')
    @ApiOperation({
        summary: 'Ein vorhandenen Patient aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Header für optimistische Synchronisation',
        required: false,
    })
    @ApiHeader({
        name: 'Authorization',
        description: 'Header für JWT',
        required: true,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Patientdaten' })
    @ApiPreconditionFailedResponse({
        description: 'Falsche Version im Header "If-Match"',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header "If-Match" fehlt',
    })
    async update(
        @Body() patientDTO: PatientDtoOhneRef,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'update: id=%s, patientDTO=%o, version=%s',
            id,
            patientDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('#handleUpdateError: msg=%s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }

        const patient = this.#patientDtoOhneRefToPatient(patientDTO);
        const result = await this.#service.update({ id, patient, version });
        if (typeof result === 'object') {
            return this.#handleUpdateError(result, res);
        }

        this.#logger.debug('update: version=%d', result);
        return res.set('ETag', `"${result}"`).sendStatus(HttpStatus.NO_CONTENT);
    }

    // /**
    //  * Ein Patient wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
    //  * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
    //  *
    //  * @param id Pfad-Paramater für die ID.
    //  * @param res Leeres Response-Objekt von Express.
    //  * @returns Leeres Promise-Objekt.
    //  */
    // @Delete(':id')
    // @RolesAllowed('rezeptionist')
    // @ApiOperation({ summary: 'Patient mit der ID löschen', tags: ['Loeschen'] })
    // @ApiHeader({
    //     name: 'Authorization',
    //     description: 'Header für JWT',
    //     required: true,
    // })
    // @ApiNoContentResponse({
    //     description: 'Das Patient wurde gelöscht oder war nicht vorhanden',
    // })
    // async delete(
    //     @Param('id') id: number,
    //     @Res() res: Response,
    // ): Promise<Response<undefined>> {
    //     this.#logger.debug('delete: id=%s', id);

    //     try {
    //         await this.#service.delete(id);
    //     } catch (err) {
    //         this.#logger.error('delete: error=%o', err);
    //         return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    //     }

    //     return res.sendStatus(HttpStatus.NO_CONTENT);
    // }

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
            intensiv: patientDTO.intensiv,
            geburtsdatum: patientDTO.geburtsdatum,
            diagnose: patientDTO.diagnose,
            name,
            operationen,
            erzeugt: undefined,
            aktualisiert: undefined,
        };

        // Rueckwaertsverweise
        patient.name.patient = patient;
        patient.operationen?.forEach((operation) => {
            operation.patient = patient;
        });
        return patient;
    }

    #handleCreateError(err: CreateError, res: Response) {
        switch (err.type) {
            case 'VersichertennummerExists': {
                return this.#handleVersichertennummerExists(
                    err.versichertennummer,
                    res,
                );
            }

            default: {
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    #handleVersichertennummerExists(
        versichertennummer: string | null | undefined,
        res: Response,
    ): Response {
        const msg = `Die Versichertennummer "${versichertennummer}" existiert bereits.`;
        this.#logger.debug('#handleVersichertennummerExists(): msg=%s', msg);
        return res
            .status(HttpStatus.UNPROCESSABLE_ENTITY)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    #patientDtoOhneRefToPatient(patientDTO: PatientDtoOhneRef): Patient {
        return {
            id: undefined,
            version: undefined,
            versichertennummer: patientDTO.versichertennummer,
            versicherungsart: patientDTO.versicherungsart,
            intensiv: patientDTO.intensiv,
            geburtsdatum: patientDTO.geburtsdatum,
            diagnose: patientDTO.diagnose,
            name: undefined,
            operationen: undefined,
            erzeugt: undefined,
            aktualisiert: undefined,
        };
    }

    #handleUpdateError(err: UpdateError, res: Response): Response {
        switch (err.type) {
            case 'PatientNotExists': {
                const { id } = err;
                const msg = `Es gibt kein Patient mit der ID "${id}".`;
                this.#logger.debug('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'VersionInvalid': {
                const { version } = err;
                const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
                this.#logger.debug('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            case 'VersionOutdated': {
                const { version } = err;
                const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
                this.#logger.debug('#handleUpdateError: msg=%s', msg);
                return res
                    .status(HttpStatus.PRECONDITION_FAILED)
                    .set('Content-Type', 'text/plain')
                    .send(msg);
            }

            default: {
                return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
}
/* eslint-enable max-lines */
