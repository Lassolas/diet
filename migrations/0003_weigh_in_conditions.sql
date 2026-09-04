-- Replace the single `condition` enum with two independent flags:
-- a weigh-in can be fasted and/or clothed in any combination.

ALTER TABLE weigh_in ADD COLUMN fasted INTEGER NOT NULL DEFAULT 1;
ALTER TABLE weigh_in ADD COLUMN clothed INTEGER NOT NULL DEFAULT 0;

UPDATE weigh_in SET
	fasted  = CASE WHEN condition = 'fasted'  THEN 1 ELSE 0 END,
	clothed = CASE WHEN condition = 'clothed' THEN 1 ELSE 0 END;

ALTER TABLE weigh_in DROP COLUMN condition;
