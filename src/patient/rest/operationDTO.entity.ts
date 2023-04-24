/* eslint-disable @typescript-eslint/no-magic-numbers */

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import { IsNumber, IsOptional, MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Operation ohne TypeORM.
 */
export class OperationDTO {
    @MaxLength(64)
    readonly eingriff!: string;

    @IsOptional()
    @IsNumber()
    readonly behandlungsraum: number | undefined;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
