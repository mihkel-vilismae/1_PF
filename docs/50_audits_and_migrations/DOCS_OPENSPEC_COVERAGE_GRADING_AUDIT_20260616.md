# PF_login documentation and OpenSpec coverage grading audit - 2026-06-16

Estonian timestamp: 2026-06-16 00:12 EEST

Repository version checked: `0.8.86.a`

Scope: documentation, OpenSpec, proof, and implementation-status coverage audit. This report does not change runtime behavior and does not prove target-machine behavior by itself.

## Evidence basis

Verified directly in this task:

- Read repository governance docs: `AGENTS.md`, `docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`, `docs/table_of_contents.md`, `docs/DOC_INDEX.md`, `docs/DOC_FRESHNESS_MATRIX.md`, `docs/DOC_REORGANIZATION_PLAN.md`, and `docs/DOC_LINK_AUDIT.md`.
- Inspected OpenSpec docs under `docs/20_architecture_and_specs/openspec/`.
- Inspected proof documentation under `docs/proofs/`.
- Inspected package script inventory from `package.json`.
- Inspected v1 gate docs: `raspberry_v1_release_gate_matrix_openspec.md`, `raspberry_v1_openspec_traceability_matrix.md`, and `raspberry_v1_question_matrix_decisions_openspec.md`.
- Ran selected validation commands listed in the verification section.
- Used five read-only explorer agents to collect OpenSpec coverage, documentation governance, v1 implementation-status evidence, proof/test coverage, and high-level architecture-unit evidence.

Not verified in this task:

- No full `npm test` run.
- No live Raspberry target proof.
- No real iCloud login, download, or continuation run.
- No real geocode provider network run.
- No Windows native playback target proof rerun.
- No fresh full Markdown link audit.

## Executive verdict

| Area | Grade | Blunt assessment |
|---|---|---|
| Overall documentation architecture | C+ | The folder model, authority rules, and proof/non-claim vocabulary are much better than average, but inventory, OpenSpec indexes, and freshness upkeep have fallen behind the repo. |
| OpenSpec coverage | B- | Raspberry v1 OpenSpec coverage is broad and mostly well bounded; OpenSpec navigation is stale and some contracts are still structural rather than behavior-enforced. Fedora is paused and not counted as active coverage. |
| Implementation-status traceability | C+ | There is a real traceability system, but local v1 readiness is blocked and some status docs cite older baselines or external/latest bundles not present in this workspace. |
| Proof/documentation drift control | B- | The repo has good drift tests, and one of them caught a real missing proof README update during this audit. |
| v1 readiness claim safety | C | The project is good at saying "not proven"; it is not yet ready to claim v1 completion from local evidence. |

Brutal summary: this repo has an unusually serious documentation and proof discipline, but it is now paying the price for breadth. The standards are mostly correct: source-of-truth hierarchy, non-claims, proof levels, and canonical folders are all present. The weak point is maintenance pressure. The current workspace is `0.8.86.a`, while important governance/audit docs still describe older milestones such as `v0.8.33` or `v0.8.42`. That does not make the docs useless, but it means a reader must treat older summaries as navigation and re-verify against code, tests, proof artifacts, and current OpenSpec before trusting status claims.

## Authority order

Use this order when documents disagree:

1. Current source code, tests, validators, generated proof artifacts, and live runtime output from the relevant target.
2. Current proof docs plus matching `runtime_data/proofs/*` artifacts, with target-machine evidence only for the target that produced it.
3. Current-truth docs under `docs/00_current_truth/`, after rechecking the relevant code/test/proof surface.
4. OpenSpec and contract docs under `docs/20_architecture_and_specs/`; these define target behavior unless paired with proof.
5. Runbooks under `docs/10_runbooks/`; useful operational guidance, not proof.
6. Dated status snapshots under `docs/30_status_snapshots/`.
7. Changelog entries; useful dated evidence, not proof that code still matches.
8. Backlog, task, compatibility-pointer, and archive docs; planning/provenance only.

## High-level logical unit grading table

| Unit | Goal / responsibility | Main docs/specs | OpenSpec grade | Docs grade | Implementation-status confidence | Evidence checked | Main gap | Recommended next tweak |
|---|---|---|---|---|---|---|---|---|
| Dashboard operator UI | Views A-E, mode gating, inspect/status surfaces, operator workflows | `README.md`, `dashboard_auth_pipeline_spec.md`, `CARD_BUTTON_IMPLEMENTATION_STATUS.md` | C+ | B | Medium | Dashboard files and UI test inventory sampled by explorer | Snapshot-heavy view docs can lag UI wiring | Create a current dashboard status table tied to tests and routes. |
| Auth and NEW AUTH | iCloudPD login/session/artifact flow and handoff to real download | `AUTH_EVIDENCE_PACK.md`, `NEW_AUTH_PROVIDER_VERIFICATION_FLOW.md`, auth runbook | C | B+ | Medium | Auth docs, route/service paths, targeted tests from explorer | Less OpenSpec-formal than Raspberry v1 | Add an auth/iCloud OpenSpec or validator section for the existing auth contract. |
| Init, runtime status, scheduler control | Env/DB checks, scheduler target, CronEmulator, status controls | `windows_cronemulator_proof.md`, endpoint inventory OpenSpec, CronEmulator docs | B | B | Medium-high | Endpoint contract check and scheduler docs | Windows path clearer than Raspberry target path | Keep Windows Task Scheduler out of scope and add direct validator notes to scheduler specs. |
| Media pipeline and playback queue | Download/index/GPS/geocode/queue/current item selection | media pipeline current-truth docs, provider specs, playback checkpoint spec | B | B- | Medium-high | Provider docs, proof scripts, v1 gate docs | Real product worker proof remains target-gated | Add one current v1 product-pipeline status row per proof kind. |
| Native playback and display | OS-owned/native player start/stop/status, browser/native display surfaces | native playback spec, Windows/Raspberry playback proof docs | B | C+ | Medium | Native playback controller/proof docs sampled | Windows proof ladder is clearer than Raspberry display truth | Clarify which display claims are Windows, Raspberry, browser-only, or operator-observed. |
| Test Mode and simulation | Whole-logic emulator, dirty shutdown, screen simulation, proof-only paths | Test Mode contract, dirty shutdown proof, screen simulation routes | B | B+ | High for simulation, low for real hardware | Test Mode docs/tests sampled | Simulation can be misread as real behavior | Keep every simulation doc visibly labeled as Test Mode only. |
| Proof runner infrastructure | `proof:*` commands, proof libs, artifact policy, docs drift guards | `docs/proofs/README.md`, proof schema, freshness matrix | B | A- | High for command presence, target-dependent for runtime proof | Package scripts, proof README, docs script-reference test | Proof list drift happened around paused Fedora scripts | Keep `docsNpmScriptReferences.test.js` in every proof-script slice; do not treat Fedora as active scope. |
| Bootstrap and preflight | Windows launchers, Raspberry launcher skeleton, executable/env/tool/iCloudPD preflights, paused Fedora/Linux rehearsal | Windows/Raspberry runbooks, launcher OpenSpecs, proof docs | B- | B | Medium-high for preflight surfaces | Launcher docs, package scripts, proof docs | Preflight surfaces are stronger than final target proof, but platform labels need discipline | Add a platform matrix: Windows proven, Fedora paused, Raspberry target proof. |
| Final target proof aggregation | Raspberry target pack, v1 readiness, proof ZIP/export workflow | v1 traceability matrix, v1 readiness proof docs, proof README | C | C+ | Low locally | Readiness output, package scripts, proof docs | Aggregators exist but local v1 readiness is blocked and target artifacts are absent | Label aggregators as summaries/gates, not proof substitutes. |
| Shared contracts and runtime state | Shared contracts, `.env`, seed vs mutable runtime truth, logs/proofs | runtime truth spec, logging contract, `.gitignore` policy | C+ | B | Medium | Runtime-state docs and ignore rules sampled | Runtime artifacts evolve outside Git | Add validator/proof references to runtime-truth local-state spec. |
| Documentation governance | TOC/index/freshness/archive rules and compatibility pointers | doc governance docs, audits folder docs | n/a | C | Medium | Governance docs and docs filesystem sampled | Inventory/freshness coverage and OpenSpec indexes lag actual docs count | Add a docs inventory freshness audit slice before broad doc moves. |

## v1 goal implementation-status table

| v1 goal | Expected behavior | Current implementation status | Evidence class | Evidence source | Proof/test command if available | Missing validation | Risk if claimed complete |
|---|---|---|---|---|---|---|---|
| Raspberry target readiness | Target tools and generated fixtures pass on the Raspberry-like device. | Some docs say latest bundle proves this, but local workspace readiness is blocked. | documentation-derived locally; target-proof external/not present | Traceability matrix, readiness output | `npm run proof:raspberry-tool-checker`, `npm run proof:raspberry-generated-fixtures` | Local target artifacts in `runtime_data/proofs/` | Would claim target proof from docs without local artifacts. |
| Install/runtime preflight | Executable bits and `.env` preflight pass on target. | Implemented as proof commands; local readiness has no passing artifacts. | code/proof-runner present; runtime proof missing locally | Package scripts, proof docs, readiness output | `npm run proof:raspberry-executable-permissions`, `npm run proof:raspberry-env-preflight` | Latest Raspberry target artifacts | Could hide install blockers after ZIP extraction. |
| Real iCloud media source | iCloudPD source works for v1 production media. | Auth/session gating and route wiring are documented and test-inventory-backed; real source success was not proven locally in this task. | documentation/test-inventory-derived; runtime proof missing for v1 | Auth docs, package scripts, explorer evidence | `npm run proof:real-icloudpd`, `npm run proof:real-download-continuation` | Real account/session proof on target | Generated fixtures could be mistaken for real ingestion. |
| Real GPS/geocode | Real GPS extraction and cache-first real geocode provider behavior. | Provider contracts and placeholder rejection are documented/test-inventory-backed; live provider artifact missing locally. | documentation/test-inventory-derived; runtime proof missing | Provider specs, OpenSpec, proof docs | `npm run proof:real-geocode-provider-chain` | Real provider configured run | Placeholder geocode could be overstated as production. |
| Regular worker product pipeline | `regular_stage_worker` performs real download/index/GPS/geocode/queue work. | Contracted and scripted; product work not proven locally. | target-spec with proof command scaffold | v1 traceability, proof README | `npm run proof:raspberry-regular-stage-worker-product-pipeline` | Target proof artifact | Could claim end-to-end product behavior from local rehearsals. |
| Playback/native display | Raspberry image/video native playback passes on device display. | Proof commands exist; local readiness has no passing artifacts. | documentation-derived locally | Native playback OpenSpecs and proof docs | `npm run proof:raspberry-native-image-playback`, `npm run proof:raspberry-native-video-playback` | Current Raspberry display proof artifacts | Windows/native proof could be mistaken for Raspberry proof. |
| Address overlay device display | Address appears on the real Raspberry/device display. | Contracted/scaffolded; observation not run locally. | target-spec/scaffold | Address overlay OpenSpec, traceability matrix | `npm run proof:raspberry-address-overlay-device-display` | Device display observation artifact | JSON-only address payload could be mistaken for display proof. |
| Cron app-running workflow | All three worker lanes run under cron and do not block each other. | Partial/scaffolded; local readiness is blocked. | code/proof scaffolding, runtime proof missing locally | Cron OpenSpec, readiness output | `npm run proof:raspberry-app-running-target-pack` | Complete target pack rerun | Could overstate app-running from worker scripts alone. |
| Dashboard status view | Dashboard shows proof-backed v1 runtime/status truth. | Contracted; UI proof not run. | target-spec | Dashboard status OpenSpec | future dashboard proof/status helper | Proof-backed UI/status artifact | Could expose optimistic status without proof backing. |
| Screen worker non-blocking | `screen_on_off_worker` lane does not block v1 runtime. | Contracted; dedicated proof not run. | target-spec | Screen worker OpenSpec | future non-blocking proof | Dedicated worker lane proof | Could confuse simulation-only screen behavior with real lane health. |
| Raspberry iCloudPD discovery preflight | Safely discover iCloudPD readiness before claiming real source success. | Proof command exists; it is discovery/preflight only, not login or download proof. | code/proof scaffold | `package.json`, proof README, v1 traceability | `npm run proof:raspberry-icloudpd-preflight` | Target run and separate real iCloud pipeline artifacts | Could be mistaken for real iCloud production proof. |
| Raspberry app-running target pack | Aggregate setup/startup/cron/app-running/native playback evidence into a target package. | Aggregator command exists; local readiness is still blocked without target artifacts. | aggregator scaffold/runtime proof dependent | `package.json`, proof README, readiness output | `npm run proof:raspberry-app-running-target-pack` | Current target bundle artifacts | Could be mistaken as proof by command presence alone. |
| Docs/OpenSpec reconciliation | Docs match v1 implementation and proof state. | `proof:docs-reconciliation-audit` passes as a pre-pass, but v1 readiness correctly expects final proof kind `raspberry_v1_docs_reconciliation`, which no current producer emits. | code-verified producer/consumer mismatch | `tools/docs-reconciliation-audit-lib.mjs`, `tools/raspberry-v1-readiness-lib.mjs`, readiness output | `npm run proof:docs-reconciliation-audit`, `npm run proof:raspberry-v1-readiness` | Add a separate final `raspberry_v1_docs_reconciliation` producer; do not weaken readiness to accept the pre-pass proof kind. | The docs gate remains blocked by design until final reconciliation proof exists. |

## OpenSpec coverage table

| Spec/contract area | Existing OpenSpec/doc path | Covered behavior | Missing behavior | Validator/proof coverage | Current proof level | Grade | Recommended improvement |
|---|---|---|---|---|---|---|---|
| Endpoint inventory | `endpoint_contract_inventory_openspec.md` | Static same-origin API route inventory | Runtime API semantics | `npm run contract:endpoints:check` | Static validator passed in this task | A- | Keep route inventory generated and checked. |
| Raspberry v1 release gates | `raspberry_v1_release_gate_matrix_openspec.md` | Required/non-v1 gates and readiness evaluator | Actual target proof artifacts | `npm run proof:raspberry-v1-readiness` | BLOCKED locally, 0/11 required gates passed | B+ | Add latest-artifact status snapshot only after target proof exists. |
| Raspberry v1 traceability | `raspberry_v1_openspec_traceability_matrix.md` | Gate-to-proof mapping and non-claims | Local artifact availability and exact external bundle evidence for rows marked proven | OpenSpec v1 audit, traceability tests | Static audit passed, but local readiness blocked | B- | Reconcile locally blocked gates with rows that say latest Raspberry bundle is proven, or cite exact external bundle evidence. |
| Raspberry iCloud/media source | `raspberry_icloudpd_discovery_preflight_openspec.md` | Safe discovery/preflight | Real login/download continuation proof | Static v1 audit, real proof commands | Scaffolded/not run locally | B | Add real-source proof artifact requirements to readiness status docs. |
| Raspberry product pipeline | `raspberry_icloud_first_regular_worker_pipeline_openspec.md` | Stage order and evidence shape | Target product-work proof | Proof command exists | Contracted/not proven locally | B | Add direct producer test for the proof artifact kind. |
| GPS/geocode production | `production_gps_geocode_placeholder_rules_openspec.md`, `raspberry_gps_geocode_provider_chain_openspec.md` | Placeholder rejection, provider chain intent | Live configured provider proof | Real geocode proof command | Not run locally | B | Add explicit validator/proof section to each geocode spec. |
| Native image/video playback | Raspberry native image/video OpenSpecs | Target conditions, `mpv`/`ffprobe`, non-claims | Scheduler/recovery/display persistence | Dedicated proof commands and tests | Not proven locally in this task | A- | Keep narrow non-claims; do not roll into app-running proof. |
| Address overlay | `raspberry_address_overlay_device_proof_openspec.md` | Device-display overlay contract | Observation artifact | Proof command exists | Scaffolded/not run locally | B | Define accepted screenshot/photo/operator evidence format. |
| Dashboard status view | `raspberry_dashboard_status_view_openspec.md` | Status-only scope | UI proof and exact data contract depth | Static v1 audit | Planned/contracted only | D+ | Add proof-backed UI/status validator and producer for `raspberry_dashboard_status_view`. |
| Screen worker non-blocking | `raspberry_screen_worker_non_blocking_openspec.md` | Non-blocking lane goal and non-claims | Dedicated worker proof | Static v1 audit | Planned/contracted only | D+ | Add a targeted non-blocking worker proof and producer for `raspberry_screen_worker_non_blocking`. |
| Fedora/Linux rehearsal | `linux_fedora_rehearsal_proof_openspec.md` | Paused Linux rehearsal/parity proof boundary | Active development and tests intentionally paused as of 2026-06-16 | Fedora proof scripts retained for reference | Paused, not active v1 coverage | n/a | Keep code/docs, but do not develop against Fedora unless resumed. |
| OpenSpec navigation/index | `openspec/README.md`, `docs/20_architecture_and_specs/README.md` | Intended to orient readers to current OpenSpec surface | Both indexes were partial before this slice | Manual file comparison | Index drift, not contract failure | D+ before this slice | Keep OpenSpec index updates in the same slice as every new OpenSpec file. |

## Documentation coverage table

| Doc area | Canonical location | Current state | Freshness/index status | Conflicts/stale risks | Grade | Recommended improvement |
|---|---|---|---|---|---|---|
| Governance docs | `docs/DOC_*`, `docs/table_of_contents.md` | Strong policy and navigation model | Some version/freshness notes lag current version | Freshness matrix and inventory counts required correction in this slice | C+ | Add recurring inventory/freshness audit. |
| Current truth docs | `docs/00_current_truth/` | Useful and intentionally limited | Listed in TOC/index | Must still be rechecked against current code | B | Avoid adding broad status docs here unless proof-backed. |
| Runbooks | `docs/10_runbooks/` | Good operator coverage | Listed in TOC/index | Commands can drift if not tested | B | Add command-reference guards where practical. |
| Architecture/specs | `docs/20_architecture_and_specs/` | Broad, detailed, sometimes prose-heavy | OpenSpec subset is strongest, but indexes were partial before this slice | Some broad specs lack direct validators and navigation drift exists | C+ | Require `Validator / proof` section in new specs and keep OpenSpec indexes current. |
| Proof docs | `docs/proofs/` | Strong proof vocabulary and command index | Drift guard exists and now passes | Breadth creates maintenance risk | A- | Keep proof README in every proof-script change. |
| Status snapshots | `docs/30_status_snapshots/` | Useful historical/status evidence | Properly labeled as dated snapshots | Can be misread as current truth | B | Add current audit pointers back to latest status reports. |
| Backlog/tasks | `docs/40_backlog_and_tasks/` | Useful planning area | Clearly non-current in governance docs | Scope creep if used as truth | B | Keep backlog out of current-truth claims. |
| Audits/migrations | `docs/50_audits_and_migrations/` | Strong audit trail | This report added here | Older audits can look current if not superseded | B | Add latest-audit summary rows to freshness matrix. |
| Archive/compatibility | `docs/90_archive/`, `docs/categorized/` | Preserves history and old links | Explicitly compatibility/provenance | Substantial compatibility footprint remains | C+ | Do not retire until a link-retirement audit is scoped. |
| Root-level docs under `docs/` | `docs/` root | Some meaningful docs still sit outside canonical folders | Weak classification coverage | Trust ambiguity | C- | Separate classification slice for root-level docs. |

## Small safe improvements made in this slice

1. Added the missing Fedora proof commands to `docs/proofs/README.md`, then marked Fedora as paused/reference-only per the 2026-06-16 rule.
2. Added this audit report under `docs/50_audits_and_migrations/`.
3. Updated documentation navigation/index/freshness entries for this audit report.
4. Added the Fedora pause rule to `AGENTS.md`.

No runtime code, app behavior, API behavior, proof runner behavior, or target-machine behavior was changed.

## Verification

| Command | Result | What it verifies |
|---|---|---|
| `npm run proof:openspec-v1-audit` | PASSED | Critical Raspberry v1 OpenSpec docs exist and include required structural sections. |
| `npm run proof:docs-reconciliation-audit` | PASSED | Critical docs audit pre-pass has no known contradictory claims from that checker. |
| `npm run contract:endpoints:check` | PASSED | Endpoint inventory OpenSpec matches current generated route inventory. |
| `npm run typecheck` | PASSED | TypeScript compile check passes. |
| `npx tsx --test tests/docsNpmScriptReferences.test.js` | FAILED before README fix, PASSED after README fix | Active docs reference existing npm scripts and proof README lists every `proof:*` script. |
| `npm run proof:raspberry-v1-readiness` | BLOCKED, 0/11 required gates passed locally | Local runtime proof artifacts do not satisfy Raspberry v1 readiness gates. |

## Highest-priority follow-up fixes

1. Add a separate final `raspberry_v1_docs_reconciliation` producer. Do not change readiness to accept `docs_reconciliation_audit`, because that proof is a pre-pass and accepting it as final would overclaim.
2. Add a current v1 status snapshot that says local readiness is blocked unless target artifacts are present, even if external/latest bundle docs claim some gates are proven.
3. Add a standard `Validator / proof` section to all new OpenSpec/contract docs.
4. Run a dedicated docs inventory/freshness slice to classify root-level docs under `docs/` and update `DOC_INDEX.md` counts.
5. Add a regression test that every v1 readiness gate has a named proof producer or is explicitly marked planned.

## Superseded-findings delta from the 2026-06-11 project-status audit

`docs/50_audits_and_migrations/PF_LOGIN_PROJECT_STATUS_ANALYSIS_20260611.md` remains useful context, but it was written for a v0.8.32 baseline. Several areas it described as absent or planning-only now have code, proof scripts, or OpenSpec surfaces in this workspace:

| Area | 2026-06-11 risk | Current delta in this workspace | Current caveat |
|---|---|---|---|
| Raspberry tool checker and launcher | Described as missing/planning path | `proof:raspberry-tool-checker`, project-owned launcher docs, and related proof docs now exist | Target PASS still depends on Raspberry artifacts. |
| Raspberry native image/video playback | Described as not implemented/proven | Native image/video proof commands and OpenSpecs now exist | Local readiness remains blocked without target artifacts. |
| Raspberry app-running/cron path | Described as missing/planning path | Cron preflight, worker evidence, app-running chain, target pack, and readiness scripts exist | Complete v1 app-running evidence is not locally passed. |
| Fedora/Linux rehearsal | Not central in old report | Fedora rehearsal proof scripts and OpenSpec exist | Fedora is paused as of 2026-06-16 and must not be used as active scope. |
| OpenSpec/v1 traceability | Less complete in old report | v1 question matrix, release gate matrix, and traceability matrix now exist | Some gates remain planned/structural, and proof producers are missing for several final gates. |

## Skill/default-rule recommendations

- Add/update rule: Every new `proof:*` script must update `docs/proofs/README.md` in the same slice and run `tests/docsNpmScriptReferences.test.js`.
- Scope: project-specific / docs / workflow.
- Reason: This audit found and fixed a real proof-script documentation drift.

- Add/update rule: Every OpenSpec or contract doc should include a `Validator / proof` section naming the exact test, proof command, or "none yet".
- Scope: project-specific / OpenSpec / docs.
- Reason: Coverage is strongest where contracts name their guard; weak areas are mostly prose-only.

- Add/update rule: V1 readiness gates must be regression-tested against actual emitted proof kinds.
- Scope: project-specific / proof / workflow.
- Reason: The docs reconciliation audit passes, but the v1 readiness gate currently expects a different proof kind.

- Add/update rule: Fedora/Linux rehearsal is paused as of 2026-06-16. Keep existing code and docs, but do not develop against Fedora, add Fedora-first tests, or use Fedora as active v1 scope unless explicitly resumed.
- Scope: project-specific / Fedora / workflow.
- Reason: Preserve prior work without letting paused Fedora scope distort Raspberry v1 planning.
