-- "user-private schema" (Default-Schema: public)
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION patient;

ALTER ROLE patient SET search_path = 'patient';
