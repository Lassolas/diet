import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => ({
	// `?voice=1` auto-starts dictation into the description field (home shortcut).
	autostartVoice: url.searchParams.get('voice') === '1'
});
