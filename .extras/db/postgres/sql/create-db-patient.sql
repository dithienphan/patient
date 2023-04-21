-- (1) user "postgres" in docker-compose.yaml auskommentieren,
--     damit der PostgreSQL-Server implizit mit dem Linux-User "root" gestartet wird
-- (2) PowerShell:
--     cd <Verzeichnis-mit-docker-compose.yaml>
--     docker compose up postgres
-- (3) 2. PowerShell:
--     cd <Verzeichnis-mit-docker-compose.yaml>
--     docker compose exec postgres bash
--         chown postgres:postgres /var/lib/postgresql/tablespace
--         chown postgres:postgres /var/lib/postgresql/tablespace/patient
--         exit
--     docker compose down
-- (3) in docker-compose.yaml den User "postgres" wieder aktivieren, d.h. Kommentar entfernen
-- (4) 1. PowerShell:
--     docker compose up
-- (5) 2. PowerShell:
--     docker compose exec postgres bash
--        psql --dbname=postgres --username=postgres --file=/sql/create-db-patient.sql
--        exit
--     docker compose down

-- https://www.postgresql.org/docs/current/sql-createrole.html
CREATE ROLE patient LOGIN PASSWORD 'p';

-- https://www.postgresql.org/docs/current/sql-createdatabase.html
CREATE DATABASE patient;

GRANT ALL ON DATABASE patient TO patient;

-- https://www.postgresql.org/docs/10/sql-createtablespace.html
CREATE TABLESPACE patientspace OWNER patient LOCATION '/var/lib/postgresql/tablespace/patient';
