import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => ({
	autostartVoice: url.searchParams.get('voice') === '1'
});
