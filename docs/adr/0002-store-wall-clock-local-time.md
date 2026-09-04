# Store meal times as Paris wall-clock strings, not UTC

A Meal Entry's `eaten_at` is stored as a plain `YYYY-MM-DDTHH:MM` string in
Europe/Paris local time, with no timezone offset and no UTC conversion. The
only fact that matters for a food diary is the time of day the user ate;
wall-clock time captures that directly and unambiguously. The user does not
travel across timezones, so the usual reason to store UTC does not apply.

## Consequences

- Do not "fix" this to UTC. Doing so needs a data migration and buys
  nothing.
- Sorting by `eaten_at` string is correct because the format is
  lexicographically ordered.
- If the user ever logs meals from another timezone, times will read as
  Paris time; revisit only then.
