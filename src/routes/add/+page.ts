import type { PageLoad } from './$types';
import type { MealType } from '$lib/types';

export const load: PageLoad = ({ url }) => {
	// `?type=collation` pre-selects the Snack meal type; anything else lets the
	// form pick from the time of day.
	const initialMealType: MealType | null =
		url.searchParams.get('type') === 'collation' ? 'snack' : null;
	return { initialMealType };
};
