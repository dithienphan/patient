/* eslint-disable max-lines */

/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import {
    type Patient,
    type PatientVersicherungsart,
} from '../entity/patient.entity.js';
import {
    PatientReadService,
    type Suchkriterien,
} from '../service/patient-read.service.js';
import { Request, Response } from 'express';
import { Name } from '../entity/name.entity.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { getBaseUri } from './getBaseUri.js';
import { getLogger } from '../../logger/logger.js';
import { paths } from '../../config/paths.js';

/** href-Link für HATEOAS */
export interface Link {
    /** href-Link für HATEOAS-Links */
    href: string;
}

/** Links für HATEOAS */
export interface Links {
    /** self-Link */
    self: Link;
    /** Optionaler Linke für list */
    list?: Link;
    /** Optionaler Linke für add */
    add?: Link;
    /** Optionaler Linke für update */
    update?: Link;
    /** Optionaler Linke für remove */
    remove?: Link;
}

/** Typedefinition für ein Name-Objekt ohne Rückwärtsverweis zum Patient */
export type NameModel = Omit<Name, 'id' | 'patient'>;

/** Patient-Objekt mit HATEOAS-Links */
export type PatientModel = Omit<
    Patient,
    'aktualisiert' | 'erzeugt' | 'id' | 'name' | 'operationen' | 'version'
> & {
    name: NameModel;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

/** Patient-Objekte mit HATEOAS-Links in einem JSON-Array. */
export interface PatientenModel {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        patienten: PatientModel[];
    };
}

/**
 * Klasse für `PatientGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `PatientController` hat dieselben Properties wie die Basisklasse
 * `Patient` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */
export class PatientQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly versichertennummer: string;

    @ApiProperty({ required: false })
    declare readonly versicherungsart: PatientVersicherungsart;

    @ApiProperty({ required: false })
    declare readonly intensiv: boolean;

    @ApiProperty({ required: false })
    declare readonly geburtsdatum: Date;

    @ApiProperty({ required: false })
    declare readonly name: string;

    @ApiProperty({ required: false })
    declare readonly diagnose?: string;
}

/**
 * Die Controller-Klasse für die Verwaltung von Bücher.
 */
// Decorator in TypeScript, zur Standardisierung in ES vorgeschlagen (stage 3)
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-0-beta/#decorators
// https://github.com/tc39/proposal-decorators
@Controller(paths.rest)
// @UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Patient API')
// @ApiBearerAuth()
// Klassen ab ES 2015
export class PatientGetController {
    // readonly in TypeScript, vgl. C#
    // private ab ES 2019
    readonly #service: PatientReadService;

    readonly #logger = getLogger(PatientGetController.name);

    // Dependency Injection (DI) bzw. Constructor Injection
    // constructor(private readonly service: PatientReadService) {}
    constructor(service: PatientReadService) {
        this.#service = service;
    }

    /**
     * Ein Patient wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Patient gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Patientes gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird das gefundene
     * Patient im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es kein Patient zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param accept Content-Type bzw. MIME-Type
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // eslint-disable-next-line max-params, max-lines-per-function
    @Get(':id')
    @ApiOperation({ summary: 'Suche mit der Patient-ID', tags: ['Suchen'] })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 00000000-0000-0000-0000-000000000001',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte GET-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Das Patient wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Patient zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Das Patient wurde bereits heruntergeladen',
    })
    async findById(
        @Param('id') id: number,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<PatientModel | undefined>> {
        this.#logger.debug('findById: id=%s, version=%s"', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let patient: Patient | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            patient = await this.#service.findById({ id });
        } catch (err) {
            // err ist implizit vom Typ "unknown", d.h. keine Operationen koennen ausgefuehrt werden
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            this.#logger.error('findById: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (patient === undefined) {
            this.#logger.debug('findById: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        this.#logger.debug('findById(): patient=%o', patient);

        // ETags
        const versionDb = patient.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('findById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const patientModel = this.#toModel(patient, req);
        this.#logger.debug('findById: patientModel=%o', patientModel);
        return res.json(patientModel);
    }

    /**
     * Bücher werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Patient gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Büchern, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Patient zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Bücher ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Suche mit Suchkriterien', tags: ['Suchen'] })
    @ApiOkResponse({ description: 'Eine evtl. leere Liste mit Büchern' })
    async find(
        @Query() query: PatientQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<PatientenModel | undefined>> {
        this.#logger.debug('find: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const patienten = await this.#service.find(query);
        this.#logger.debug('find: %o', patienten);
        if (patienten.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        // HATEOAS: Atom Links je Patient
        const patientenModel = patienten.map((patient) =>
            this.#toModel(patient, req, false),
        );
        this.#logger.debug('find: patientenModel=%o', patientenModel);

        const result: PatientenModel = {
            _embedded: { patienten: patientenModel },
        };
        return res.json(result).send();
    }

    #toModel(patient: Patient, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = patient;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: patient=%o, links=%o', patient, links);
        const nameModel: NameModel = {
            nachname: patient.name?.nachname ?? 'N/A', // eslint-disable-line unicorn/consistent-destructuring
            vorname: patient.name?.vorname ?? 'N/A', // eslint-disable-line unicorn/consistent-destructuring
        };
        /* eslint-disable unicorn/consistent-destructuring */
        const patientModel: PatientModel = {
            versichertennummer: patient.versichertennummer,
            versicherungsart: patient.versicherungsart,
            intensiv: patient.intensiv,
            geburtsdatum: patient.geburtsdatum,
            diagnose: patient.diagnose,
            name: nameModel,
            _links: links,
        };
        /* eslint-enable unicorn/consistent-destructuring */

        return patientModel;
    }
}
/* eslint-enable max-lines */
