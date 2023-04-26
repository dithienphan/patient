// Tests mit
//  * jest      https://jestjs.io
//  * Mocha     https://mochajs.org
//  * node:test ab Node 18 https://nodejs.org/download/rc/v18.0.0-rc.1/docs/api/test.html

import { afterAll, beforeAll, describe } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { HttpStatus } from '@nestjs/common';
import { type PatientModel } from '../../src/patient/rest/patient-get.controller.js';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = '1';
const idNichtVorhanden = '999999';
const idVorhandenETag = '1';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /rest/:id', () => {
    let client: AxiosInstance;

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Patient zu vorhandener ID', async () => {
        // given
        const url = `/${idVorhanden}`;

        // when
        const response: AxiosResponse<PatientModel> = await client.get(url);

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);

        // eslint-disable-next-line no-underscore-dangle
        const selfLink = data._links.self.href;

        // eslint-disable-next-line security-node/non-literal-reg-expr
        expect(selfLink).toMatch(new RegExp(`${url}$`, 'u'));
    });

    test('Kein Patient zu nicht-vorhandener ID', async () => {
        // given
        const url = `/${idNichtVorhanden}`;

        // when
        const response: AxiosResponse<string> = await client.get(url);

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });

    test('Patient zu vorhandener ID mit ETag', async () => {
        // given
        const url = `/${idVorhandenETag}`;

        // when
        const response: AxiosResponse<string> = await client.get(url, {
            headers: { 'If-None-Match': '"0"' }, // eslint-disable-line @typescript-eslint/naming-convention
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_MODIFIED);
        expect(data).toBe('');
    });
});
