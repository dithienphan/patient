import { Name } from './name.entity.js';
import { Operation } from './operation.entity.js';
import { Patient } from './patient.entity.js';

// erforderlich in src/config/db.ts und src/patient/patient.module.ts
export const entities = [Name, Operation, Patient];
