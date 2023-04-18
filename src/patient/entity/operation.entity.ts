import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Patient } from './patient.entity.js';

@Entity()
export class Operation {
    @Column('int')
    // https://typeorm.io/entities#primary-columns
    // CAVEAT: zuerst @Column() und erst dann @PrimaryGeneratedColumn()
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar', { length: 64 })
    readonly eingriff!: string;

    @Column('int')
    readonly behandlungsraum: number | undefined;

    @ManyToOne(() => Patient, (patient) => patient.operationen)
    @JoinColumn({ name: 'patient_id' })
    patient: Patient | undefined;
}
