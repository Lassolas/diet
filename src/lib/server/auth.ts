import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * Cloudflare Access verification.
 *
 * Access sits in front of the deployment (configured in the Cloudflare
 * dashboard, not here) and adds a signed JWT on every request as the
 * `Cf-Access-Jwt-Assertion` header. We verify that JWT so a request that
 * somehow reaches the app without going through Access is still rejected.
 *
 * Required environment variables in production:
 *   CF_ACCESS_TEAM_DOMAIN  e.g. "myteam.cloudflareaccess.com"
 *   CF_ACCESS_AUD          the Access application's Audience (AUD) tag
 *   ALLOWED_EMAIL          the single email allowed to use the app
 *
 * When these are unset (local dev) verification is skipped.
 */

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(teamDomain: string) {
	if (!jwks) {
		jwks = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
	}
	return jwks;
}

export interface AuthResult {
	ok: boolean;
	email?: string;
	reason?: string;
}

export async function verifyAccess(request: Request): Promise<AuthResult> {
	const teamDomain = privateEnv.CF_ACCESS_TEAM_DOMAIN;
	const aud = privateEnv.CF_ACCESS_AUD;
	const allowedEmail = privateEnv.ALLOWED_EMAIL;

	if (!teamDomain || !aud || !allowedEmail) {
		// Local dev / not yet configured — allow through.
		return { ok: true, reason: 'access-not-configured' };
	}

	const token =
		request.headers.get('Cf-Access-Jwt-Assertion') ??
		request.headers.get('cf-access-jwt-assertion');
	if (!token) return { ok: false, reason: 'no Access token' };

	try {
		const { payload } = await jwtVerify(token, getJwks(teamDomain), {
			issuer: `https://${teamDomain}`,
			audience: aud
		});
		const email = typeof payload.email === 'string' ? payload.email : undefined;
		if (!email || email.toLowerCase() !== allowedEmail.toLowerCase()) {
			return { ok: false, email, reason: 'email not allowed' };
		}
		return { ok: true, email };
	} catch (e) {
		return { ok: false, reason: `invalid Access token: ${(e as Error).message}` };
	}
}
