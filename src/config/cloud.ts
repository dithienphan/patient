/**
 * Das Modul enthält die Information, ob die Anwendung überhaupt in einer Cloud
 * läuft, und ggf. ob es sich um _OpenShift_ handelt.
 * @packageDocumentation
 */

import RE2 from 're2';
import { env } from './env.js';
import { hostname } from 'node:os';

/**
 * _Union Type_ für Cloud-Varianten, z.B. _OpenShift_.
 */
export type Cloud = 'openshift';

const computername = hostname();

/**
 * Information, ob die Anwendung überhaupt in einer Cloud läuft, und ggf. ob es
 * sich um _OpenShift_ handelt. Der Rechnername ist bei OpenShift:
 * <Projektname_aus_package.json>-\<Build-Nr>-\<random-alphanumeric-5stellig>
 */
export let cloud: Cloud | undefined;

const openshiftRegexp = new RE2('beispiel-\\d+-w{5}', 'u');
if (openshiftRegexp.test(computername)) {
    cloud = 'openshift';
}

if (env.LOG_DEFAULT?.toLowerCase() !== 'true') {
    console.debug('cloud: %s', cloud);
}
