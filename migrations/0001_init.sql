-- Diet: initial schema. See ARCHITECTURE.md for the data model.

CREATE TABLE meal_entry (
	id          TEXT PRIMARY KEY,          -- ULID, time-sortable
	eaten_at    TEXT NOT NULL,             -- 'YYYY-MM-DDTHH:MM', Europe/Paris wall-clock (ADR 0002)
	meal_type   TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
	description TEXT,                       -- nullable; a row must have this or >= 1 photo
	note        TEXT,
	created_at  TEXT NOT NULL,
	updated_at  TEXT NOT NULL
);

CREATE INDEX idx_meal_entry_eaten_at ON meal_entry (eaten_at);

CREATE TABLE photo (
	id            TEXT PRIMARY KEY,         -- ULID
	meal_entry_id TEXT NOT NULL REFERENCES meal_entry (id) ON DELETE CASCADE,
	r2_key        TEXT NOT NULL,
	position      INTEGER NOT NULL DEFAULT 0,
	created_at    TEXT NOT NULL
);

CREATE INDEX idx_photo_meal_entry_id ON photo (meal_entry_id);
