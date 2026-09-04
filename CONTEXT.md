# Diet

A personal food diary. The user records the meals they eat so a dietician can
review them offline. The app is an interface facilitator: its job is to make
logging a meal almost frictionless and to produce a clean record to hand to the
dietician. It does no nutritional analysis of its own.

## Language

**Food Diary**:
The complete, chronological record of the user's Meal Entries. There is exactly
one, belonging to the single user.
_Avoid_: log, journal, history

**Meal Entry**:
A single recorded eating occasion — when it happened, a free-text description of
what was eaten, its Meal Type, and optional photos and a note.
_Avoid_: meal, record, log entry, item

**Meal Type**:
The kind of eating occasion: one of exactly four — breakfast, lunch, dinner, or
snack. Small extras (a protein shaker, a cereal bar before training, yogurt
before bed) are Snacks; their nature lives in the Description and their timing in
the entry's time.
_Avoid_: category, tag, label

**Note**:
An optional free-text remark on a Meal Entry carrying context the Dietician
cares about ("ate out", "very hungry after gym", "felt bloated after").
Distinct from the Description, which is only what was eaten.
_Avoid_: comment, remark, annotation

**Description**:
The free-text, sentence-style account of what was eaten ("2 eggs, toast, black
coffee"). Never structured into ingredients or quantities.
_Avoid_: contents, food list, ingredients

**Frequent Item**:
A Description the user logs often (e.g. "protein shaker"), surfaced on the add
screen as a one-tap chip that fills the Description field. Derived from past
Meal Entries by a frequency-and-recency ranking; not stored or managed by the
user.
_Avoid_: favourite, preset, template, shortcut

**Dietician**:
The external professional who reviews the Food Diary offline. Not a user of the
app and has no login; receives the diary only as a printed Report.
_Avoid_: nutritionist, doctor, coach, reviewer

**Report**:
A print-optimised view of the Food Diary over a chosen date range, grouped by
day. The user prints it to PDF from the browser and hands that to the Dietician.
_Avoid_: export, printout, summary
