import { error, type Handle } from '@sveltejs/kit';
import { verifyAccess } from '$lib/server/auth';

// Gate every request behind Cloudflare Access (no-op locally when unconfigured).
export const handle: Handle = async ({ event, resolve }) => {
	const result = await verifyAccess(event.request);
	if (!result.ok) {
		throw error(403, 'Not authorised.');
	}
	return resolve(event);
};
