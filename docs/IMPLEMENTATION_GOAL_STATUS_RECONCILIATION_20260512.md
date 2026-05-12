# Implementation Goal Status Reconciliation — 2026‑05‑12

## Purpose

This document is a snapshot‑safe reconciliation of implementation goals across the 12_PF photo‑frame dashboard repository.  It consolidates documented status claims, unresolved questions and conflicting language into one canonical overview without making any new implementation claims.  It is a documentation‑only artefact; it does **not** modify runtime behaviour, frontend UI, backend routes or tests.

## Baseline note

This reconciliation compares the current work tree against the immutable baseline zip:
`12_PF_20260512_1821_new_auth_provider_verification_slice3_full_git.zip` for the latest NEW AUTH provider-verification UX status update. Earlier rows retain their original documentation-derived evidence limits unless explicitly updated below.

## Status vocabulary

The following terms are used consistently throughout this reconciliation:

- **Implemented** – Code exists and repository evidence shows it is wired and in use.
- **Partial** – Code exists but behaviour is incomplete, bounded or not production‑real.
- **Mock/demo/test‑only** – Behaviour exists only as simulated, generated, deterministic, local‑demo or test‑only behaviour.
- **Planned** – A documented goal exists but implementation is not present.
- **Blocked / decision‑gated** – Implementation depends on an unresolved architecture, safety, schema, platform or provider decision.
- **Unknown / needs verification** – Docs mention the feature but current repository evidence is insufficient to classify it.

## Documentation inventory

This pass inspected the following documentation sets and audits:

- `docs/categorized/current_implementation_status_docs/documented_current_system_state.md`
- `docs/categorized/current_implementation_status_docs/button_and_view_verification_status.md`
- `docs/categorized/current_implementation_status_docs/known_gaps_and_unresolved_questions.md`
- `docs/categorized/current_implementation_status_docs/code_verified_dashboard_implementation_status.md`
- `docs/categorized/task_documentation_still_to_implement/active_implementation_backlog.md`
- `docs/categorized/task_documentation_still_to_implement/verification_and_reconciliation_tasks.md`
- `docs/main_readme.md`
- `README.md` and `CHANGELOG.md`

Where conflicting statements were found, the more specific and conservatively phrased source was preferred and the conflict recorded.

## Canonical implementation goal status

| Goal / area | Canonical status | Evidence | Remaining work | Decision gate / risk |
|---|---|---|---|---|
| NEW AUTH / iCloudPD login flow | Implemented (provider dependent) | `documented_current_system_state.md` – NEW AUTH closure note; `code_verified_dashboard_implementation_status.md` – endpoint family plus 2026-05-12 provider-verification UX update; `docs/NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md` | Real-world validation; provider success depends on Apple account and local environment; continue full local test runs when timeouts allow | Provider availability, 2FA input and session proof |
| iCloudPD secret redaction | Implemented | `code_verified_dashboard_implementation_status.md` – redaction rules: no passwords, codes, cookies or tokens appear in events or logs | Continuous audit; ensure new endpoints never leak sensitive values | Human error could reintroduce leaks |
| View A init / env and DB controls | Implemented / partial | `documented_current_system_state.md` – View A DB controls are backend‑wired; `code_verified_dashboard_implementation_status.md` – destructive checks guarded but env isolation unproven | Auto preload/refresh of readiness status; isolate destructive actions from real DB by default | Platform differences; env isolation needs proof |
| View A scheduler (CronEmulator/Raspberry) | Partial | `documented_current_system_state.md` – scheduler API noted as partial; `code_verified_dashboard_implementation_status.md` – scheduler host reports placeholder services | Implement real worker services; unify scheduler semantics across Windows, Linux and Raspberry targets | Decision‑gated by runtime‑worker implementation and platform support |
| View B runtime pipeline (Stages 1–6) | Partial | `documented_current_system_state.md` – Stage 1 download is mock, geocode placeholder; `code_verified_dashboard_implementation_status.md` – backend endpoints exist but Stage 1 and geocode remain partial | Replace mock download with provider‑backed real download; integrate production geocoder; unify auto orchestration with backend | Dependent on provider, geocoder service and runtime truth model |
| B2 mock/generated download | Mock/demo/test‑only | `documented_current_system_state.md` – B2 copies generated test data; `button_and_view_verification_status.md` – B2 test download classified as Works (mock) | None beyond clear labelling | Confusion if treated as production download |
| B2 provider‑backed real download | Partial / decision‑gated | `CHANGELOG.md` – v0.5.11 adds `/api/runtime/download/real‑run`; `code_verified_dashboard_implementation_status.md` – route exists but still gated on auth and provider proof | Implement real download worker; front‑end selector; confirm provider error handling | Dependent on provider proof and scheduler readiness |
| B3/B3.5 queue preparation | Implemented | `documented_current_system_state.md` – B3.5 owns queue preparation/building; `b4_playback_flow_status.md` (code verified) – confirmed queue builder | Maintain separation from playback selection; ensure queue build uses real stage results | Risk of regression if mixed with B4 playback logic |
| B4 playback selection / playback worker | Implemented (selection only) | `b4_playback_flow_status.md` and `README.md` – playback worker selects current item only | Real preview/fullscreen media rendering; hardware output still missing | Risk of scope creep into download/index/geocode or screen control |
| Preview rendering | Mock/demo/test‑only | `b4_playback_flow_status.md` – preview is not real media display | Implement real preview renderer connected to selected item | Requires UI spec and runtime truth contract |
| Fullscreen rendering | Planned | `b4_playback_flow_status.md` – fullscreen rendering not implemented | Implement real fullscreen renderer; integrate with OS/hardware | Decision‑gated by rendering spec and hardware constraints |
| Raspberry OS rendering | Planned / disabled | `README.md` and `b4_playback_flow_status.md` – Raspberry rendering remains disabled/planned | Define Raspberry display contract; implement separate worker | Hardware/platform support required |
| B5 screen simulation / hardware | Mock/demo/test‑only | `button_and_view_verification_status.md` – B5 simulation controls remain partial; `code_verified_dashboard_implementation_status.md` – backend screen logging is process‑local | Define backend simulation contract; separate real screen control adapter | Risk of mixing simulation logic into playback worker |
| View C last run / restore | Partial / mock‑only | `documented_current_system_state.md` – View C planned/mock‑only; `code_verified_dashboard_implementation_status.md` – UI reads last run but no restore endpoint | Implement backend restore endpoint; wire UI to `/api/runtime/orchestration/last` if appropriate | Decision‑gated by runtime truth model and restore semantics |
| View D live runtime monitor | Planned / mock‑only | `documented_current_system_state.md` – View D planned; `button_and_view_verification_status.md` – no verification; `code_verified_dashboard_implementation_status.md` – simulation only | Define runtime projection model; implement dynamic monitor UI | Dependent on runtime truth authority and worker health surfaces |
| Runtime truth ownership model | Partial / decision‑gated | `known_gaps_and_unresolved_questions.md` – runtime truth bridge noted; unresolved final model; `code_verified_dashboard_implementation_status.md` – bridge uses `conf/runtime-truth.json` plus DB | Decide final authority between SQLite, lock files, logs and runtime‑truth JSON; update backend and UI accordingly | High risk of conflicting sources and unsynchronised state |
| Test/demo vs real runtime isolation | Unknown / needs verification | `code_verified_dashboard_implementation_status.md` – live destructive checks intentionally skipped due to lack of isolation proof | Add env isolation proof; separate namespaces for test/demo vs real runtime data | Risk of data corruption or unintended side‑effects |
| Canonical schema migration | Blocked / decision‑gated | `active_implementation_backlog.md` – schema migration tasks remain decision‑gated | Approve migration order; implement migration with rollback tests | Could break existing data and runtime truth if done prematurely |
| View E database viewer | Implemented | `documented_current_system_state.md` – DB viewer is backend‑wired; `code_verified_dashboard_implementation_status.md` – verify/connect/table/logging endpoints tested | Expand DB logging from process‑local to full SQL audit; review authority boundaries | Low risk; mostly implementation polish |
| Frontend backend‑call transit logging (shared API client) | Implemented | `README.md` update note – calls go through `dashboard/services/apiClient.ts`; 0.5.13 baseline adds `callId` correlation | Ensure all new frontend calls use `requestJson(...)`; maintain callId for issued/received logs | Risk if direct `fetch()` bypass appears; tests should catch |
| TypeScript / static health | Partial | `code_verified_dashboard_implementation_status.md` – `npm run typecheck` fails with pre‑existing errors | Fix TS errors in separated slices; update types and runtime definitions | Non‑blocking for runtime; risk of drift if ignored |
| Live destructive smoke tests / environment isolation | Blocked / decision‑gated | `code_verified_dashboard_implementation_status.md` – no destructive live DB tests executed due to isolation gap | Implement isolated test harness; only run destructive smoke tests in isolated environment | High risk of data loss without isolation |

## Unresolved questions preserved from docs

| Unresolved question | Source evidence |
|---|---|
| Final runtime truth authority split (SQLite vs lock files vs logs vs `runtime‑truth.json`) | `known_gaps_and_unresolved_questions.md` |
| Non‑interactive 2FA completion boundary and provider ownership | `known_gaps_and_unresolved_questions.md`, auth docs |
| Scheduler behaviour standardisation across Windows, Linux and Raspberry | `known_gaps_and_unresolved_questions.md`, scheduler docs |
| View B orchestration boundary (frontend auto‑run vs backend orchestrator) | `known_gaps_and_unresolved_questions.md` |
| Restore/resume contract for View C | `known_gaps_and_unresolved_questions.md` |
| Runtime projection model and worker health surface for View D | `known_gaps_and_unresolved_questions.md` |
| Production provider download gating and semantics | `documented_current_system_state.md` |
| Deterministic placeholder geocoding vs production geocoder | `documented_current_system_state.md` |
| Canonical schema migration approval and phases | `active_implementation_backlog.md` |

## Conflicting or ambiguous status language found

| Conflict / ambiguity | Notes |
|---|---|
| Status vocabularies differ (Works/Partial/Mock‑only vs Implemented/Partial/Planned) | Harmonised to the vocabulary defined above |
| Stage 1 download described as `Implemented` in some docs yet `Partial`/mock in code‑verified audit | Treated as mock/demo/test‑only because it copies generated data |
| Geocode stage sometimes labelled `Implemented` or `Partial` while docs call it deterministic placeholder | Classified as partial; clearly not production‑real |
| View C documented as `Planned` vs code‑verified audit calling it `Mock‑only` | Status recorded as partial/mock‑only; no restore endpoint exists |
| View D absent from button verification docs, sometimes implied by planned runtime monitor | Recorded as planned/mock‑only |
| Scheduler described as `Implemented` in placeholder docs yet marked partial in current status | Recorded as partial; host reports placeholder services |

## Recommended implementation order

1. **Documentation reconciliation** – produce a single canonical status doc (this file).
2. **Runtime truth authority map** – decide and document the final authoritative sources for runtime state.
3. **Shared runtime contracts** – define TypeScript types for stage results, playback state, screen state and worker health.
4. **Test/runtime state isolation** – implement environment isolation and namespacing for test/demo vs real runtime data.
5. **View A preload/refresh** – add safe read‑only preload/refresh of readiness status on entry.
6. **Scheduler real‑worker boundary** – implement real pipeline/playback/screen/recovery workers and integrate scheduler hosts.
7. **View C last‑run read path** – wire View C to a backend endpoint for reading last orchestration state.
8. **View D live runtime projection** – implement a real runtime monitor based on the runtime truth authority map.
9. **View C controlled restore** – add a restore endpoint and confirm semantics before wiring the UI.
10. **View B runtime cleanup** – replace deterministic placeholder geocoder and mock download with production implementations.
11. **Production geocoder adapter** – integrate a real geocoding service.
12. **Provider‑backed real download** – implement full provider download flow with auth gating.
13. **Canonical schema migration** – after runtime truth decisions, migrate schema safely with rollback.
14. **Real preview/fullscreen media rendering** – add actual media rendering for preview and fullscreen.
15. **Raspberry/hardware rendering** – develop hardware display worker for Raspberry or other targets.

## Non‑goals of this documentation slice

- This document does not make any new implementation promises.
- It does not modify code, endpoints, tests or runtime behaviour.
- It does not change package versions.
- It does not resolve the open architectural or product questions listed above.
- It serves solely as a snapshot of documentation‑derived status for future reference.

## Changelog note

### 2026‑05‑12 14:16 Tallinn

This reconciliation pass adds `docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md` as a consolidated status document.  It links the existing documentation sets, records canonical status decisions, preserves unresolved questions, highlights conflicts in status language and provides a recommended implementation order.  The pass does not alter source code, runtime behaviour or package versions.

### 2026-05-12 18:34 Tallinn

This status-doc refresh updates the reconciliation to include the completed NEW AUTH provider-verification UX slices. Passive skipped provider proof is now documented as an actionable UI state, active `Verify with iCloudPD` is documented as `GET /api/auth/new/status`, and `Verify iCloudPD install` remains an install/config readiness check only. This pass updates documentation and version metadata only; it does not alter runtime behavior.
