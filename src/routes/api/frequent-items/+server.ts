import { json, error, type RequestHandler } from '@sveltejs/kit';
import { env } from '$lib/server/platform';
import { recentForFrequentItems } from '$lib/server/repo';
import { rankFrequentItems } from '$lib/domain/frequentItems';
import { MEAL_TYPES, type MealType } from '$lib/types';

const LOOKBACK_DAYS = 120;

export const GET: RequestHandler = async (event) => {
	const mealTypeParam = event.url.searchParams.get('mealType') ?? undefined;
	if (mealTypeParam && !MEAL_TYPES.includes(mealTypeParam as MealType)) {
		throw error(400, 'unknown mealType');
	}

	const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000).toISOString().slice(0, 16);
	const rows = await recentForFrequentItems(env(event).DB, since);
	const items = rankFrequentItems(rows, { mealType: mealTypeParam as MealType | undefined });
	return json({ items });
};
