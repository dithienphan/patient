/* eslint-disable max-classes-per-file */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    IsArray,
    IsBoolean,
    IsISO8601,
    IsOptional,
    Matches,
    ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NameDTO } from './nameDTO.entity.js';
import { OperationDTO } from './operationDTO.entity.js';
import { PatientVersicherungsart } from '../entity/patient.entity.js';
import { Type } from 'class-transformer';

/**
 * Entity-Klasse für Patienten ohne TypeORM und ohne Referenzen.
 */
export class PatientDtoOhneRef {
    @ApiProperty({ example: 'A123456789', type: String })
    readonly versichertennummer!: string;

    @Matches(/^GESETZLICH$|^PRIVAT$/u)
    @IsOptional()
    @ApiProperty({ example: 'GESETZLICH', type: String })
    readonly versicherungsart: PatientVersicherungsart | undefined;

    @IsISO8601({ strict: true })
    @IsOptional()
    @ApiProperty({ example: '2021-01-31' })
    readonly geburtsdatum: Date | string | undefined;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly intensiv: boolean | undefined;

    @IsOptional()
    @ApiProperty({ example: 'Schnupfen', type: String })
    readonly diagnose: string | undefined;
}

/**
 * Entity-Klasse für Patienten ohne TypeORM.
 */
export class PatientDTO extends PatientDtoOhneRef {
    @ValidateNested()
    @Type(() => NameDTO)
    @ApiProperty({ example: 'Der Name', type: String })
    readonly name!: NameDTO; //NOSONAR

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OperationDTO)
    @ApiProperty({ example: 'Die Operationen', type: String })
    readonly operationen: OperationDTO[] | undefined;

    // OperationDTO
}
/* eslint-enable max-classes-per-file */
