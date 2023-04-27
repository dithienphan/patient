/**
 * Das Modul enthält die Konfiguration für den Zugriff auf die DB.
 * @packageDocumentation
 */
import { type DataSourceOptions } from 'typeorm';
import { Patient } from '../patient/entity/patient.entity.js';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dbType } from './dbtype.js';
import { entities } from '../patient/entity/entities.js';
import { env } from './env.js';
import { k8sConfig } from './kubernetes.js';
import { loggerDefaultValue } from './logger.js';
import { nodeConfig } from './node.js';

const {
    DB_NAME,
    DB_HOST,
    DB_USERNAME,
    DB_PASSWORD,
    DB_PASSWORD_ADMIN,
    DB_POPULATE,
} = env;

// nullish coalescing
const database = DB_NAME ?? Patient.name.toLowerCase();
const { detected } = k8sConfig;

const host = detected ? dbType : DB_HOST ?? 'localhost';
const username = DB_USERNAME ?? Patient.name.toLowerCase();
const pass = DB_PASSWORD ?? 'p';
const passAdmin = DB_PASSWORD_ADMIN ?? 'p';

const namingStrategy = new SnakeNamingStrategy();

// logging durch console.log()
const logging =
    (nodeConfig.nodeEnv === 'development' || nodeConfig.nodeEnv === 'test') &&
    !loggerDefaultValue;
const logger = 'advanced-console';

// TODO records als "deeply immutable data structure" (Stage 2)
// https://github.com/tc39/proposal-record-tuple
export let typeOrmModuleOptions: TypeOrmModuleOptions;
switch (dbType) {
    case 'postgres': {
        typeOrmModuleOptions = {
            type: 'postgres',
            host,
            port: 5432,
            username,
            password: pass,
            database,
            entities,
            namingStrategy,
            logging,
            logger,
        };
        // "rest properties" ab ES 2018: https://github.com/tc39/proposal-object-rest-spread
        const { password, ...typeOrmModuleOptionsLog } = typeOrmModuleOptions;
        if (!loggerDefaultValue) {
            console.debug('typeOrmModuleOptions: %o', typeOrmModuleOptionsLog);
        }
        break;
    }
    case 'mysql': {
        typeOrmModuleOptions = {
            type: 'mysql',
            host,
            port: 3306,
            username,
            password: pass,
            database,
            entities,
            namingStrategy,
            supportBigNumbers: true,
            logging,
            logger,
        };
        // "rest properties" ab ES 2018: https://github.com/tc39/proposal-object-rest-spread
        const { password, ...typeOrmModuleOptionsLog } = typeOrmModuleOptions;
        if (!loggerDefaultValue) {
            console.debug('typeOrmModuleOptions: %o', typeOrmModuleOptionsLog);
        }
        break;
    }
    // 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
    case 'sqlite': {
        typeOrmModuleOptions = {
            type: 'sqlite',
            database: `${database}.sqlite`,
            entities,
            namingStrategy,
            logging,
            logger,
        };
        if (!loggerDefaultValue) {
            console.debug('typeOrmModuleOptions: %o', typeOrmModuleOptions);
        }
        break;
    }
    default: {
        typeOrmModuleOptions = {
            type: 'postgres',
            host,
            port: 5432,
            username,
            password: pass,
            database,
            entities,
            logging,
            logger,
        };
        break;
    }
}
Object.freeze(typeOrmModuleOptions);

export const dbPopulate = DB_POPULATE?.toLowerCase() === 'true';
export const adminDataSourceOptions: DataSourceOptions =
    dbType === 'mysql'
        ? {
              type: 'mysql',
              host,
              port: 3306,
              username: 'root',
              password: passAdmin,
              database,
              namingStrategy,
              supportBigNumbers: true,
              logging,
              logger,
          }
        : {
              type: 'postgres',
              host,
              port: 5432,
              username: 'postgres',
              password: passAdmin,
              database,
              schema: database,
              namingStrategy,
              logging,
              logger,
          };
