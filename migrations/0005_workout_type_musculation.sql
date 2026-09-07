-- Add 'musculation' to the workout_type set. SQLite can't alter a CHECK
-- constraint in place, so the table is rebuilt. No foreign keys reference
-- workout, so a plain copy is safe.

CREATE TABLE workout_new (
	id           TEXT PRIMARY KEY,
	started_at   TEXT NOT NULL,
	duration_min INTEGER NOT NULL,
	workout_type TEXT NOT NULL CHECK (workout_type IN (
		'running', 'bag', 'hiit', 'tabata', 'swimming', 'sparring',
		'boxing_class', 'coaching', 'musculation'
	)),
	description  TEXT NOT NULL,
	feeling      TEXT,
	intensity    INTEGER NOT NULL CHECK (intensity BETWEEN 1 AND 10),
	created_at   TEXT NOT NULL,
	updated_at   TEXT NOT NULL
);

INSERT INTO workout_new
	SELECT id, started_at, duration_min, workout_type, description, feeling, intensity, created_at, updated_at
	FROM workout;

DROP TABLE workout;
ALTER TABLE workout_new RENAME TO workout;
CREATE INDEX idx_workout_started_at ON workout (started_at);
