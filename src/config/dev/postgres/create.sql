CREATE SCHEMA IF NOT EXISTS AUTHORIZATION patient;

ALTER ROLE patient SET search_path = 'patient';

CREATE TYPE versicherungsart AS ENUM ('GESETZLICH', 'PRIVAT');

CREATE TABLE IF NOT EXISTS patient (
    id                      integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE patientspace,
    version                 integer NOT NULL DEFAULT 0,
    versichertennummer      varchar(11) NOT NULL UNIQUE USING INDEX TABLESPACE patientspace,
    versicherungsart        versicherungsart,
    geburtsdatum            date,
    intensiv                boolean NOT NULL DEFAULT FALSE,
    diagnose                varchar(40),
    erzeugt                 timestamp NOT NULL DEFAULT NOW(),
    aktualisiert            timestamp NOT NULL DEFAULT NOW()
) TABLESPACE patientspace;

CREATE TABLE IF NOT EXISTS name (
    id              integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE patientspace,
    nachname        varchar(32) NOT NULL,
    vorname         varchar(32) NOT NULL,
    patient_id      integer NOT NULL UNIQUE USING INDEX TABLESPACE patientspace REFERENCES patient
) TABLESPACE patientspace;

CREATE TABLE IF NOT EXISTS operation (
    id                  integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE patientspace,
    eingriff            varchar(64) NOT NULL,
    behandlungsraum     integer,
    patient_id          integer NOT NULL REFERENCES patient
) TABLESPACE patientspace;
CREATE INDEX IF NOT EXISTS operation_patient_id_idx ON operation(patient_id) TABLESPACE patientspace;