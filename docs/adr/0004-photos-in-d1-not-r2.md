# Store photos as BLOBs in D1, not in R2

Enabling Cloudflare R2 requires a payment card on the account, even to use
only the free allowance — which defeats the "no card exposure" reason for
choosing Cloudflare in the first place (ADR 0001). So meal photos are stored
inline in D1 as `BLOB` values instead.

The client resizes every photo to a ~150–250 KB JPEG before upload, well
under D1's 2 MB per-value ceiling. At roughly 15 photos a day for one user
that is a few MB a month against D1's 5 GB free storage — years of runway.

## Consequences

- Never `SELECT` the `bytes` column in list queries; fetch photo bytes one
  row at a time (`getPhotoBytes`).
- `/photos/:id` is served by a Worker reading the row, not by object storage.
  Fine at single-user scale; would not be at higher traffic.
- If photo volume ever outgrows D1, moving to R2 (or another store) means
  migrating the `bytes` column out — contained to `repo.ts` and the photo
  routes.
