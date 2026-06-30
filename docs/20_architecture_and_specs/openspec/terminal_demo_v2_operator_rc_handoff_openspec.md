# Terminal Demo v2.0 Operator RC Handoff OpenSpec

Generated: 2026-06-30  
Status: implementation-ready handoff for v2.0.0 from baseline `1.9.0`.

## Purpose

Define the v2.0.0 Terminal Demo Mode operator release-candidate path after the v1.5.0 through v1.9.0 real-demo slices. This is an OpenSpec handoff, not a runtime proof by itself.

## Verified implementation floor

| Version | Implemented floor | Proof to refresh for v2.0 |
| --- | --- | --- |
| `1.5.0` | Q creates q-created DEMO DB queue rows. | `npm run proof:terminal-demo-q-db-queue-creation` |
| `1.6.0` | Q metadata/address stages run before queue. | `npm run proof:terminal-demo-metadata-address-queue` |
| `1.7.0` | Batch 1/5 truth/status parity path exists. | `npm run proof:terminal-demo-batch-parity` |
| `1.8.0` | Screen-worker demo panel exists and is guarded. | `npm run proof:terminal-demo-screen-worker-panel` |
| `1.9.0` | Operator Area A/B/C routing exists. | `npm run proof:terminal-demo-operator-layout-status` |

## Goal

v2.0.0 must produce a single operator-ready Real Demo Mode RC path:

```text
REAL_DEMO_MODE_V2_RC_READY
```

The operator path must prove DEMO-owned DB/media/truth/status/queue/playback with real worker structure, no cron, no mock claims, guarded screen-worker behavior, and a reproducible evidence pack.

## Required v2.0 behavior

| Area | v2.0 requirement | Evidence required |
| --- | --- | --- |
| Launch | Real-demo launcher is explicit and does not fall into mock-demo. | Real entrypoint proof and operator rehearsal evidence. |
| Demo DB/media | DEMO DB and copied DEMO media are prepared or verified before Q/P. | DB path, media path, and table proof. |
| Q DB path | Q creates/updates real-shape DB rows, not JSON queue rows. | q-created DB proof. |
| Metadata/address | GPS parse and geocode/address stages are invoked truthfully. | Metadata/address proof with DB `address_text` and degraded/BLOCKED failure cases. |
| Batch parity | Batch 1 and 5 share the same DEMO-scoped real-demo path. | Batch parity proof. |
| Playback | P renders the selected DB queue row and overlay equals DB `address_text` when present. | P playback proof and viewer HTML evidence. |
| Screen panel | Idle timer and status panel render; screen power action remains guarded. | Screen-worker panel proof. |
| Layout | Area A logs, Area B command plan, Area C playback/preview stay separated. | Operator layout/status proof. |
| Evidence | Evidence ZIP contains logs/status/proof outputs only. | Operator/RC evidence diagnosis. |

## Required proof pack

The v2.0 implementation should make the following proof chain pass from a fresh extracted package root:

```bash
npm install
npm run build
npm run typecheck
npm run proof:terminal-demo-q-db-queue-creation
npm run proof:terminal-demo-metadata-address-queue
npm run proof:terminal-demo-batch-parity
npm run proof:terminal-demo-screen-worker-panel
npm run proof:terminal-demo-operator-layout-status
npm run proof:terminal-demo-final
npm run proof:terminal-demo-operator-rehearsal
npm run proof:terminal-demo-rc-readiness
git fsck --no-dangling
```

The package check must also prove that the final ZIP excludes `node_modules`, `dist`, `runtime_data`, and terminal runtime logs.

## Freshness requirement

v2.0 must not make a final RC claim from stale evidence. Each selected proof should be rerun after the v2.0 commit. A previous PASS can guide implementation, but the final v2.0 summary must mark any not-rerun proof as `NOT_RUN` or `PASSED_PREVIOUS_BASELINE`, not current PASS.

## Provider/geocode boundary

- GPS success requires valid latitude and longitude from an allowed provider path.
- Missing/invalid GPS is a truthful degraded/no-result state.
- Reverse geocode success requires configured provider/cache evidence.
- Provider/network/key failure is BLOCKED/degraded, not fake success.
- No API keys, cookies, access tokens, or provider secrets may be committed.

## Screen-worker boundary

- The demo panel may show idle timer, latest input, intended power state, and guarded status.
- It must not run a real screen off/on command unless the platform and safety flags explicitly permit it.
- v2.0 RC can be PASS with guarded screen commands if the proof confirms the guard and status behavior.

## Evidence ZIP boundary

Evidence ZIPs must include only logs/status/proof artifacts. They must not include the source repository, `.git`, generated package ZIPs, `node_modules`, or runtime media payloads unless a future explicit artifact request changes that rule.

## Non-claims

- No cron or crontab installation.
- No DB schema redesign.
- No migration of real/test paths into terminal Demo Mode.
- No mock success claim for real-demo behavior.
- No unguarded real screen power command.
- No production Raspberry v1/v2 claim unless Raspberry target evidence is supplied.

## v2.0 implementation prompt

```text
RUN ACR: implement v2.0.0 Real Demo Mode operator RC.

Start from active PF_login v1.9.0 baseline.
Do not add cron, DB schema redesign, unguarded real screen power commands, or mock success claims.
Consolidate the full real-demo operator path: DEMO-owned DB/media/truth/status/queue/playback, Q DB creation, metadata/address stages, batch 1/5 parity, P playback overlay, screen-worker panel, Area A/B/C routing, and operator evidence pack.
Refresh all v1.5-v1.9 proof surfaces on the v2.0 baseline.
Make proof:terminal-demo-final and proof:terminal-demo-rc-readiness include the full v2.0 proof chain or clearly report NOT_RUN/BLOCKED with next action.
Generate a full Git ZIP.
Expected decision: REAL_DEMO_MODE_V2_RC_READY.
```
