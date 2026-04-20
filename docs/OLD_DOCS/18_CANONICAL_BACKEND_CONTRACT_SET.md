# Canonical Backend Contract Set

## Consolidation Strategy

This document defines the implementation-ready backend contract set for the Photo Frame pipeline.

The consolidation rules used here are:

- `docs/contracts/**` is the primary authority.
- `docs/archive/analysis/**` is used only when it adds implementation detail or naming clarity without overriding the active contracts.
- The canonical set is optimized for backend implementation, not for preserving older document boundaries.
- Normative rules are kept in four documents:
  - pipeline and stage behavior
  - truth, schema surfaces, ownership, and transitions
  - execution, retry, locking, reclaim, restart, and concurrency
  - acceptance, validation, and proof surfaces

## Proposed New Doc Set

| Document | Purpose | Source docs absorbed |
|---|---|---|
| [`19_BACKEND_RUNTIME_CONTRACT.md`](19_BACKEND_RUNTIME_CONTRACT.md) | Defines the seven runtime stages, shared pipeline rules, ownership boundaries, and stage handoffs. | `RUNTIME_CONTRACTS.md`, `PIPELINE_STAGE_MAP_3103.md` |
| [`20_STATE_AND_TRUTH_CONTRACT.md`](20_STATE_AND_TRUTH_CONTRACT.md) | Defines schema truth surfaces, truth precedence, ownership, status vocabulary, allowed transitions, and invalid states. | `STATE_AND_OWNERSHIP.md`, `STATE_TRANSITION_MATRIX.md`, `runtime/TRUTH_MODEL.md`, `DATABASE_SCHEMA_EXTRACT_3103.md` |
| [`21_EXECUTION_AND_RECOVERY_CONTRACT.md`](21_EXECUTION_AND_RECOVERY_CONTRACT.md) | Defines runtime entry, retry, backoff, atomicity, concurrency, interlocks, reclaim, and restart/resume behavior. | `RUNTIME_AND_RETRY.md`, `runtime/ATOMICITY_MODEL.md`, `runtime/CONCURRENCY_MODEL.md`, `runtime/LOCKING_AND_RECLAIM.md`, `runtime/QUEUE_RECLAIM_MODEL.md`, `runtime/RESTART_RESUME_MODEL.md`, `runtime/STAGE_INTERLOCKS.md`, `RETRY_AND_LOCK_POLICY.md` |
| [`22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md`](22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md) | Defines success criteria, invariants, proof layers, DB checklist expectations, and high-value remaining validation work. | `ACCEPTANCE_AND_VALIDATION.md`, `DB_STAGE_CHECKLIST.md`, `END_TO_END_ACCEPTANCE.md` |

## Reconciliation Notes

1. Stage naming is normalized to the seven runtime stages:
   `stage1_auth_download`, `stage2_index_register`, `stage3_extract_gps`, `stage4_geocode`, `stage5_prepare_queue`, `stage6_run_playback`, `stage7_render_overlay`.
2. Stage 5 is the only stage that inserts `slideshow_queue` eligibility rows in the canonical contract. Stage 4 ends at canonical geocode truth and Stage 5 performs the downstream eligibility handoff.
3. The authoritative current-item pointer is `runtime_state.current_media_asset_id`. Overlay output is derived truth and must be guarded against stale publish.
4. Stale Stage 3 and Stage 4 queue rows reclaim as `PROCESSING -> RETRY`, not back to `PENDING`, and reclaim does not increment `attempt_count`.
5. Stage 2 may process already-downloaded files without a historically successful Stage 1 run, but it must never overlap an active Stage 1 download mutation.
6. The execution contract adopts layered ownership as the canonical target:
   - external stage locks for stage-entry exclusion
   - queue claims for Stages 3 and 4
   - Stage 6 DB lease, with optional external playback lock depending on implementation maturity
7. Where summary docs describe current code as weaker than the deep-dive target, this canonical set preserves the stricter target contract and treats weaker current behavior as implementation debt.

## Old-To-New Migration Map

| Old doc | Status | Destination / note |
|---|---|---|
| `docs/contracts/RUNTIME_CONTRACTS.md` | merged | `19_BACKEND_RUNTIME_CONTRACT.md` |
| `docs/contracts/STATE_AND_OWNERSHIP.md` | merged | `20_STATE_AND_TRUTH_CONTRACT.md` |
| `docs/contracts/STATE_TRANSITION_MATRIX.md` | merged | `20_STATE_AND_TRUTH_CONTRACT.md` |
| `docs/contracts/RUNTIME_AND_RETRY.md` | merged | `21_EXECUTION_AND_RECOVERY_CONTRACT.md` |
| `docs/contracts/ACCEPTANCE_AND_VALIDATION.md` | merged | `22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md` |
| `docs/contracts/DB_STAGE_CHECKLIST.md` | reduced to reference | Checklist contract summarized in `22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md`; implementation can keep the script and report surface |
| `docs/contracts/runtime/TRUTH_MODEL.md` | merged | `20_STATE_AND_TRUTH_CONTRACT.md` |
| `docs/contracts/runtime/ATOMICITY_MODEL.md` | merged | `21_EXECUTION_AND_RECOVERY_CONTRACT.md` |
| `docs/contracts/runtime/CONCURRENCY_MODEL.md` | merged | `21_EXECUTION_AND_RECOVERY_CONTRACT.md` |
| `docs/contracts/runtime/LOCKING_AND_RECLAIM.md` | merged | `21_EXECUTION_AND_RECOVERY_CONTRACT.md` |
| `docs/contracts/runtime/QUEUE_RECLAIM_MODEL.md` | merged | `21_EXECUTION_AND_RECOVERY_CONTRACT.md` |
| `docs/contracts/runtime/RESTART_RESUME_MODEL.md` | merged | `21_EXECUTION_AND_RECOVERY_CONTRACT.md` |
| `docs/contracts/runtime/STAGE_INTERLOCKS.md` | merged | `21_EXECUTION_AND_RECOVERY_CONTRACT.md` |
| `docs/contracts/runtime/CONCURRENCY_SCENARIOS.md` | reduced to reference | Keep as scenario library until a smaller canonical scenario appendix is needed |
| `docs/contracts/runtime/README.md` | dropped | Replaced by this canonical set index |
| `docs/archive/analysis/PIPELINE_STAGE_MAP_3103.md` | absorbed | Used for stage naming and handoff normalization |
| `docs/archive/analysis/RETRY_AND_LOCK_POLICY.md` | absorbed selectively | Used only where it reinforces current retry vocabulary and crash/reclaim intent |
| `docs/archive/analysis/DATABASE_SCHEMA_EXTRACT_3103.md` | absorbed selectively | Used for schema glossary and ownership surfaces |
| `docs/archive/analysis/END_TO_END_ACCEPTANCE.md` | absorbed selectively | Used for invariant wording and proof-layer shape |

## Backend Readiness Summary

### Clear Enough To Implement Now

- Stage ownership boundaries and downstream handoffs
- Queue versus canonical versus runtime truth separation
- Allowed status vocabulary and transition rules
- Retry gating with `next_attempt_at` and row-based `attempt_count`
- Stage 3 and Stage 4 reclaim semantics
- Stage 6 current-item persistence and playback history update rules
- Stage 7 stale-overlay prevention using persisted pointer truth
- DB-backed validation expectations for stages 1 through 6

### Unresolved Blockers Or Implementation Debts

- Whether Stage 6 must always enforce both an external playback lock and a DB lease, or whether the DB lease remains sufficient for the current milestone
- Whether owner-liveness verification is fully implemented for automated reclaim, rather than timeout-only fallback behavior
- Whether Stage 6 restart/resume and Stage 7 publish-guard timing are fully proved by tests rather than only contract text
- Whether Stage 1 live `icloudpd` dependency and 2FA behavior are stable enough for routine end-to-end proof

### Recommended Implementation Order

1. Bring Stage 3 and Stage 4 locking, reclaim, and atomic outcome units in line with the execution contract.
2. Finalize Stage 6 single-runner ownership and restart-safe commit behavior.
3. Enforce Stage 7 pointer-token publish guard so stale overlay cannot leak through races.
4. Strengthen DB checklist coverage and scenario tests around reclaim, restart, and overlapping triggers.
