import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

//Name
@Entity()
export class Name {
    @Column('id')
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar', { length: 32 })
    readonly nachname!: string | undefined;

    @Column('varchar', { length: 32 })
    readonly vorname!: string | undefined;

    @OneToOne(() => Patient, (patient) => patient.name)
    @JoinColumn({ name: 'patient_id' })
    patient: Patient | undefined;
}
