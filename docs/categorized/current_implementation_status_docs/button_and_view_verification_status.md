# Button and View Verification Status

## Purpose

This file is the canonical, documentation-derived summary of button/view verification status.  
It consolidates `docs_to_parse/button_verification_results/*` into one status view without claiming new code verification.

## Absorbed source docs

Primary:

- `docs_to_parse/button_verification_results/INDEX.md`
- `docs_to_parse/button_verification_results/*.md` (per-button reports)
- `docs_to_parse/button_verification_results/AUTHORITATIVE_MISSING_FUNCTIONALITY.md`
- `docs_to_parse/VISION_SPEC/07-current-implementation-spec.md`

Context:

- `README.md`
- `CHANGELOG.md`
- `docs_to_parse/buttons_and_implementation_overview.md` (older/overlapping reference)

## Documentation-derived status

All statuses below are documentation-derived from the listed docs.

### Classification summary (from `button_verification_results/INDEX.md`)

- `Works`: 11 controls documented.
- `Partial`: 6 controls documented.
- `Mock-only`: 1 control group documented.

### Per-control status table

| View | Section/control | Action key | Documentation-derived classification | Last verified (doc date) | Confidence |
|---|---|---|---|---|---|
| A | 1A Verify .env / Run | `verify-env` | `Partial` | 2026-04-23 | High |
| A | 2A Check DB | `check-db` | `Works` | 2026-04-23 | High |
| A | 2A Inspect DB | `inspect-db` | `Works` | 2026-04-23 | High |
| A | 2A Delete DB | `delete-db` | `Works` | 2026-04-23 | High |
| A | 2A Recreate DB | `recreate-db` | `Works` | 2026-04-23 | High |
| A | 3A Install scheduler | `install-cron` | `Partial` | 2026-04-23 | High |
| A | 3A Check scheduler | `check-cron` | `Partial` | 2026-04-23 | High |
| A | 3A Print scheduler | `print-cron` | `Partial` | 2026-04-23 | High |
| A | B1 Auth preflight / Run | `run-b1` | `Works` | 2026-04-26 | High |
| B | B2 Download test action / Run | `run-b2` | `Works` | 2026-04-23 | High |
| B | B3 Auto run all stages | `run-b3-auto` | `Partial` | 2026-05-05 | High |
| B | B3.1 Download stage / Run | `run-b3-1` | `Works` | 2026-04-23 | High |
| B | B3.2 Index stage / Run | `run-b3-2` | `Works` | 2026-04-23 | High |
| B | B3.3 Parse GPS stage / Run | `run-b3-3` | `Works` | 2026-04-23 | High |
| B | B3.4 Geocode stage / Run | `run-b3-4` | `Partial` | 2026-04-23 | High |
| B | B3.5 Enqueue playback / Run | `run-b3-5` | `Works` | 2026-04-23 | High |
| B | Pipeline maintenance / Detect issues in pipeline | `detect-pipeline-issues` | `Works` | 2026-05-08 | High |
| B | Pipeline maintenance / Clear stale locks | `clear-stale-pipeline-locks` | `Works` | 2026-05-08 | High |
| B | B4 Playback selection / Run | `run-b4` | `Partial` | 2026-04-23 | High |
| B | B5 Screen simulation controls | `b5-simulation-controls` | `Partial` | 2026-05-05 | High |

### View-level documentation-derived status

| View | Documentation-derived verification position |
|---|---|
| View A | Mostly documented as backend-wired controls, with partials in `1A` overlap semantics and `3A` scheduler semantics. |
| View B | Mixed documented status: B2/B3/B4 are backend-wired partial runtime paths, `run-b3-auto` calls backend orchestration, the pipeline maintenance controls call backend stale-lock endpoints, Stage 1 download still uses mock/generated semantics, B3.4 geocode is deterministic placeholder-backed, and B5 is backend-wired simulation only. |
| View C | No button-verification reports exist in `button_verification_results`; code-verified status is partial at the dashboard surface because View C reads `/api/runtime/orchestration/last`, while `resume-last-run` remains local placeholder behavior with no restore endpoint. |
| View D | No button-verification reports in `button_verification_results` set; status remains undocumented in this specific corpus. |

## Conflict / reduction notes

- `AUTHORITATIVE_MISSING_FUNCTIONALITY.md` marks several findings as resolved, while `INDEX.md` still retains `Partial` labels for some controls. This consolidation keeps `INDEX.md` as the latest per-control classification source and records the ledger as supporting context.
- `buttons_and_implementation_overview.md` overlaps this subject area but is broader and not used as the primary per-control status source.
- Status in this file is intentionally documentation-derived and not revalidated against source code in this pass.
- Where this documentation-derived summary conflicts with `code_verified_dashboard_implementation_status.md`, prefer the code-verified file for implementation status and treat this file as historical button-verification corpus indexing.

## Migration status

| Source | Migration status |
|---|---|
| `button_verification_results/INDEX.md` | Fully absorbed as primary per-control status index. |
| Per-button report files | Absorbed as corroborating evidence for classifications. |
| Missing-functionality ledger | Reduced to conflict/context evidence. |
| Buttons overview doc | Reduced to secondary historical/reference role. |
