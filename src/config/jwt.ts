import { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import { configDir } from './node.js';
import { env } from './env.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Das Modul enthält die Konfiguration für JWT.
 * @packageDocumentation
 */

// Algorithmen fuer JWT: https://tools.ietf.org/html/rfc7518

// RS256 = RSA mit SHA-256 (z.B. bei Google)
// RSA von Ron Rivest, Adi Shamir, Leonard Adleman
// RSA impliziert einen privaten und einen oeffentlichen Schluessel

// HS256 = HMAC mit SHA-256 (default)
// HMAC = Keyed-Hash MAC (= Message Authentication Code)
// Passwort (bzw. Secret) erforderlich

// ES384: ECDSA = Elliptic Curve Digital Signature Algorithm
// elliptische Kurven, z.B. y^2 = x^3 + ax + b
// ECDSA hat bei gleicher Sicherheit deutlich kuerzere Schluessel, benoetigt
// aber mehr Rechenleistung. Die Schluessel werden *nicht* uebertragen!

// PS256: RSASSA-PSS: Kombination von RSA mit "Probabilistic Signature Scheme" (PSS)
// https://www.rfc-editor.org/rfc/rfc4056.txt
const algorithm = 'RS256';
const jwtDir = resolve(configDir, 'jwt');
const utf8 = 'utf8';
// PEM-Datei RS256, z.B. durch OpenSSL
const publicKey = readFileSync(resolve(jwtDir, 'public-key.pem'), utf8); // eslint-disable-line security/detect-non-literal-fs-filename
const privateKey = readFileSync(resolve(jwtDir, 'private-key.pem'), utf8); // eslint-disable-line security/detect-non-literal-fs-filename

// Typische Bestandteile der Payload bei JWT:
//  iat (= issued at)
//  sub(ject)
//  exp(ires in)
//  iss(uer)
// https://docs.microsoft.com/en-us/azure/active-directory/develop/id-tokens

// destructuring (default fuer expiresIn: 1h)
const { JWT_EXPIRES_IN, JWT_ISSUER } = env;

// shorthand property
const signOptions: SignOptions = {
    algorithm,
    expiresIn: JWT_EXPIRES_IN ?? '1h',
    issuer: JWT_ISSUER ?? 'https://hka.de/Gruppe7',
};

const verifyOptions: VerifyOptions = {
    algorithms: [algorithm],
    issuer: signOptions.issuer,
};

/**
 * Das Konfigurationsobjekt für JWT.
 */
// "as const" fuer readonly
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions
// https://github.com/tc39/proposal-record-tuple
export const jwtConfig = {
    // shorthand properties
    algorithm,
    publicKey,
    privateKey,
    signOptions,
    verifyOptions,
} as const;
