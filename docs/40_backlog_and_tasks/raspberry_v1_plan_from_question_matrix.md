# Raspberry v1 plan from question matrix

Status: active plan  
Introduced: v0.8.67  
Source: clarified matrix answers plus v0.8.66 Raspberry target-pack evidence

## Current proof state

The v0.8.66 Raspberry target-pack evidence showed:

- Raspberry tool checker: PASSED
- Generated fixtures: PASSED
- Executable/env preflights: PASSED
- Worker startup smoke: PASSED
- Cron preflight: PASSED
- App-running PASS harness: PASSED
- Native image playback: PASSED
- Native video playback: PASSED
- v1 readiness: BLOCKED, 3/11 required gates passed

The first current blocker is proof ordering in the expanded target pack: complete duplicate/stale-lock evidence is produced by `proof:raspberry-app-running-pass`, but earlier worker-evidence checks ran before that harness had produced complete evidence.

## Planned slices

| Version | Slice | Goal | Acceptance proof |
|---|---|---|---|
| v0.8.68 | Target-pack ordering repair | Implemented: run app-running PASS harness evidence before worker-evidence-dependent v1 readiness checks. | `proof:raspberry-app-running-target-pack` should no longer block on early incomplete worker evidence when app-running harness later passes. |
| v0.8.69 | iCloudPD preflight/discovery | Determine whether real iCloudPD is installed/configured/ready on Raspberry without leaking secrets. | iCloudPD preflight proof PASSED or honest BLOCKED with exact missing setup. |
| v0.8.70 | iCloud-first regular worker OpenSpec | Define iCloud-first regular worker product stages and safety boundaries. | OpenSpec/tests define source/download/import/index/GPS/geocode/queue evidence. |
| v0.8.71 | iCloud media source proof scaffold | Add proof command for real iCloud media source using manual/operator 2FA. | Proof blocks unless real iCloudPD evidence exists; no 2FA automation claim. |
| v0.8.72 | GPS/geocode provider preflight | Add Nominatim/OpenStreetMap provider preflight and missing-GPS `unknown` policy. | Provider preflight and policy tests pass; real provider proof remains gated. |
| v0.8.73 | Regular worker product pipeline staged writes | Add staged/flagged DB/queue product writes if R2 remains unresolved. | Product evidence shows staged writes and no uncontrolled production mutation. |
| v0.8.74 | Address overlay proof implementation plan | Resolve/implement display evidence flow for native/device overlay. | Address overlay proof gate has real evidence path and stays BLOCKED until observed. |
| v0.8.75 | Dashboard status view plan/implementation | Add status-only dashboard view unless D2 changes. | Dashboard shows worker health/current playback/v1 gates from proof-backed state. |
| v0.8.76 | Screen worker non-blocking proof | Prove screen worker exits safely and does not block other lanes. | Dedicated screen-worker non-blocking v1 gate PASSED. |
| v0.8.77 | Critical docs reconciliation | Fix stale contradictions that affect v1 gates. | Docs reconciliation proof PASSED for critical docs. |

## Open questions still needing user answers

- I2: real iCloud first vs local real-media prep vs both.
- R2/R3: exact write strategy and minimum regular-worker PASS.
- A1/A2/A3: overlay location, text granularity, and evidence style.
- D1/D2: dashboard status contents and whether dashboard can control anything.
- S1/S2: screen worker physical control and PASS criteria.
- DOC1/DOC2: docs cleanup timing and strictness.

Until answered, use the working defaults from `raspberry_v1_question_matrix_decisions_openspec.md` and label them as defaults.
