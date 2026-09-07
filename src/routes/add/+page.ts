import type { PageLoad } from './$types';
import type { MealType } from '$lib/types';

export const load: PageLoad = ({ url }) => {
	// `?type=collation` pre-selects the Snack meal type; anything else lets the
	// form pick from the time of day. `?voice=1` auto-starts dictation into the
	// description field (the home voice shortcuts).
	const initialMealType: MealType | null =
		url.searchParams.get('type') === 'collation' ? 'snack' : null;
	return { initialMealType, autostartVoice: url.searchParams.get('voice') === '1' };
};
