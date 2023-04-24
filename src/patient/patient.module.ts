import { AuthModule } from '../security/auth/auth.module.js';
import { Module } from '@nestjs/common';
import { PatientGetController } from './rest/patient-get.controller.js';
import { PatientMutationResolver } from './graphql/patient-mutation.resolver.js';
import { PatientQueryResolver } from './graphql/patient-query.resolver.js';
import { PatientReadService } from './service/patient-read.service.js';
import { PatientWriteController } from './rest/patient-write.controller.js';
import { PatientWriteService } from './service/patient-write.service.js';
import { QueryBuilder } from './service/query-builder.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entity/entities.js';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Bücher.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [TypeOrmModule.forFeature(entities), AuthModule],
    controllers: [PatientGetController, PatientWriteController],
    // Provider sind z.B. Service-Klassen fuer DI
    providers: [
        PatientReadService,
        PatientWriteService,
        PatientQueryResolver,
        PatientMutationResolver,
        QueryBuilder,
    ],
    // Export der Provider fuer DI in anderen Modulen
    exports: [PatientReadService, PatientWriteService],
})
export class PatientModule {}
