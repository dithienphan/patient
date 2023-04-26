import { type AxiosInstance, type AxiosResponse } from 'axios';
import {
    type GraphQLQuery,
    type GraphQLResponseBody,
} from './patient/patient-query.resolver.test.js';
import { httpsAgent, loginPath } from './testserver.js';
import { type LoginResult } from '../src/security/auth/service/auth.service.js';
import dotenv from 'dotenv';
import process from 'node:process';

const usernameDefault = 'admin';

dotenv.config();
const { env } = process;
const { USER_PASSWORD } = env;
const passwordDefault = USER_PASSWORD!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

export const loginRest = async (
    axiosInstance: AxiosInstance,
    username = usernameDefault,
    password = passwordDefault,
) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded', // eslint-disable-line @typescript-eslint/naming-convention
    };
    const response: AxiosResponse<LoginResult> = await axiosInstance.post(
        loginPath,
        `username=${username}&password=${password}`,
        { headers, httpsAgent },
    );
    return response.data.token;
};

export const loginGraphQL = async (
    axiosInstance: AxiosInstance,
    username: string = usernameDefault,
    password: string = passwordDefault,
): Promise<string> => {
    const body: GraphQLQuery = {
        query: `
            mutation {
                login(
                    username: "${username}",
                    password: "${password}"
                ) {
                    token
                }
            }
        `,
    };

    const response: AxiosResponse<GraphQLResponseBody> =
        await axiosInstance.post('graphql', body, { httpsAgent });

    const data = response.data.data!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    return data.login.token; // eslint-disable-line @typescript-eslint/no-unsafe-return
};
