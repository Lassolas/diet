import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => ({
	collation: url.searchParams.get('type') === 'collation'
});
