/* eslint-disable @typescript-eslint/no-magic-numbers */

import { Matches, MaxLength } from 'class-validator';

/**
 * Entity-Klasse für Name ohne TypeORM.
 */
export class NameDTO {
    @Matches('^\\w.*')
    @MaxLength(32)
    readonly nachname!: string;

    @Matches('^\\w.*')
    @MaxLength(32)
    readonly vorname!: string;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
