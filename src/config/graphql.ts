import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { existsSync } from 'node:fs';

// im Docker-Image gibt es kein Unterverzeichnis "src"
const BASE_PATH = existsSync('src') ? 'src' : 'dist';
const SCHEMA_GRAPHQL = 'patient/graphql/schema.graphql';
const LOGIN_GRAPHQL = 'security/auth/login.graphql';

/**
 * Das Konfigurationsobjekt für GraphQL.
 */
export const graphQlModuleOptions: ApolloDriverConfig = {
    typePaths: [
        `./${BASE_PATH}/${SCHEMA_GRAPHQL}`,
        `./${BASE_PATH}/${LOGIN_GRAPHQL}`,
    ],
    // alternativ: Mercurius (statt Apollo) fuer Fastify (statt Express)
    driver: ApolloDriver,
    playground: true,
};
