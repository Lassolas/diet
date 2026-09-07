import type {
	MealEntry,
	MealEntryInput,
	Photo,
	WeighIn,
	WeighInInput,
	Workout,
	WorkoutInput
} from '$lib/types';

async function unwrap<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(text || `${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<T>;
}

export const api = {
	async listEntries(range?: { from?: string; to?: string }): Promise<MealEntry[]> {
		const qs = new URLSearchParams();
		if (range?.from) qs.set('from', range.from);
		if (range?.to) qs.set('to', range.to);
		const res = await fetch(`/api/entries?${qs}`);
		return (await unwrap<{ entries: MealEntry[] }>(res)).entries;
	},

	async getEntry(id: string): Promise<MealEntry> {
		return (await unwrap<{ entry: MealEntry }>(await fetch(`/api/entries/${id}`))).entry;
	},

	async createEntry(input: MealEntryInput): Promise<MealEntry> {
		const res = await fetch('/api/entries', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(input)
		});
		return (await unwrap<{ entry: MealEntry }>(res)).entry;
	},

	async updateEntry(id: string, input: MealEntryInput): Promise<MealEntry> {
		const res = await fetch(`/api/entries/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(input)
		});
		return (await unwrap<{ entry: MealEntry }>(res)).entry;
	},

	async deleteEntry(id: string): Promise<void> {
		const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(await res.text());
	},

	async uploadPhoto(entryId: string, jpeg: Blob): Promise<Photo> {
		const res = await fetch(`/api/entries/${entryId}/photos`, {
			method: 'POST',
			headers: { 'content-type': 'image/jpeg' },
			body: jpeg
		});
		return (await unwrap<{ photo: Photo }>(res)).photo;
	},

	async deletePhoto(photoId: string): Promise<void> {
		const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(await res.text());
	},

	async frequentItems(mealType?: string): Promise<string[]> {
		const qs = mealType ? `?mealType=${mealType}` : '';
		return (await unwrap<{ items: string[] }>(await fetch(`/api/frequent-items${qs}`))).items;
	},

	async listWeighIns(range?: { from?: string; to?: string }): Promise<WeighIn[]> {
		const qs = new URLSearchParams();
		if (range?.from) qs.set('from', range.from);
		if (range?.to) qs.set('to', range.to);
		const res = await fetch(`/api/weigh-ins?${qs}`);
		return (await unwrap<{ weighIns: WeighIn[] }>(res)).weighIns;
	},

	async getWeighIn(id: string): Promise<WeighIn> {
		return (await unwrap<{ weighIn: WeighIn }>(await fetch(`/api/weigh-ins/${id}`))).weighIn;
	},

	async createWeighIn(input: WeighInInput): Promise<WeighIn> {
		const res = await fetch('/api/weigh-ins', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(input)
		});
		return (await unwrap<{ weighIn: WeighIn }>(res)).weighIn;
	},

	async updateWeighIn(id: string, input: WeighInInput): Promise<WeighIn> {
		const res = await fetch(`/api/weigh-ins/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(input)
		});
		return (await unwrap<{ weighIn: WeighIn }>(res)).weighIn;
	},

	async deleteWeighIn(id: string): Promise<void> {
		const res = await fetch(`/api/weigh-ins/${id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(await res.text());
	},

	async listWorkouts(range?: { from?: string; to?: string }): Promise<Workout[]> {
		const qs = new URLSearchParams();
		if (range?.from) qs.set('from', range.from);
		if (range?.to) qs.set('to', range.to);
		const res = await fetch(`/api/workouts?${qs}`);
		return (await unwrap<{ workouts: Workout[] }>(res)).workouts;
	},

	async getWorkout(id: string): Promise<Workout> {
		return (await unwrap<{ workout: Workout }>(await fetch(`/api/workouts/${id}`))).workout;
	},

	async createWorkout(input: WorkoutInput): Promise<Workout> {
		const res = await fetch('/api/workouts', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(input)
		});
		return (await unwrap<{ workout: Workout }>(res)).workout;
	},

	async updateWorkout(id: string, input: WorkoutInput): Promise<Workout> {
		const res = await fetch(`/api/workouts/${id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(input)
		});
		return (await unwrap<{ workout: Workout }>(res)).workout;
	},

	async deleteWorkout(id: string): Promise<void> {
		const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(await res.text());
	}
};
