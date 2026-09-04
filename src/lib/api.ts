import type { MealEntry, MealEntryInput, Photo } from '$lib/types';

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
	}
};
