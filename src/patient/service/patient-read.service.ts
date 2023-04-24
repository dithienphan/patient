import { PatientVersicherungsart } from "../entity/patient.entity";

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
// TODO gehört 'name' hier rein?
export interface Suchkriterien {
    readonly versichertennummer?: number;
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
export class PatientReadService {
    async findById({ id, mitOperationen = false }: FindByIdParams) {
        // TODO Logger
        //TODO query-builder
    }
}
