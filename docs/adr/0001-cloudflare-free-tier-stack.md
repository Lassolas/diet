# Host the entire stack on the Cloudflare free tier

The app must cost nothing to run and must not expose a payment card to
overage billing. Cloudflare's free tiers (Pages for the static frontend,
Workers for the API, D1 for the database, R2 for photo storage) throttle
rather than bill when exceeded and need no card for Pages/Workers/D1. We
chose it over Google Cloud / Firebase, whose "Always Free" tier still
mandates a card and bills overages with no enforced cap, and over a cheap
VM, which is not free.

## Consequences

- The data layer is bound to Cloudflare primitives (D1's SQLite dialect,
  the Workers runtime). Migrating off is a rewrite of the persistence code.
- Photos must be resized client-side before upload to stay small.
- The owner is learning Cloudflare during the project; expect some ramp-up.

## Update

R2 turned out to require a payment card even for its free allowance, which
breaks the "no card" premise. Photos are stored in D1 instead — see ADR 0004.
The rest of this decision stands.
