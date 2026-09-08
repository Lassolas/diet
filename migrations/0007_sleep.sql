-- Sleep ("Dodo"): a fourth time series, parallel to meal entries, weigh-ins and
-- workouts. One night's sleep — a bed time, a wake time, a 0-100 quality rating
-- and an optional note. Assigned to the wake date. Multiple per day allowed
-- (not enforced); no nap concept.

CREATE TABLE sleep (
	id         TEXT PRIMARY KEY,           -- ULID
	bed_at     TEXT NOT NULL,              -- 'YYYY-MM-DDTHH:MM', Europe/Paris wall-clock (ADR 0002)
	wake_at    TEXT NOT NULL,              -- 'YYYY-MM-DDTHH:MM', Europe/Paris wall-clock
	quality    INTEGER NOT NULL CHECK (quality BETWEEN 0 AND 100),
	note       TEXT,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

-- wake_at is the day-assignment key: a sleep belongs to the day it ended.
CREATE INDEX idx_sleep_wake_at ON sleep (wake_at);
