-- Workouts: a third time series parallel to meal entries and weigh-ins.
-- Boxing-training context. Multiple per day allowed; backfillable.

CREATE TABLE workout (
	id           TEXT PRIMARY KEY,          -- ULID
	started_at   TEXT NOT NULL,             -- 'YYYY-MM-DDTHH:MM', Europe/Paris wall-clock (ADR 0002)
	duration_min INTEGER NOT NULL,          -- minutes, entered in 15-min steps
	workout_type TEXT NOT NULL CHECK (workout_type IN (
		'running', 'bag', 'hiit', 'tabata', 'swimming', 'sparring', 'boxing_class', 'coaching'
	)),
	description  TEXT NOT NULL,             -- what the session was
	feeling      TEXT,                      -- nullable; how it felt (pain, tired, good…)
	intensity    INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 10),
	created_at   TEXT NOT NULL,
	updated_at   TEXT NOT NULL
);

CREATE INDEX idx_workout_started_at ON workout (started_at);
