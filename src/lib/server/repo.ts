import { ulid } from 'ulid';
import type { D1Database } from '@cloudflare/workers-types';
import {
	MAX_PHOTOS_PER_ENTRY,
	type MealEntry,
	type MealEntryInput,
	type MealType,
	type Photo
} from '$lib/types';
import type { FrequentItemSource } from '$lib/domain/frequentItems';

interface EntryRow {
	id: string;
	eaten_at: string;
	meal_type: MealType;
	description: string | null;
	note: string | null;
	created_at: string;
	updated_at: string;
}

interface PhotoRow {
	id: string;
	meal_entry_id: string;
	r2_key: string;
	position: number;
	created_at: string;
}

/** R2 object key for a photo. Also its path under the `/photos/` route. */
export const photoKey = (entryId: string, photoId: string) => `${entryId}/${photoId}.jpg`;

const toPhoto = (row: PhotoRow): Photo => ({
	id: row.id,
	position: row.position,
	url: `/photos/${row.r2_key}`
});

const toEntry = (row: EntryRow, photos: PhotoRow[]): MealEntry => ({
	id: row.id,
	eatenAt: row.eaten_at,
	mealType: row.meal_type,
	description: row.description,
	note: row.note,
	photos: photos
		.filter((p) => p.meal_entry_id === row.id)
		.sort((a, b) => a.position - b.position)
		.map(toPhoto),
	createdAt: row.created_at,
	updatedAt: row.updated_at
});

export async function listEntries(
	db: D1Database,
	range: { from?: string; to?: string } = {}
): Promise<MealEntry[]> {
	const clauses: string[] = [];
	const binds: string[] = [];
	if (range.from) {
		clauses.push('eaten_at >= ?');
		binds.push(range.from);
	}
	if (range.to) {
		// `to` is a date; include the whole day.
		clauses.push('eaten_at <= ?');
		binds.push(`${range.to}T23:59`);
	}
	const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

	const entries = await db
		.prepare(`SELECT * FROM meal_entry ${where} ORDER BY eaten_at DESC`)
		.bind(...binds)
		.all<EntryRow>();
	const rows = entries.results ?? [];
	if (rows.length === 0) return [];

	const ids = rows.map((r) => r.id);
	const photos = await db
		.prepare(
			`SELECT * FROM photo WHERE meal_entry_id IN (${ids.map(() => '?').join(',')}) ORDER BY position`
		)
		.bind(...ids)
		.all<PhotoRow>();

	return rows.map((row) => toEntry(row, photos.results ?? []));
}

export async function getEntry(db: D1Database, id: string): Promise<MealEntry | null> {
	const row = await db.prepare('SELECT * FROM meal_entry WHERE id = ?').bind(id).first<EntryRow>();
	if (!row) return null;
	const photos = await db
		.prepare('SELECT * FROM photo WHERE meal_entry_id = ? ORDER BY position')
		.bind(id)
		.all<PhotoRow>();
	return toEntry(row, photos.results ?? []);
}

export async function createEntry(db: D1Database, input: MealEntryInput): Promise<MealEntry> {
	const id = ulid();
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO meal_entry (id, eaten_at, meal_type, description, note, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			input.eatenAt,
			input.mealType,
			input.description?.trim() || null,
			input.note?.trim() || null,
			now,
			now
		)
		.run();
	return (await getEntry(db, id))!;
}

export async function updateEntry(
	db: D1Database,
	id: string,
	patch: MealEntryInput
): Promise<MealEntry | null> {
	const existing = await db.prepare('SELECT id FROM meal_entry WHERE id = ?').bind(id).first();
	if (!existing) return null;
	await db
		.prepare(
			`UPDATE meal_entry
			 SET eaten_at = ?, meal_type = ?, description = ?, note = ?, updated_at = ?
			 WHERE id = ?`
		)
		.bind(
			patch.eatenAt,
			patch.mealType,
			patch.description?.trim() || null,
			patch.note?.trim() || null,
			new Date().toISOString(),
			id
		)
		.run();
	return getEntry(db, id);
}

/** Deletes an entry and returns the R2 keys of its photos, for the caller to clean up. */
export async function deleteEntry(db: D1Database, id: string): Promise<string[]> {
	const photos = await db
		.prepare('SELECT r2_key FROM photo WHERE meal_entry_id = ?')
		.bind(id)
		.all<{ r2_key: string }>();
	await db.prepare('DELETE FROM meal_entry WHERE id = ?').bind(id).run();
	return (photos.results ?? []).map((p) => p.r2_key);
}

export async function countPhotos(db: D1Database, entryId: string): Promise<number> {
	const row = await db
		.prepare('SELECT COUNT(*) AS n FROM photo WHERE meal_entry_id = ?')
		.bind(entryId)
		.first<{ n: number }>();
	return row?.n ?? 0;
}

export async function addPhoto(
	db: D1Database,
	entryId: string,
	id: string,
	r2Key: string
): Promise<Photo> {
	const posRow = await db
		.prepare('SELECT COALESCE(MAX(position), -1) AS p FROM photo WHERE meal_entry_id = ?')
		.bind(entryId)
		.first<{ p: number }>();
	const position = (posRow?.p ?? -1) + 1;
	await db
		.prepare(
			`INSERT INTO photo (id, meal_entry_id, r2_key, position, created_at) VALUES (?, ?, ?, ?, ?)`
		)
		.bind(id, entryId, r2Key, position, new Date().toISOString())
		.run();
	return { id, position, url: `/photos/${r2Key}` };
}

/** Deletes a photo row and returns its R2 key, or null if it did not exist. */
export async function deletePhoto(db: D1Database, photoId: string): Promise<string | null> {
	const row = await db
		.prepare('SELECT r2_key FROM photo WHERE id = ?')
		.bind(photoId)
		.first<{ r2_key: string }>();
	if (!row) return null;
	await db.prepare('DELETE FROM photo WHERE id = ?').bind(photoId).run();
	return row.r2_key;
}

export { MAX_PHOTOS_PER_ENTRY };

/** Recent entries (description + time + type only) for Frequent Item ranking. */
export async function recentForFrequentItems(
	db: D1Database,
	sinceIso: string
): Promise<FrequentItemSource[]> {
	const rows = await db
		.prepare(
			`SELECT description, eaten_at, meal_type FROM meal_entry
			 WHERE description IS NOT NULL AND eaten_at >= ?`
		)
		.bind(sinceIso)
		.all<{ description: string; eaten_at: string; meal_type: MealType }>();
	return (rows.results ?? []).map((r) => ({
		description: r.description,
		eatenAt: r.eaten_at,
		mealType: r.meal_type
	}));
}
