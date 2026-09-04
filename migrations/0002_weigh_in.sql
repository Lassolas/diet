-- Weigh-ins: a separate time series from the food diary. Multiple per day
-- allowed; backfillable like meal entries.

CREATE TABLE weigh_in (
	id          TEXT PRIMARY KEY,          -- ULID
	measured_at TEXT NOT NULL,             -- 'YYYY-MM-DDTHH:MM', Europe/Paris wall-clock (ADR 0002)
	weight_kg   REAL NOT NULL,
	condition   TEXT NOT NULL CHECK (condition IN ('fasted', 'clothed')),
	created_at  TEXT NOT NULL,
	updated_at  TEXT NOT NULL
);

CREATE INDEX idx_weigh_in_measured_at ON weigh_in (measured_at);
