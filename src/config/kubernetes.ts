/**
 * Das Modul enthält die Information, ob man innerhalb von Kubernetes ist.
 * @packageDocumentation
 */

import { env } from './env.js';
import { hostname } from 'node:os';

// DNS-Name eines Kubernetes-Pod endet z.B. mit -75469ff64b-q3bst
const kubernetesRegexp = /^\w+-[a-z\d]{8,10}-[a-z\d]{5}$/u;
const isK8s = kubernetesRegexp.exec(hostname()) !== null;
const { K8S_TLS, LOG_DEFAULT } = env;

/**
 * Das Konfigurationsobjekt für Kubernetes.
 */
// "as const" fuer readonly
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions
// https://github.com/tc39/proposal-record-tuple
export const k8sConfig = {
    detected: isK8s,
    tls: K8S_TLS === undefined || K8S_TLS.toLowerCase() === 'true',
} as const;

if (LOG_DEFAULT?.toLowerCase() !== 'true') {
    console.debug('k8sConfig: %o', k8sConfig);
}
