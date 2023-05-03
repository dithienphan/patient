-- "user-private schema" (Default-Schema: public)
CREATE SCHEMA IF NOT EXISTS AUTHORIZATION arzt;

ALTER ROLE arzt SET search_path = 'arzt';
