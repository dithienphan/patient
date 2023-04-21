/**
 * Das Modul enthält den Namen des DB-Typs: postgres, mysql oder sqlite.
 * @packageDocumentation
 */

import { env } from './env.js';

const { DB_TYPE } = env;

// 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
export const dbType =
    DB_TYPE === 'postgres' || DB_TYPE === 'mysql' || DB_TYPE === 'sqlite'
        ? DB_TYPE
        : 'postgres';
