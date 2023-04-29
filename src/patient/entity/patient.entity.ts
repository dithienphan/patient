// Nest unterstützt verschiedene Werkzeuge fuer OR-Mapping
// https://docs.nestjs.com/techniques/database
//  * TypeORM     https://typeorm.io
//  * Sequelize   https://sequelize.org
//  * Knex        https://knexjs.org

// TypeORM unterstützt die Patterns
//  * "Data Mapper" und orientiert sich an Hibernate (Java), Doctrine (PHP) und Entity Framework (C#)
//  * "Active Record" und orientiert sich an Mongoose (JavaScript)

// TypeORM unterstützt u.a. die DB-Systeme
//  * Postgres
//  * MySQL
//  * SQLite durch sqlite3 und better-sqlite3
//  * Oracle
//  * Microsoft SQL Server
//  * SAP Hana
//  * Cloud Spanner von Google

/**
 * Das Modul besteht aus der Entity-Klasse.
 * @packageDocumentation
 */

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    VersionColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Name } from './name.entity.js';
import { Operation } from './operation.entity.js';
import { dbType } from '../../config/dbtype.js';

/**
 * Alias-Typ für gültige Strings bei der Versicherungsart eines Patientes.
 */
export type PatientVersicherungsart = 'GESETZLICH' | 'PRIVAT';

/**
 * Entity-Klasse zu einem relationalen Tabelle
 */
// https://typeorm.io/entities
@Entity()
export class Patient {
    @Column('int')
    // https://typeorm.io/entities#primary-columns
    // CAVEAT: zuerst @Column() und erst dann @PrimaryGeneratedColumn()
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar', { unique: true, length: 10 })
    @ApiProperty({ example: 'A123456789', type: String })
    readonly versichertennummer!: string;

    @Column('varchar', { length: 11 })
    @ApiProperty({ example: 'GESETZLICH', type: String })
    readonly versicherungsart: PatientVersicherungsart | undefined;

    // das Temporal-API ab ES2022 wird von TypeORM noch nicht unterstuetzt
    @Column('date')
    @ApiProperty({ example: '2021-01-31' })
    readonly geburtsdatum: Date | string | undefined;

    @Column('boolean')
    @ApiProperty({ example: true, type: Boolean })
    readonly intensiv: boolean | undefined;

    @Column('varchar', { length: 40 })
    @ApiProperty({ example: 'Schnupfen', type: String })
    readonly diagnose: string | undefined;

    // undefined wegen Updates
    @OneToOne(() => Name, (name) => name.patient, {
        cascade: ['insert', 'remove'],
    })
    readonly name: Name | undefined;

    // undefined wegen Updates
    @OneToMany(() => Operation, (operation) => operation.patient, {
        cascade: ['insert', 'remove'],
    })
    readonly operationen: Operation[] | undefined;

    // 'better-sqlite3' erfordert Python zum Uebersetzen, wenn das Docker-Image gebaut wird
    @CreateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    // SQLite:
    // @CreateDateColumn({ type: 'datetime' })
    readonly erzeugt: Date | undefined;

    @UpdateDateColumn({
        type: dbType === 'sqlite' ? 'datetime' : 'timestamp',
    })
    // SQLite:
    // @UpdateDateColumn({ type: 'datetime' })
    readonly aktualisiert: Date | undefined;
}
