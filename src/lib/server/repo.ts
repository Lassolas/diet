import { ulid } from 'ulid';
import type { D1Database } from '@cloudflare/workers-types';
import {
	MAX_PHOTOS_PER_ENTRY,
	type MealEntry,
	type MealEntryInput,
	type MealType,
	type Photo,
	type WeighIn,
	type WeighInCondition,
	type WeighInInput
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

interface PhotoMetaRow {
	id: string;
	meal_entry_id: string;
	content_type: string;
	position: number;
	created_at: string;
}

const toPhoto = (row: PhotoMetaRow): Photo => ({
	id: row.id,
	position: row.position,
	url: `/photos/${row.id}`
});

const toEntry = (row: EntryRow, photos: PhotoMetaRow[]): MealEntry => ({
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

// Never SELECT the `bytes` column when listing — it would pull every photo's
// blob into memory. Photo bytes are fetched one at a time by getPhotoBytes.
const PHOTO_META_COLS = 'id, meal_entry_id, content_type, position, created_at';

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
			`SELECT ${PHOTO_META_COLS} FROM photo
			 WHERE meal_entry_id IN (${ids.map(() => '?').join(',')}) ORDER BY position`
		)
		.bind(...ids)
		.all<PhotoMetaRow>();

	return rows.map((row) => toEntry(row, photos.results ?? []));
}

export async function getEntry(db: D1Database, id: string): Promise<MealEntry | null> {
	const row = await db.prepare('SELECT * FROM meal_entry WHERE id = ?').bind(id).first<EntryRow>();
	if (!row) return null;
	const photos = await db
		.prepare(`SELECT ${PHOTO_META_COLS} FROM photo WHERE meal_entry_id = ? ORDER BY position`)
		.bind(id)
		.all<PhotoMetaRow>();
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

/** Deletes an entry; photo rows go with it via ON DELETE CASCADE. */
export async function deleteEntry(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM meal_entry WHERE id = ?').bind(id).run();
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
	bytes: ArrayBuffer,
	contentType = 'image/jpeg'
): Promise<Photo> {
	const id = ulid();
	const posRow = await db
		.prepare('SELECT COALESCE(MAX(position), -1) AS p FROM photo WHERE meal_entry_id = ?')
		.bind(entryId)
		.first<{ p: number }>();
	const position = (posRow?.p ?? -1) + 1;
	await db
		.prepare(
			`INSERT INTO photo (id, meal_entry_id, bytes, content_type, position, created_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(id, entryId, bytes, contentType, position, new Date().toISOString())
		.run();
	return { id, position, url: `/photos/${id}` };
}

/** Deletes a photo row. Returns false if it did not exist. */
export async function deletePhoto(db: D1Database, photoId: string): Promise<boolean> {
	const res = await db.prepare('DELETE FROM photo WHERE id = ?').bind(photoId).run();
	return (res.meta.changes ?? 0) > 0;
}

export async function getPhotoBytes(
	db: D1Database,
	photoId: string
): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
	const row = await db
		.prepare('SELECT bytes, content_type FROM photo WHERE id = ?')
		.bind(photoId)
		.first<{ bytes: ArrayBuffer | number[]; content_type: string }>();
	if (!row) return null;
	const bytes = Array.isArray(row.bytes) ? new Uint8Array(row.bytes).buffer : row.bytes;
	return { bytes, contentType: row.content_type };
}

export { MAX_PHOTOS_PER_ENTRY };

// --- Weigh-ins ---------------------------------------------------------------

interface WeighInRow {
	id: string;
	measured_at: string;
	weight_kg: number;
	condition: WeighInCondition;
	created_at: string;
	updated_at: string;
}

const toWeighIn = (row: WeighInRow): WeighIn => ({
	id: row.id,
	measuredAt: row.measured_at,
	weightKg: row.weight_kg,
	condition: row.condition,
	createdAt: row.created_at,
	updatedAt: row.updated_at
});

export async function listWeighIns(
	db: D1Database,
	range: { from?: string; to?: string } = {}
): Promise<WeighIn[]> {
	const clauses: string[] = [];
	const binds: string[] = [];
	if (range.from) {
		clauses.push('measured_at >= ?');
		binds.push(range.from);
	}
	if (range.to) {
		clauses.push('measured_at <= ?');
		binds.push(`${range.to}T23:59`);
	}
	const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
	const rows = await db
		.prepare(`SELECT * FROM weigh_in ${where} ORDER BY measured_at DESC`)
		.bind(...binds)
		.all<WeighInRow>();
	return (rows.results ?? []).map(toWeighIn);
}

export async function getWeighIn(db: D1Database, id: string): Promise<WeighIn | null> {
	const row = await db.prepare('SELECT * FROM weigh_in WHERE id = ?').bind(id).first<WeighInRow>();
	return row ? toWeighIn(row) : null;
}

export async function createWeighIn(db: D1Database, input: WeighInInput): Promise<WeighIn> {
	const id = ulid();
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO weigh_in (id, measured_at, weight_kg, condition, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(id, input.measuredAt, input.weightKg, input.condition, now, now)
		.run();
	return (await getWeighIn(db, id))!;
}

export async function updateWeighIn(
	db: D1Database,
	id: string,
	patch: WeighInInput
): Promise<WeighIn | null> {
	const existing = await db.prepare('SELECT id FROM weigh_in WHERE id = ?').bind(id).first();
	if (!existing) return null;
	await db
		.prepare(
			`UPDATE weigh_in SET measured_at = ?, weight_kg = ?, condition = ?, updated_at = ? WHERE id = ?`
		)
		.bind(patch.measuredAt, patch.weightKg, patch.condition, new Date().toISOString(), id)
		.run();
	return getWeighIn(db, id);
}

export async function deleteWeighIn(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM weigh_in WHERE id = ?').bind(id).run();
}

// --- Frequent Items --------------------------------------------------------

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
