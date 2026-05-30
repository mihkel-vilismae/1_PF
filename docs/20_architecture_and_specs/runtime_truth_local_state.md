# Runtime Truth Local State Contract

Estonian timestamp: 30.05.2026, 21:43 EEST

## Purpose

`conf/runtime-truth.json` is local mutable runtime state. The dashboard/backend can write it during normal use, so runtime edits must not become future baseline noise.

## Source files

| Path | Git state | Purpose |
| --- | --- | --- |
| `conf/runtime-truth.seed.json` | Tracked | Neutral startup seed used by the dashboard build and tests. |
| `conf/runtime-truth.json` | Ignored | Local persisted runtime-truth file written/read by `/api/runtime-truth`. |

## Rules

- Keep `conf/runtime-truth.seed.json` committed and reviewable.
- Keep `conf/runtime-truth.json` ignored because it changes at runtime.
- Do not commit machine-local queue counts, lock status, auth attempts, timestamps, or runtime projections.
- If the runtime file is missing, the dashboard can boot from the seed and persist a fresh runtime file through the existing runtime-truth persistence endpoint.
- If the seed needs to change, change it deliberately in a normal reviewed commit.

## Regression boundary

This contract preserves the existing runtime-truth API path and UI wording: `sourceOfTruth` remains `conf/runtime-truth.json`. The only intended repository hygiene change is that local runtime changes no longer appear as Git baseline changes.
