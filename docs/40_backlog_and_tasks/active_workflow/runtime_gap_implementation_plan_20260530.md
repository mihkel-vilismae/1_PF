# Runtime Gap Implementation Plan — 2026-05-30

## Purpose

This plan turns the documentation-audit findings into implementation-ready slices for the remaining PF_login runtime gaps. It is planning material, not proof that the features are implemented.

Use this document after checking current code/tests, the active immutable ZIP baseline, and the documentation authority notes in `docs/table_of_contents.md` and `docs/DOC_FRESHNESS_MATRIX.md`.

## Preservation constraints

| Constraint | Required handling |
|---|---|
| Active baseline | Start from the newest active PF_login ZIP and record `VERSION`, `package.json`, Git HEAD, and dirty state before edits. |
| Queue terminology | Use `Queue`; do not rename to Q or slideshow-only language. |
| Provider separation | Keep Download, GPS parsing, and Geocode provider boundaries. |
| Real/Test separation | Keep Test Mode deterministic and prevent real/test path overlap before destructive actions. |
| Secret safety | Do not log provider secrets, Apple credentials, cookies, 2FA codes, or full environment dumps. |
| UI stability | Preserve focus, scroll, inspect controls, and real/mock visibility behavior when touching dashboard views. |
| Git workflow | One logical commit per slice and one final full-Git ZIP after a requested batch. |

## Current gap summary

| Gap | Current repo signal | Missing proof or implementation | First safe action |
|---|---|---|---|
| Real iCloudPD pipeline proof | NEW AUTH and real download routes exist; deterministic/mock pipeline also exists. | PC evidence for real download flowing through Index, GPS, Geocode, Queue, and Playback Select. | Add/run a runtime evidence checklist before changing provider code. |
| Real reverse geocoding | Cache-first provider registry exists; network providers are disabled by default. | Safe activation and runtime proof for one provider, including cache-hit behavior and placeholder fallback. | Use the geocode activation runbook and capture evidence. |
| GPS fallback proof | EXIF, JSON/XMP/text sidecar, filename, and path providers exist. | Fixture/runtime proof across operator examples and real media library samples. | Add an evidence fixture matrix and run Stage 3 verification. |
| Raspberry recovery | Scheduler target model exists and Raspberry crontab behavior is documented. | Proof that boot after power loss restarts download/playback workers and preserves Queue/playback state. | Define a Raspberry recovery proof slice before modifying scheduler behavior. |
| View C restore | View C reads `/api/runtime/orchestration/last`. | Controlled restore contract, safeguards, idempotency, and UI action wiring. | Write/approve restore contract before implementation. |
| View D monitor | View D layout and simulated preview exist. | Backend-owned runtime projection, worker health polling, start/stop alignment. | Define projection schema and implement read-only monitor first. |

## Proposed implementation slices

| Slice | Type | Goal | Main files likely affected | Verification |
|---:|---|---|---|---|
| 1 | Evidence/runbook | Add a PC runtime evidence matrix for real iCloudPD Download → Index → GPS → Geocode → Queue → Playback Select. | `docs/10_runbooks/`, `docs/00_current_truth/` | `npm run task-docs:check`; manual PC evidence rows filled after run. |
| 2 | Evidence/tests | Add GPS fallback fixture proof for EXIF, JSON, XMP, text, filename, and path coordinate sources. | `generated_test_data/`, `tests/`, `docs/10_runbooks/gps_metadata_sources.md` | Targeted provider test and Stage 3 queue test. |
| 3 | Evidence/config | Add a one-provider geocode activation proof harness that keeps network providers disabled unless explicitly enabled. | `tests/`, `server/scripts/media_pipeline/`, `docs/10_runbooks/geocode_provider_activation.md` | Targeted geocode config/provider tests; no secrets printed. |
| 4 | Contract | Define View C controlled restore contract without wiring the UI button yet. | `docs/20_architecture_and_specs/`, `shared/`, possibly `server/routes/` contract tests | Typecheck plus contract tests; restore still disabled if backend behavior is not implemented. |
| 5 | Implementation | Implement backend View C restore endpoint with confirmation/idempotency guards. | `server/`, `shared/`, `tests/` | Endpoint tests for allowed, blocked, idempotent, and failure cases. |
| 6 | Frontend | Wire View C resume action to backend restore result while preserving read-only state rendering. | `dashboard/`, `tests/` | UI/service tests; focus/scroll regression checks. |
| 7 | Contract | Define View D runtime projection schema and read-only backend endpoint. | `shared/`, `server/`, `docs/20_architecture_and_specs/` | Typecheck and endpoint projection tests. |
| 8 | Frontend | Replace View D simulated preview as canonical path with read-only backend polling/refresh. | `dashboard/`, `tests/` | UI tests for stale, healthy, failed, and empty monitor states. |
| 9 | Runtime | Add concrete worker health/start/stop control paths after the read-only View D projection is stable. | `server/`, `server/workers/`, `tests/` | Worker-control tests plus manual runtime evidence. |
| 10 | Raspberry proof | Add Raspberry power-loss recovery proof checklist and scripts only after PC runtime proof is stable. | `start_scripts/`, `docs/10_runbooks/`, `server/scheduler*` if needed | Manual Raspberry reboot/power-loss evidence. |

## Recommended next batch

Run slices 1-3 first. They are evidence/proof slices that reduce uncertainty before changing runtime behavior.

Do not implement View C restore or View D control paths until their contracts are explicit. Do not activate network geocoding by default. Do not add new GPS providers until the current fallback methods have real-media evidence.

## Open decisions before implementation slices

| Decision | Needed before | Default safe answer |
|---|---|---|
| Which reverse geocoder should be proven first? | Slice 3 | Prefer no-account provider first where allowed by terms and rate limits; keep placeholder fallback enabled. |
| Should View C restore modify Queue, current media pointer, native playback, or all three? | Slices 4-6 | Start with a read-only contract and explicit confirmation; avoid broad mutation until approved. |
| What should View D treat as worker truth: DB, lock files, process list, logs, or combined projection? | Slices 7-9 | Combined projection, clearly labeling each evidence source. |
| Which Raspberry startup mechanism is canonical: cron, systemd, or both? | Slice 10 | Document current cron target first; do not silently introduce systemd. |

## Acceptance rule

A gap is not considered closed until all four columns are available:

| Column | Meaning |
|---|---|
| Docs status | Current docs describe the implemented behavior and limits. |
| Code/tests status | Code exists and automated tests pass. |
| Runtime-observed status | PC or Raspberry runtime evidence exists where required. |
| User subjective assessment | The user has confirmed the behavior is acceptable in their environment, when applicable. |
