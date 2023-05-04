/* eslint-disable @typescript-eslint/no-non-null-assertion  */

import {
    type GraphQLQuery,
    type GraphQLResponseBody,
} from './patient-query.resolver.test.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { HttpStatus } from '@nestjs/common';
import { PatientReadService } from '../../src/patient/service/patient-read.service.js';
import { loginGraphQL } from '../login.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Mutations', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    // -------------------------------------------------------------------------
    test('Neueer Patient', async () => {
        // given
        const token = await loginGraphQL(client);
        const authorization = { Authorization: `Bearer ${token}` }; // eslint-disable-line @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            query: `
                mutation {
                    create(
                        input: {
                            versichertennummer: "a123456700",
                            versicherungsart: PRIVAT,
                            geburtsdatum: "2022-02-28",
                            intensiv: true,
                            diagnose: "Hoffnung",
                            name: {
                                nachname: "ncreatemutation",
                                vorname: "vcreatemutation"
                            },
                            operation: [{
                                eingriff: "nichts",
                                behandlungsraum: 1
                            }]
                        }
                    )
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponseBody> = await client.post(
            graphqlPath,
            body,
            { headers: authorization },
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data).toBeDefined();

        const { create } = data.data!;

        // Der Wert der Mutation ist die generierte ObjectID
        expect(create).toBeDefined();
        expect(PatientReadService.ID_PATTERN.test(create as string)).toBe(true);
    });
});
/* eslint-enable @typescript-eslint/no-non-null-assertion */
