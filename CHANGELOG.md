# Changelog

## 0.8.194

- Added an auth checkpoint operator flow runbook for moving from `AUTH_REQUIRED` toward app-owned `AUTH_SESSION_USABLE` proof state.
- Added `proof:auth-checkpoint-operator-flow` to prove the runbook documents allowed states, secret boundaries, and non-claims.

## 0.8.193

- Improved iCloudPD config readiness diagnostics with explicit missing-key reporting, grouped readiness categories, and operator-safe env-key guidance.
- Preserved secret boundaries: proof artifacts report only key names and booleans, never Apple IDs, passwords, cookies, tokens, raw `.env` values, or session files.






## 0.8.192

- Added a geocode provider selection matrix with supported provider IDs, required env keys, and first-run guidance.
- Added `proof:geocode-provider-selection` to keep the matrix aligned with real geocode readiness metadata without calling providers.

## 0.8.191

- Added a safe provider proof environment template for geocode, iCloudPD, and real download readiness inputs.
- Added `proof:provider-env-template` to prove required keys exist, real-provider opt-ins default to false, and no secret values are stored in the template.

## 0.8.190

- Added `proof:proof-report-blocker-summary` to group existing proof-report blockers by config/env, auth/session, provider/network, product evidence, operator evidence, docs/test, and platform-optional categories.
- Updated proof-runner queue ordering so the final summary phase is readiness -> blocker summary -> final readiness summary.

## 0.8.189

- Added a provider proof order runbook covering auth checkpoint, iCloud readiness/preflight, real iCloud, real download readiness/continuation, real geocode readiness/chain, v1 readiness, and final summary order.
- Added tests that enforce provider-proof command order and secret/mock boundaries.

## 0.8.188

- Added a secret-safe real download continuation readiness preflight proof.
- Added `proof:real-download-readiness` to check opt-in, route-plan shape, mock-route avoidance, and download-directory resolution without calling the backend or downloading media.

## 0.8.187 - Real iCloudPD readiness preflight

- Added `proof:real-icloudpd-readiness` as a no-download preflight for iCloudPD/auth readiness.
- Added tests proving missing config blocks honestly and configured readiness does not leak Apple IDs, passwords, cookies, tokens, or `.env` values.

## 0.8.186 - Real geocode provider readiness preflight

- Added `proof:real-geocode-provider-readiness` as a no-network preflight for real geocode provider configuration.
- Added tests proving unsupported/missing provider configuration blocks honestly and supported provider setup can pass readiness without making a provider call.

## 0.8.185 - Proof-runner final-summary test repair

- Updated the proof-runner queue test to expect `proof:raspberry-v1-readiness` before `proof:proof-runner-final-summary`.
- Preserved the final-summary-last queue contract introduced in v0.8.182.

## 0.8.184 - Proof-runner handoff instructions

- Added operator-facing instructions for the ordered `2proofrunner 1repo` flow.
- Documented `proof:proof-runner-final-summary` in the root proof workflow table.

## 0.8.183 - Ordered proof-runner documentation

- Documented the ordered proof-runner flow: proof-producing commands first, v1 readiness second, final summary last.
- Updated the proof catalog for the proof-runner queue and final-summary commands.

## 0.8.182 - Proof runner final readiness summary

- Added `proof:proof-runner-final-summary` to summarize the latest readiness artifact after proof-producing commands run.
- Added tests proving the summary blocks when readiness is missing or stale and passes when readiness is the final observed summary.

## 0.8.181 - Proof runner queue ordering contract

- Added `proof:proof-runner-queue` to prove final readiness summary proofs run after proof-producing commands.
- Added queue helpers for Windows and Raspberry proof-runner handoffs to keep Raspberry aliases platform-safe.

## 0.8.180 - Raspberry queue docs test alignment

- Updated the Raspberry v1 implementation queue test to accept the current final v1 docs reconciliation proof command.
- Preserved the queue's proof-honesty split between static docs audits and final v1 readiness evidence.

## 0.8.179 - Proof runner queue and docs alignment

- Updated proof catalog and v1 traceability docs for the new dashboard, screen-worker, and docs reconciliation proof commands.
- Aligned implementation queue language so future Raspberry proof reports point at runnable commands instead of planned placeholders.

## 0.8.178 - V1 readiness proof command remap

- Mapped Raspberry dashboard status, screen-worker non-blocking, and v1 docs reconciliation readiness gaps to implemented proof commands.
- Added a regression test so readiness reports no longer point those gates at planned placeholder command text.

## 0.8.177 - iCloud auth readiness diagnostics

- Added secret-safe readiness hints to the real iCloudPD proof when the proof is intentionally blocked.
- Documented the auth-checkpoint and preflight proof sequence without writing Apple IDs, passwords, cookies, tokens, or .env values into evidence.

## 0.8.176 - Geocode provider readiness diagnostics

- Added secret-safe real geocode provider readiness hints to blocked proof artifacts.
- Added tests proving required environment and supported-provider guidance is available without leaking provider secrets.

## 0.8.175

- feat: add `proof:raspberry-v1-docs-reconciliation` as the v1 readiness proof kind for documentation/OpenSpec reconciliation.
- preserve: this is a docs/OpenSpec gate only and does not replace live provider, product, display, or hardware proof artifacts.

## 0.8.174

- feat: add `proof:raspberry-screen-worker-non-blocking` as the v1 readiness proof kind for the non-blocking screen-worker lane design.
- preserve: the proof is a design/scheduler-host pre-pass and does not claim physical monitor control or real worker process execution.

## 0.8.173

- feat: add `proof:raspberry-dashboard-status-view` as a read-only dashboard status projection proof consumed by v1 readiness.
- preserve: the proof does not start workers, mutate crontab, or claim real provider/hardware behavior.

## 0.8.172

- test: ignore wildcard documentation references such as `npm run proof:*` in npm-script existence checks.
- preserve: concrete `npm run <script>` documentation references are still required to exist in `package.json`.

## 0.8.171

- fix: classify Windows CronEmulator pytest dependency absence as `BLOCKED` instead of `FAILED`, and keep the proof command exit-zero for honest blocked state.
- preserve: missing CronEmulator files, real test failures, and timeouts still fail or time out; this does not turn Windows CronEmulator evidence into Raspberry hardware proof.

## 0.8.170

- test: make the Raspberry project-owned launcher executable-bit guard ZIP-extraction-safe by accepting Git-index `100755` as the canonical executable marker when filesystem mode bits are lost.
- preserve: the launcher itself and project-owned process boundary are unchanged.

## 0.8.169

- test: update the completeness-registry guard for the current registry shape where remaining future/backlog rows are `NONE` instead of runnable or planned commands.
- preserve: non-implemented proof rows still cannot masquerade as `npm run proof:*` commands.

## 0.8.168

- docs: list the v0.8.140+ registry/runtime/proof-enabler npm proof scripts in `docs/proofs/README.md`.
- preserve: documentation-only update; no runtime behavior changed.

## 0.8.167

- test: update the native playback navigation guard so Windows/Raspberry playback must stay directly after A-E while allowing the later Debug route.
- preserve: no runtime navigation order is changed by this slice.

## 0.8.166

- test: make the iCloudPD preflight secret-boundary proof test target-aware by using the explicit Raspberry override block path instead of assuming every Raspberry run must block.
- preserve: the proof still requires redaction and still blocks override-based target claims.

## 0.8.165 - V1 readiness live-data requirements

- Added v1 readiness live-proof data requirement helpers and proof.
- Updated registry so final v1 readiness remains a pre-pass until live Raspberry proof artifacts exist.

## 0.8.164 - Screen worker non-blocking design proof

- Added local screen-worker non-blocking design model and proof.
- Connected scheduler host mock lanes to the future Raspberry screen-worker non-blocking proof boundary.

## 0.8.163 - Regular worker product evidence envelope

- Added staged-write and non-production defaults to the regular worker product evidence template.
- Added proof that the template enables evidence collection but cannot pass product proof by itself.

## 0.8.162 - Regular worker product contract proof

- Refined regular worker product pipeline OpenSpec around staged-write boundaries.
- Added product contract proof for required stage keys and non-claims.

## 0.8.161 - Auth checkpoint proof state

- Added `proof:auth-checkpoint-state` for sanitized app-owned auth/session checkpoint evidence.
- Added tests proving usable state is required and account/session-like values are redacted.

## 0.8.160 - iCloudPD preflight secret boundary

- Added iCloudPD preflight secret-boundary OpenSpec and local proof.
- Proved config presence is summarized without leaking provider/account/session values.

## 0.8.159 - Scheduler host mock status surface

- Added mock-only scheduler host status model and Debug pane surface.
- Proved the scheduler host mock is non-blocking and does not spawn worker processes or write crontab.

## 0.8.158 - Scheduler host boundary OpenSpec

- Added scheduler host boundary OpenSpec for future pipeline/playback/screen/recovery coordination.
- Added docs proof that no worker host, crontab mutation, or Raspberry proof is claimed.

## 0.8.157 - Debug fake restore preview

- Added fake/local Debug save and restore-preview actions.
- Proved restore preview remains blocked before any production runtime/media/database mutation.

## 0.8.156 - Controlled restore action OpenSpec

- Added a controlled restore action OpenSpec before any restore mutation is implemented.
- Added docs proof for restore states, acceptance rules, and non-claims.

## 0.8.155 - View C read-only wording cleanup

- Reconciled View C restore wording so the current state is explicitly read-only.
- Added proof that no enabled restore action is exposed from View C.

## 0.8.154 - View A mode safety proof

- Added explicit Test/Real mode regression proof for View A preload/refresh behavior.
- Proved Test Mode excludes provider login/session actions while Real Mode uses only status refresh semantics.

## 0.8.153 - View A refresh plan

- Added an explicit View A preload/refresh plan with Test/Real mode boundaries.
- Replaced hard-coded View A selection refreshes with the plan helper and added proof coverage.

## 0.8.152 - Debug worker status projection bridge

- Connected Debug worker panes to the read-only runtime status projection while preserving local mock Run now behavior.
- Expanded Debug runtime proof to show projected status does not spawn real workers.

## 0.8.151 - View D status-backed projection

- Updated View D to render the read-only runtime status projection contract.
- Added render proof that inactive View D state does not imply simulated success.

## 0.8.150 - Runtime status projection contract

- Added a read-only runtime status projection contract shared by View D and Debug.
- Added projection tests proving no worker/crontab/production/Raspberry mutation authority is introduced.

## 0.8.149 - Debug runtime registry finalization

- Marked Debug runtime goals `DBG-GOAL-001` through `DBG-GOAL-019` as implemented through the local safe Debug runtime proof lane.
- Added registry assertions and all-worker Run now mock proof coverage.
- Preserved proof boundaries: no real crontab, production media/database, worker process, provider, Raspberry, or hardware proof is claimed.

## 0.8.148 - Debug fake crontab mutation safety

- Added fake-only pause/resume/install helpers for app-owned Debug crontab entries.
- Preserved unrelated crontab rows and blocked high-frequency fake installs until double confirmation.
- Wired Debug UI actions with proof-honest history metadata that no system crontab is touched.

## 0.8.147 - 2026-06-18

- Add a fake/read-only Debug crontab parser that separates app-owned and unrelated rows.
- Wire the Debug crontab textarea and Read current crontab action to browser-local state only.
- Add proof coverage that fake crontab parsing does not touch system crontab.

## 0.8.146 - 2026-06-18

- Add mock/test worker telemetry updates for the Debug Regular, Playback, and On/off worker panes.
- Wire Debug Run now buttons to browser-local mock telemetry without spawning worker processes.
- Add runtime proof coverage for worker telemetry and mock-only invocation boundaries.

## 0.8.145 - 2026-06-18

- Add Debug add-images test entry behavior that registers isolated test-media placeholders only.
- Wire the Debug add-images action through browser-local state and history without production media/database mutation.
- Add runtime proof coverage for test-media isolation.

## 0.8.144 - 2026-06-18

- Add the Debug page shared full-width pane shell for state, playback, add-images, crontab, and worker debug sections.
- Keep pane actions local/planned-safe with explicit non-claims for backend/native/Raspberry behavior.
- Add Debug pane shell styling and runtime proof coverage.

## 0.8.143 - 2026-06-18

- Add explicit Debug sidebar and page version-tracker markers.
- Reuse `__APP_VERSION__` for Debug version display instead of duplicating a hard-coded version.
- Add runtime proof coverage for the Debug version source boundary.

## 0.8.142 - 2026-06-18

- Add the Debug view id, navigation entry, and `/debug` Debug Menu renderer.
- Render Debug through the existing dashboard shell without removing A-E or Windows/Raspberry playback views.
- Keep Debug runtime claims limited to local route/sidebar UI with explicit non-claims for real scheduler/media/worker/Raspberry behavior.

## 0.8.141 - 2026-06-18

- Add `proof:debug-page-runtime` as the Debug runtime proof lane for implementation slices.
- Teach the overall completeness registry proof to allow Debug runtime claims only when backed by implemented status and passed proof.
- Preserve planned Debug rows as non-runnable until their implementation slices update registry status honestly.

## 0.8.140 - 2026-06-18

- Add Debug runtime implementation 3X2ACR workflow guard for slices 0-9.
- Reaffirm v0.8.139 HEAD 4842973 as the immutable implementation baseline.
- Preserve non-claims for real crontab mutation, production media/database mutation, worker invocation, and Raspberry proof.

## 0.8.133 - 2026-06-17

- Repair Debug page documentation coverage assertions to use direct Markdown text containment for long contract phrases.
- Link the Debug Page Goal Registry from the top-level documentation table of contents.
- Preserve the documentation-only boundary and runtime non-claims from v0.8.132.

## 0.8.132 - 2026-06-17

- Add a second-pass 2ACR review for the Debug Page OpenSpec/runbook/goal-registry documentation set.
- Add static docs coverage tests for Debug page route/sidebar/version tracker, pane, crontab, worker telemetry, safety, and non-claim language.
- Preserve the documentation-only boundary: no Debug route, runtime pane, crontab mutation, worker invocation, or Raspberry proof is claimed.

## 0.8.131 - 2026-06-17

- Add a Debug Page runbook for operator/developer use of the planned Debug page, crontab setup, worker panes, and safety checks.
- Add a Debug Page goal registry so new implementation goals can be added regularly with status, proof, and risk notes.
- Link the runbook and registry from documentation navigation without claiming runtime Debug page behavior.

## 0.8.130 - 2026-06-17

- Add a Debug Page OpenSpec for the lightweight Debug route/sidebar/version tracker concept.
- Document the shared debug pane template, Store/Restore, Test Playback, Add Images, Crontab Setup, and worker debug pane contracts.
- Preserve proof honesty: the OpenSpec is documentation only and does not claim runtime Debug page, crontab, worker, playback, or Raspberry proof behavior.

## 0.8.129 - 2026-06-17

- Add a Voice AI transcript intake runbook for converting messy spoken project notes into scoped requirements.
- Document interruption handling for garbled transcript fragments during implementation work.
- Link the transcript rule from README and documentation table of contents.

## 0.8.128 - 2026-06-17

- Add a reusable improve/create skills flow prompt for future chat-to-workflow extraction.
- Document accepted/rejected/deferred skill update rules so future prompts do not duplicate memory or over-store sensitive context.
- Link the prompt from README and documentation table of contents.

## 0.8.127 - 2026-06-17

- Add an auth checkpoint OpenSpec for manual/provider login stages before real iCloud/download proofs.
- Document app-owned sanitized auth states and reject AI/console/browser-open markers as proof authority.
- Link the auth checkpoint concept from README, NEW AUTH docs, OpenSpec index, and v1 traceability context.

## 0.8.126 - 2026-06-17

- Document the Batch 6 standalone worker-evidence handoff and proof-queue status boundaries after the Slice 2-4 implementation.
- Clarify that Raspberry target-pack queue results must be interpreted from internal `proof_status`, not shell exit code alone.
- Preserve the v1 readiness non-claim: even with standalone cron/app-running handoff repaired, missing/planned/blocked real-artifact gates keep readiness `BLOCKED`.

## 0.8.125 - 2026-06-17

- Add `proof:real-geocode-provider-chain` to the Raspberry app-running target-pack queue alongside the already queued v1 target/tool/generated-fixture/native-playback proofs.
- Guard the queue so each implemented v1 gate proof command appears once and still uses internal `proof_status` semantics.

## 0.8.124 - 2026-06-17

- Add a standalone worker-evidence handoff regression test proving cron runtime and app-running status can pass after generated evidence is persisted.
- Add negative coverage proving redacted latest handoff paths remain `BLOCKED`.

## 0.8.123 - 2026-06-17

- Route standalone app-running status through the same resolved latest worker-evidence source used by the cron runtime proof.
- Add an explicit latest-manifest override for proof/test harnesses without changing the default repo-local standalone command path.
- Preserve the rule that app-running status passes only when cron runtime proof and all three worker lanes pass.

## 0.8.122 - 2026-06-17

- Document the Batch 6 Slice 1 worker-evidence handoff repair.
- Clarify that `latest.json` is a machine-readable portable handoff while proof artifacts/log summaries remain sanitized.
- Preserve the proof-honesty rule that redacted or incomplete worker evidence remains `BLOCKED`, not `PASSED`.

## 0.8.121 - 2026-06-17

- Repair `proof:raspberry-worker-evidence` latest manifest output so standalone cron/app-running proof commands can reload generated evidence.
- Add portable evidence-reference resolution for repo-relative, manifest-relative, legacy absolute, and explicit-env handoff paths.
- Add regression coverage for redacted `[REDACTED]` runtime handoff paths and portable `runtime_data/...` evidence references.

## 0.8.86 - 2026-06-15

- Update `tools/unzipper/unzip_latest_photoframe.sh` to hardcode `/home/mihkel/Download_chrome/Photoframe_proofing/.env` as the custom variables source.
- Copy that file into the extracted repository root as `.env` before publishing the target folder and before archiving the ZIP.
- Document the custom variables copy behavior and add static proof coverage for the unzipper contract.

## 0.8.84 - Correct Fedora parity package version root

- Bumped package metadata to 0.8.84 after the v0.8.83 Fedora parity proof package was extracted from a root folder still named v0.8.80.
- Preserved Fedora proof behavior and Raspberry proof boundaries; this is a packaging/version consistency update only.

## 0.8.77 - 2026-06-14

- Add Raspberry v1 OpenSpec implementation queue mapping improved specs to proof-gated implementation work items.
- Queue separates Raspberry-required work from Windows-safe work and requires future runtime slices to reference a matching OpenSpec/proof queue item.
- Add tests that verify the queue covers app-running, iCloud, regular worker, geocode, playback, overlay, dashboard, screen, and docs workstreams.


## 0.8.76 - 2026-06-14

- Add `proof:openspec-v1-audit` static audit for critical Raspberry v1 OpenSpec docs.
- Audit requires status, purpose/goal, and non-claims sections for the active v1 OpenSpec bundle.
- Add tests for passing current docs and blocking missing/underspecified OpenSpec docs.


## 0.8.75 - 2026-06-14

- Add Raspberry v1 OpenSpec traceability matrix linking release gates, question IDs, specs, proof commands, and current proof status.
- Add tests that ensure every required v1 gate is represented and tied to proof/non-claim language.


## 0.8.74 - 2026-06-14

- Add `proof:docs-reconciliation-audit` critical-docs pre-pass.
- Audit checks critical v1 OpenSpec/planning docs exist and rejects known stale contradictory claims.
- Add tests for current docs audit PASS and missing/stale-doc BLOCKED behavior.


## 0.8.73 - 2026-06-14

- Add dashboard status data contract helpers for a proof-backed, status-only v1 dashboard view.
- Contract includes worker health, current playback, v1 readiness gates, latest proof artifacts, and provider status sections.
- Add tests that reject incomplete status snapshots and preserve the no-controls default.


## 0.8.72 - 2026-06-14

- Add `proof:local-generated-media-pipeline-rehearsal` as a Windows-safe generated-media rehearsal proof.
- The rehearsal validates generated media fixture availability and records the regular worker pipeline contract preview without iCloud, DB mutation, geocode, or Raspberry playback claims.
- Add tests for missing and present generated-media rehearsal inputs.


## 0.8.71 - 2026-06-14

- Add regular_stage_worker product pipeline contract helpers for source discovery, download/import, index, GPS extraction, geocode, and queue preparation.
- Add tests that evaluate complete/incomplete product evidence without claiming runtime product work.


## 0.8.70 - 2026-06-14

- Add `proof:raspberry-icloudpd-preflight` scaffold for safe iCloudPD discovery without login/download claims.
- Preflight checks Raspberry target status, required config presence, cookie directory existence, and usable iCloudPD version command candidates.
- Add tests for missing config, passing preflight evaluation, and command-candidate fallback behavior.


## 0.8.69 - 2026-06-14

- Add OpenSpec bundle for remaining Raspberry v1 gates while Raspberry access is unavailable.
- Specify iCloudPD discovery/preflight, iCloud-first regular worker product pipeline, GPS/geocode provider behavior, address overlay device proof, dashboard status view, and screen worker non-blocking proof boundaries.
- Add tests that ensure the v1 OpenSpec bundle exists and records clarified question-matrix decisions without making runtime claims.


## 0.8.68 - 2026-06-14

- Repair expanded Raspberry app-running target-pack ordering from v0.8.66 evidence.
- Run `proof:raspberry-app-running-pass` before worker-evidence-dependent checks so the proof-owned duplicate-skip and stale-lock harness evidence exists first.
- Keep worker evidence generator, cron worker runtime, app-running status, and app-running chain as required target-pack steps after the harness.


## 0.8.67 - 2026-06-14

- Add Raspberry v1 question-matrix decision OpenSpec documenting clarified answers and unresolved matrix items.
- Add a v1 plan derived from the clarified answers and v0.8.66 target-pack evidence.
- Keep unanswered items explicit as open/defaulted rather than treating them as confirmed requirements.


## 0.8.66 - 2026-06-14

- Expand `proof:raspberry-app-running-target-pack` into a fuller v1 readiness evidence pack.
- Target pack now runs Raspberry tool checker, generated fixture proof, worker evidence generator, cron worker runtime, app-running status, app-running chain, native image playback, and native video playback before the v1 readiness summary.
- Worker-evidence-dependent app-running steps receive the latest generated `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE` automatically.
- Preserve proof honesty: real iCloud/GPS/geocode, address overlay, regular product pipeline, dashboard status, reboot, and power-loss remain separate evidence gates.


## v0.8.65 - App-running target-pack evidence ZIP

- `proof:raspberry-app-running-target-pack` now creates an uploadable ZIP bundle under `runtime_data/`.
- The bundle includes proof artifacts, worker evidence, scheduler/cron runtime evidence, operator evidence/templates when present, and a sanitized manifest.
- Bundle creation does not add proof claims; each included artifact keeps its own PASS/BLOCKED/FAILED status.

## v0.8.64 - Raspberry regular product evidence template

- Add `proof:raspberry-regular-product-template` to write a non-claiming operator evidence JSON template for regular_stage_worker product-pipeline proof.
- The template defaults all product-stage claim fields to `false` until real worker evidence is observed.

## v0.8.63 - Raspberry address overlay evidence template

- Add `proof:raspberry-address-overlay-template` to write a non-claiming operator evidence JSON template for the address overlay gate.
- The template defaults all required claim fields to `false` so it cannot accidentally pass without operator editing.

## v0.8.62 - Raspberry app-running target pack

- Add `proof:raspberry-app-running-target-pack` to run the app-running target chain in one ordered proof pack.
- The pack summarizes executable/env repair, worker startup smoke, cron install, app-running pass, and v1 readiness without claiming non-v1 gates.

## v0.8.61 - Raspberry regular worker product pipeline proof gate

- Add `proof:raspberry-regular-stage-worker-product-pipeline` as the v1.0 gate for real regular_stage_worker product work.
- The proof requires explicit stage evidence and does not claim real iCloud/GPS/geocode work by itself.

## v0.8.60 - Raspberry address overlay proof gate

- Add `proof:raspberry-address-overlay-device-display` as the v1.0 evidence gate for native display address overlay.
- The proof requires explicit operator/proof evidence and does not claim rendering by itself.

## v0.8.59 - App-running evidence crontab propagation repair

- Carry the v0.8.58 raw-crontab evaluation repair into `proof:raspberry-worker-evidence` and `proof:raspberry-app-running-pass`.
- Worker evidence generation now evaluates raw `crontab -l` rows internally before final proof-artifact sanitization.
- Add regression coverage for managed cron rows using absolute Raspberry paths plus scheduler fragments.

## v0.8.58 - Raspberry proof false-negative repair

- Fix worker startup smoke status parsing so nested npm proof output with redacted paths still counts `PASSED` preflights.
- Preserve unsanitized `crontab -l` stdout internally for cron row evaluation, while final proof artifacts remain sanitized.
- Keep v0.8.57 worker-startup behavior unchanged; this slice repairs proof recognition/evaluator false negatives found in Raspberry evidence.

## 0.8.54 — Scheduler CLI bootstrap repair and Raspberry cron preflight

- Fixed scheduler CLI bootstrap so regular/screen instrumentation workers do not fail with `ReferenceError: Cannot access 'HttpError' before initialization` when env loading fails.
- Moved playback-only request context loading into the playback worker branch so instrumentation-only regular/screen workers can write status/lock evidence without requiring `.env`.
- Added `proof:raspberry-cron-preflight` with optional `--install` to check/install the PF_login managed cron block for the three Raspberry worker lanes.

## 0.8.53 — Raspberry reboot evidence generator

- Added `proof:raspberry-reboot-evidence` with `--prepare` and `--collect` modes for manual reboot recovery evidence.
- Collect mode writes the `PF_RASPBERRY_REBOOT_RECOVERY_EVIDENCE_FILE` consumed by `proof:raspberry-reboot-recovery` and depends on app-running PASS evidence after reboot.
- The generator does not reboot automatically and does not claim physical power-loss recovery.

## 0.8.52 — Raspberry app-running PASS harness

- Added `proof:raspberry-app-running-pass` to run a proof-owned harness for all three worker lanes and feed generated evidence into the app-running chain.
- Updated `playback_worker` duplicate-lock handling to skip safely and added stale-lock reclaim evidence, aligning playback with the regular/screen worker instrumentation contract.
- The harness remains `BLOCKED` off-target and does not claim reboot, physical power-loss recovery, monitor-pixel proof, production iCloud continuation, or real regular/screen product work.

## 0.8.51 — Real worker status/lock instrumentation

- Added instrumentation-only runtime status/lock workers for `regular_stage_worker` and `screen_on_off_worker` behind the existing scheduler CLI entrypoints.
- The regular and screen workers now write lane-specific status/lock evidence without claiming product pipeline or physical screen-control behavior.
- Added evidence-compatible fields to `playback_worker` status output so the worker evidence generator can read all three lane status files consistently.
- Preserved non-claims for cron PASS, reboot recovery, power-loss recovery, monitor-pixel proof, production iCloud continuation, and real provider chains unless target evidence exists.

## 0.8.48 — Raspberry physical power-loss recovery proof

- Added `proof:raspberry-power-loss-recovery` for explicit physical power-loss/restored-power evidence.
- The proof requires pre/post power-loss markers, restored-power/boot evidence, active cron, all three workers resumed, app-running status passed, stale locks reclaimed, and playback state safe.
- The runner refuses to pass without a real physical power-loss event and never treats Windows CronEmulator evidence as Raspberry hardware proof.

## 0.8.47 — Raspberry reboot recovery proof

- Added `proof:raspberry-reboot-recovery` for manual pre/post Raspberry reboot evidence.
- The proof requires app-running status after reboot, active cron, all three workers resumed, stale locks safe, and playback state safe.
- The runner does not reboot automatically and does not claim physical sudden power-loss recovery.

## 0.8.46 — Raspberry app-running status summary

- Added `proof:raspberry-app-running-status` to summarize whether the Raspberry app is running under the three-worker cron definition.
- Added operator-facing status evidence for cron rows, worker lane evidence, blocking reasons, and failed reasons.
- Extended `start_raspberry_full.sh` with `--app-status` so launcher evidence can include the app-running status result without claiming reboot or power-loss recovery.

## 0.8.45 — Raspberry cron three-worker runtime proof

- Added `proof:raspberry-cron-worker-runtime` with a target-gated proof runner for the Raspberry app-running contract.
- Added proof evidence validation for all three worker lanes: `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker`.
- The proof requires managed cron rows and operator evidence for invocation, same-worker singleton duplicate-skip, cross-worker independence, and stale-lock reclaim.
- Off-target or incomplete evidence returns `BLOCKED`/`FAILED`; no cron install, reboot, power-loss, monitor-pixel, production iCloud, or real-provider proof is claimed.

## 0.8.44 — Raspberry cron worker runtime OpenSpec

- Added `docs/20_architecture_and_specs/openspec/raspberry_cron_worker_runtime_openspec.md` to define Raspberry app-running as active cron plus all three worker lanes: `regular_stage_worker` every 10 minutes, `playback_worker` every 1 minute, and `screen_on_off_worker` every 3 minutes.
- Added `docs/proofs/raspberry_cron_worker_singleton_recovery_proof.md` to define planned proof evidence for same-worker singleton checks, duplicate-skip behavior, cross-worker independence, stale-lock reclaim, reboot continuation, and restored-power recovery.
- Updated Raspberry architecture/OpenSpec/proof navigation docs so Raspberry native playback success is not confused with cron app-running, reboot recovery, or power-loss proof.
- Added `tests/raspberryCronWorkerRuntimeOpenSpec.test.js` to guard the three-worker app-running definition, proof-plan links, and non-claims.
- No runtime behavior changed; this is documentation/OpenSpec/test coverage for the next Raspberry runtime proof slice.

## 0.8.43 — Production GPS/geocode placeholder OpenSpec

- Added `docs/20_architecture_and_specs/openspec/production_gps_geocode_placeholder_rules_openspec.md` to define the v1.0 acceptance boundary for real GPS extraction, address-cache provenance, real reverse geocoding, and placeholder rejection.
- Updated geocode provider, provider-interface, geocode activation, real-geocode proof, address-display proof, and proof README docs so `deterministic_placeholder` and `Lat: ..., Lon: ...` output remain deterministic test/dev behavior only and cannot count as production v1.0 geocode success.
- Added `tests/productionGpsGeocodePlaceholderOpenSpec.test.js` to guard the new OpenSpec and related documentation labels against drift.
- No runtime behavior changed; this is documentation/OpenSpec/test coverage for the production acceptance rule.

## 0.8.42 — Raspberry native video playback proof

- Added `proof:raspberry-native-video-playback` for the target-gated Raspberry deterministic video playback proof.
- Added a proof library/runner, OpenSpec, proof documentation, and regression tests for deterministic video playback using `generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4`.
- Proof returns `BLOCKED` off-target, on explicit override runs, without a display session, without `mpv`/`ffprobe`, or without the deterministic video fixture.
- Proof can return `PASSED` only on a non-override Raspberry-like display target after the project-owned launcher dry-run boundary succeeds, `ffprobe` records video metadata, and bounded `mpv` video playback evidence is collected.
- Preserved non-claims for scheduler behavior, systemd/cron/autostart, reboot/power-loss recovery, monitor-pixel observation, native address overlay equivalence, and production iCloud continuation.

## 0.8.41 — Hermetic View E validation

- Updated `scripts/validate-view-e.mjs` so `npm run validate:view-e` always uses a proof-owned temporary env file and database instead of any ignored local `.env`, ambient `DB_PATH`, `LOG_DIR`, download directory, or cookie directory.
- Added `VALIDATE_VIEW_E_PORT` support for isolated validation/test runs and records sanitized env-isolation metadata in the validation output.
- Added `tests/viewEValidationHermetic.test.js` to reproduce the hostile existing-DB `.env` case and guard against secret leakage or local `.env` mutation.
- Preserved View E validation behavior: verify/connect fail before DB creation, recreate-empty succeeds, table/row/logging paths are exercised, and temporary proof state is cleaned up after the run.

## 0.8.40 — Raspberry native image playback proof

- Added `proof:raspberry-native-image-playback` for the first target-gated Raspberry native playback proof.
- Added a proof library/runner, OpenSpec, proof documentation, and regression tests for deterministic image playback using `generated_test_data/gps_valid/gps_valid_01.jpg`.
- Proof returns `BLOCKED` off-target, on explicit override runs, without a display session, without `mpv`, or without the deterministic image fixture.
- Proof can return `PASSED` only on a non-override Raspberry-like display target after the project-owned launcher dry-run boundary succeeds and bounded `mpv` image playback evidence is collected.
- Preserved non-claims for Raspberry native video playback, scheduler behavior, systemd/cron/autostart, reboot/power-loss recovery, monitor-pixel observation, native address overlay equivalence, and production iCloud continuation.

## 0.8.39 — Raspberry generated fixture proof

- Added `proof:raspberry-generated-fixtures` with `tools/run-raspberry-generated-fixture-proof.mjs` and `tools/raspberry-generated-fixture-proof-lib.mjs`.
- Added `docs/20_architecture_and_specs/openspec/raspberry_generated_fixture_proof_openspec.md` and `docs/proofs/raspberry_generated_fixture_proof.md` to define Raspberry target gating, `python3`/`ffprobe` prerequisites, evidence shape, and non-claims.
- Added `tests/raspberryGeneratedFixtureProof.test.js` to guard PASS/BLOCKED/FAILED status semantics and proof documentation wiring.
- No Raspberry native playback, scheduler loop, reboot recovery, power-loss recovery, or production iCloud continuation is claimed by this proof.

## 0.8.38 — Raspberry project-owned launcher skeleton

- Added `start_raspberry_full.sh` as a thin Raspberry launcher entrypoint delegating to `start_scripts/start_raspberry_full.sh`.
- Added a conservative project-owned launcher skeleton that writes ignored launch-plan evidence under `runtime_data/raspberry_launcher/` and starts the API only when `--start-api` is explicitly passed.
- Added `docs/20_architecture_and_specs/openspec/raspberry_project_owned_launcher_openspec.md`, `docs/10_runbooks/raspberry_project_owned_launcher.md`, and `tests/raspberryProjectOwnedLauncher.test.js` to guard launcher ownership boundaries and non-claims.
- No Raspberry native playback, scheduler loop, boot autostart, reboot recovery, power-loss recovery, or generated fixture proof is claimed by this slice.

## 0.8.37 — Raspberry local tool checker preflight

- Added `docs/20_architecture_and_specs/openspec/raspberry_local_tool_checker_openspec.md` to define the Raspberry tool-readiness contract for `mpv`, `ffmpeg`, and `ffprobe`.
- Added `proof:raspberry-tool-checker` with `tools/run-raspberry-tool-checker-proof.mjs` and `tools/raspberry-tool-checker-lib.mjs`; it writes sanitized runtime evidence and returns `BLOCKED` rather than `FAILED` when run off-target or when tools are missing.
- Added `docs/proofs/raspberry_tool_checker_proof.md` and `tests/raspberryToolCheckerProof.test.js` to guard PASS criteria, install boundaries, and non-claims.
- No Raspberry playback, scheduler, reboot, or power-loss proof is claimed by this slice.

## 0.8.36 — Endpoint contract OpenSpec extraction

- Added `docs/20_architecture_and_specs/openspec/endpoint_contract_inventory_openspec.md` as the same-origin HTTP API route-surface contract for dashboard, proof-runner, and local operator callers.
- Added `tools/collect-endpoint-contract-inventory.mjs` plus `npm run contract:endpoints` and `npm run contract:endpoints:check` to statically extract `METHOD /api/...` route keys and guard the OpenSpec against route drift.
- Added `tests/endpointContractInventoryOpenSpec.test.js` to preserve endpoint coverage and proof-honesty boundaries.
- No runtime route behavior changed.

## 0.8.35 — Task docs TOC drift repair

- Regenerated `task_docs/_TABLE_OF_CONTENTS.md` so `npm run task-docs:check` passes again after recent Git history changes updated the latest task-doc commit fingerprint.
- Preserved the archived task-doc pointer status and did not change runtime behavior, OpenSpec scope, proof runners, or generated fixtures.

## 0.8.34 — Runtime proof artifact ignore guard

- Made the `.gitignore` runtime-proof boundary explicit for `runtime_data/proofs/**`, `runtime_data/private_logs/**`, and `test_runtime_data/**` so timestamped local proof JSON/log/archive evidence remains uploadable but not trackable.
- Added `tests/gitignoreRuntimeProofArtifacts.test.js` to guard the ignore contract with representative proof JSON, log, ZIP, private log, and test-runtime paths.
- No runtime behavior changed; proof runners still write local evidence to `runtime_data/proofs`, and operator proof ZIPs remain the evidence exchange mechanism.

## 0.8.33 — Project status analysis and endpoint inventory report

- Added `docs/50_audits_and_migrations/PF_LOGIN_PROJECT_STATUS_ANALYSIS_20260611.md` with a structured status report for the v0.8.32 baseline.
- Inventoried defined product goals, implementation coverage, OpenSpec/docs coverage, exposed HTTP endpoints/interfaces, command/proof runner interfaces, input/output contracts, proof status, documentation issues, boundary risks, and recommended next slices.
- Preserved proof-honesty boundaries: Raspberry support remains documentation-only, Windows Task Scheduler remains out of scope, generated fixtures are not real iCloud continuation, and controlled recovery is not OS reboot/power-loss recovery.
- No runtime behavior changed.

## 0.8.32 — Documentation consistency audit and stale proof reference cleanup

- Removed the stale `proof:windows-task-scheduler-dry-run` instruction from `HOW_TO_RUN.md`; Windows Task Scheduler remains outside PF_login project scope.
- Refreshed `docs/DOC_FRESHNESS_MATRIX.md` for the v0.8.24-v0.8.32 proof/documentation milestones.
- Added `docs/50_audits_and_migrations/DOC_CONSISTENCY_AUDIT_20260611.md` as the current documentation issue/audit registry.
- Expanded `docs/proofs/README.md` so the proof-command index covers every current `proof:*` npm script.
- Added `tests/docsNpmScriptReferences.test.js` to fail when active docs reference missing `npm run ...` scripts.
- No runtime behavior changed; Raspberry runtime behavior remains unimplemented/not proven, and local-only media tool boundaries remain preserved.

## 0.8.31 — Raspberry OS OpenSpec missing feature documentation

- Added `docs/20_architecture_and_specs/openspec/` as the OpenSpec documentation area.
- Added `raspberry_os_missing_features_openspec.md` to define Raspberry OS launcher, local tool checker, native image/video playback, address overlay, path portability, project-owned scheduler loop, worker autostart, screen on/off, generated fixture validation on Raspberry, controlled recovery, manual reboot recovery, power-loss recovery, evidence export, and operator-guide contracts.
- Added documentation regression coverage to keep Raspberry features marked not implemented/not proven, preserve Windows proof milestone claims, preserve local-only `tools/mpv/` and `tools/ffmpeg/` boundaries, and keep Windows Task Scheduler out of scope.
- No runtime behavior was changed and no Raspberry target-machine proof is claimed.

## 0.8.30 — Windows reboot/restart recovery preflight

- Added `proof:windows-reboot-recovery-preflight` as a safe preflight for future manual Windows reboot/restart recovery proof work.
- Added a proof library, runner, documentation, and regression tests that validate project-owned launcher/proof prerequisites, ignored local media-tool boundaries, cleanup expectations, and explicit non-claims.
- Preserved the project decision that Windows Task Scheduler is not part of PF_login scope; the preflight does not call `schtasks.exe`, does not reboot Windows, and does not claim reboot, Raspberry, monitor-pixel, or production iCloud continuation proof.

## 0.8.29 — Remove Windows Task Scheduler project scope

- Removed the Windows Task Scheduler-only dry-run proof files, script, test, documentation, and package script from active scope.
- Preserved the project-owned scheduler-loop / CronEmulator-style Windows evidence path.
- Added scheduler-scope documentation coverage so Windows Task Scheduler is not recommended as a future PF_login path.

## 0.8.28 — Superseded Windows Task Scheduler dry-run proof contract

- Superseded by v0.8.29 after the project decision that Windows Task Scheduler is not part of PF_login scope.
- Do not reintroduce Task Scheduler-only proof paths unless the project scope is explicitly reversed.

## 0.8.27 — Windows native proof milestone documentation

- Added `docs/proofs/windows_native_proof_milestone_v0.8.26.md` to consolidate the v0.8.26 Windows target-machine proof checkpoint.
- Documented PASSED evidence boundaries for generated video fixture validation, native Windows image playback, worker-autostart image playback, native Windows video playback, controlled API-restart native recovery, and proof-owned live Windows scheduler loop.
- Preserved explicit non-claims for Windows Task Scheduler, full Windows reboot, Raspberry cron/reboot/power-loss recovery, monitor-pixel proof, production iCloud continuation, and vendored media tooling.
- Added documentation regression coverage for the proof milestone and non-claim boundaries.

### v0.8.26 - Proof-owned live Windows scheduler evidence collection

Added bounded proof-owned scheduler evidence collection for `proof:live-windows-scheduler`. The proof labels its mode as `proof-owned-scheduler-loop`, invokes regular/playback/screen-on-off worker entrypoints, records timestamps/counts, verifies playback worker duplicate-lock protection, and still does not claim Raspberry cron, Windows reboot, or power-loss proof; Windows Task Scheduler is out of scope.


### v0.8.23 - Live native video proof Test Mode header fix

Fixed the Windows native video proof launcher so the proof-only seed route is called in Test Mode instead of Real Mode. This preserves the seed route guard, keeps production playback ordering unchanged, and still requires real target evidence before native video playback can be claimed as PASS.


## 0.8.28 - Windows Task Scheduler dry-run proof contract

- Added `proof:windows-task-scheduler-dry-run` for safe scheduled-task contract inspection.
- Added dry-run evidence for task names, worker entrypoints, command shape, cleanup previews, local media-tool boundaries, and explicit non-claims.
- Preserved the v0.8.27 Windows proof milestone and did not install persistent Windows scheduled tasks.
## 0.8.25 - Controlled Windows native recovery orchestration

- Implemented proof-owned controlled API stop/restart orchestration for `proof:live-windows-native-recovery`.
- The recovery proof now starts native playback before restart, stops only the proof-owned API process, restarts the proof API with the same env, verifies the same selected item after restart, relaunches native playback, and stops the owned native playback process.
- Preserved the boundary that this is a controlled API restart proof, not a full Windows reboot, Raspberry recovery, or power-loss proof.
## 0.8.21 — Remove media tool bundles from local Git history

## 0.8.22 - 2026-06-05

- Added a proof-only Test Mode seed path that imports a deterministic generated_test_data video fixture as the current READY playback item for the live Windows native video playback proof.
- Updated the live Windows native video proof to call the seed route before checking the playback contract, while preserving strict native `currentMediaType=video` pass criteria.
- Preserved normal production playback ordering, native playback disabled-by-default launcher behavior, and local-only ignored `tools/mpv/` / `tools/ffmpeg/` boundaries.

- Added explicit whole-directory ignore rules for `tools/mpv/` and `tools/ffmpeg/`.
- Rewrote local Git history with `git-filter-repo` to remove both directory trees from all local commits while preserving the files on disk for local runtime/tooling use.
- Re-added the original `origin` URL only as local configuration after the rewrite; remote history was not pushed or force-updated by this change.

## 0.8.20 — Large binary commit confirmation rule

- Added a repo-local `AGENTS.md` rule that requires explicit confirmation before committing newly tracked vendored binaries above GitHub's 50 MB warning threshold.
- Added a stronger warning path for binaries at or above GitHub's 100 MB hard limit so commit/push workflows call out likely push failure before the user proceeds.
- Preserved the existing artifact-regression confirmation rule and normal commit behavior for ordinary source changes, small assets, and unchanged tracked binaries.

## 0.8.19 — Untrack vendored Windows FFmpeg bundle

- Added `tools/ffmpeg/` to `.gitignore` so local FFmpeg binaries stay outside Git tracking by default.
- Removed the previously committed `tools/ffmpeg/windows/` executables from the Git index with `git rm --cached` while preserving the files on disk for local tooling use.
- Preserved existing fixture-generation and metadata-verification scripts, which still expect `ffmpeg` and `ffprobe` to be available locally.

## 0.8.18 — Vendor Windows FFmpeg bundle

- Added repo-local Windows FFmpeg executables under `tools/ffmpeg/windows/` for local fixture generation and media metadata tooling workflows.
- Preserved the existing generated fixture scripts and proof flows, which already call `ffmpeg`/`ffprobe`; this commit only snapshots the vendored Windows binaries now present in the working tree.
- Note: each bundled executable is slightly over GitHub's 100 MB per-file limit, so this commit is valid locally but would be rejected by a normal GitHub push unless the bundle is handled differently.

## 0.8.17 — Clean generated video fixture archive tracking

- Removed `generated_test_data/generated_test_data.zip` from Git tracking so generated fixture archives do not make baseline ZIPs dirty when omitted.
- Added an ignore rule for `generated_test_data/*.zip` while preserving tracked fixture files, manifests, and README metadata.
- Restored `generated_test_data/videos_with_gps/` and `generated_test_data/videos_no_gps/` as real fixture directories with their synthetic video files.
- Preserved v0.8.16 documentation workflow updates and v0.8.14/v0.8.15 generated video fixture behavior.

## 0.8.16 — GIT WORK artifact confirmation safeguard

- Added a repo-local `GIT WORK` artifact confirmation rule to `AGENTS.md`.
- `GIT WORK` must now stop for explicit confirmation before commit/push when the dirty tree looks like an obvious artifact regression snapshot, such as tracked fixture directories collapsing into zero-byte files.
- Preserved ordinary `GIT WORK` behavior for normal dirty-tree commits, expected fixture regeneration, and user-requested intentional artifact removals.

## 0.8.15 — Video fixture repair handoff snapshot

- Snapshotted the current `generated_test_data` repair handoff state with `generated_test_data/VIDEO_FIXTURE_REPAIR_HANDOFF_20260603.md` and `generated_test_data/generated_test_data.zip`.
- Replaced the previously tracked Apple-style video fixture paths under `generated_test_data/videos_with_gps/` and `generated_test_data/videos_no_gps/` with the current zero-byte blocker-file state now present in the working tree.
- Preserved unrelated dashboard, backend, proof launcher, and runtime behavior; this commit only records the current generated-test-data handoff state for follow-up repair work.

## 0.8.14 — Generated video fixture repair integration

- Integrated repaired `generated_test_data` video fixtures from `generated_test_data_video_fixture_repair_v0.8.14_full_git.zip`.
- Replaced zero-byte `generated_test_data/videos_with_gps` and `generated_test_data/videos_no_gps` blocker files with directories containing deterministic synthetic Apple-style H.264/AAC video fixtures.
- Added per-folder generated video clips so each existing top-level fixture folder has at least two video fixtures, preserving proof-only fixture boundaries.
- Added `tools/verify_generated_test_data.py` and `tools/regenerate_video_fixtures.py` for deterministic validation/regeneration of the repaired fixture set.
- Added `proof:verify-generated-test-data` npm script and repair handoff documentation.
- Preserved v0.8.13 proof-owned launchers and did not change production playback ordering.

## 0.8.13 — Target proof-owned launchers

- Added dedicated Windows command/PowerShell launchers for live native video playback, live native recovery, and live scheduler proof tracks.
- Video and recovery launchers follow the proven native playback launcher pattern: generate proof-only env files, start an owned API on the proof port, wait for native playback readiness, run the npm proof command, export evidence ZIPs, and stop only the owned API process.
- Scheduler launcher runs the blocked-by-default scheduler proof through a proof-owned wrapper and exports evidence without claiming Raspberry cron, Windows reboot, or arbitrary scheduler success.
- Preserved normal `start_win_full.cmd` behavior; native playback remains disabled by default outside explicit proof launchers.

## 0.8.9 — Worker stdout proof parser redaction fix

- Fixed `proof:live-windows-native-playback` worker-autostart reporting so sanitized worker stdout containing legacy unquoted `[REDACTED]` placeholders remains parseable.
- Added regression coverage that extracts `worker_selected_item` from noisy worker stdout with sanitized database fields.
- Preserved v0.8.8 native player detach/unref behavior, exact selected-item native playback, owned PID stop behavior, and missing-video-as-limitation handling.


### v0.8.10 - Native Windows video playback proof

Added `proof:live-windows-native-video-playback`, an opt-in Windows proof that requires a real video item to be current/next before launching native playback. Missing video media is reported as `BLOCKED`, not as fake proof.


### v0.8.11 - Controlled Windows native recovery proof

Added `proof:live-windows-native-recovery`, a target-safe proof track for controlled API restart/recovery. It explicitly does not claim Windows reboot or Raspberry power recovery.


### v0.8.12 - Live Windows scheduler proof track

Added `proof:live-windows-scheduler`, a blocked-by-default target proof track for scheduled worker invocations. It separates CronEmulator contract evidence from live Windows scheduler evidence and does not claim Raspberry cron or Windows reboot behavior.

## 0.8.7 — Playback worker native autostart exact-item fix

- Fixed `playback_worker` native auto-start so it launches native playback for the exact media asset selected by Stage 6 instead of re-reading the playback contract and potentially advancing to another next item.
- Added a native playback helper for worker-selected assets that resolves the selected media asset directly and preserves the existing route-based `/api/native-playback/start-current` behavior separately.
- Added regression coverage proving worker native auto-start uses the worker-selected media asset id and does not rely on a second current/next queue lookup.
- Preserved normal native-playback-disabled defaults, owned-process stop behavior, and the existing live Windows proof launcher.

## 0.8.6 — Worker-autostart native playback proof identity fix

- Fixed `proof:live-windows-native-playback` worker-autostart mode so it no longer calls `/api/native-playback/start-current` after `playback_worker` has already run.
- Worker-autostart proof now compares the `playback_worker` selected media asset against native playback status immediately after the worker run.
- Missing video queue coverage is reported as a limitation for image-only runs instead of being treated as failure of worker-autostart image playback.
- The dedicated Windows proof launcher now passes the generated proof-only env file to the npm proof command so the worker CLI sees the same native playback configuration as the proof API.

## 0.8.5 — Windows mpv installer version verification fix

- Fixed `scripts/install_mpv_windows.ps1` so successful `mpv.exe --version` output is treated as verification evidence instead of a failure reason.
- Reworked mpv verification to use `Start-Process` with redirected stdout/stderr, preserving the v0.8.4 repo-path regex escaping fix.
- Added regression coverage so normal multiline mpv version output, including copyright and FFmpeg lines, does not force reinstall or block the live native playback proof launcher.

## 0.8.4 — Windows mpv installer regex escaping fix

- Fixed `scripts/install_mpv_windows.ps1` so repo-root redaction escapes Windows paths before using them in regex replacement.
- Preserved the dedicated live native playback proof launcher and normal launcher defaults.
- Added static regression coverage for `S:\PF_login`-style paths so installer verification does not fail before the live proof can start.

## 0.8.3 - 2026-06-02

- Added dedicated Windows live native playback proof launcher `start_live_windows_native_playback_proof.cmd`.
- Added `start_scripts/run_live_windows_native_playback_proof.ps1` to create a proof-only env file, start an owned API with native playback enabled, run `proof:live-windows-native-playback`, stop only the owned API process, and export evidence ZIPs.
- Fixed `scripts/install_mpv_windows.ps1` repo-root resolution when invoked from Windows launchers.
- Preserved normal `start_win_full.cmd` behavior: native playback remains disabled by default outside explicit proof mode.

# CHANGELOG

## 0.8.2 - Windows mpv auto-install launcher

- Added `scripts/install_mpv_windows.ps1` to verify or install repo-local mpv at `tools/mpv/windows/mpv.exe` for native playback proof/runtime use.
- Updated the full Windows launcher flow so `start_win_full.cmd` remains thin and `start_scripts/start_win_full.ps1` delegates mpv setup after dependency install.
- Documented that mpv binaries are runtime-installed, ignored by Git, and that installer success does not claim live native fullscreen proof.

## 0.8.1 - Live Windows native playback proof scaffold

- Added `proof:live-windows-native-playback` as an opt-in Windows-only live native playback proof.
- Added helper tests for proof gating, browser/native media identity checks, route planning, image/video queue coverage reporting, and BLOCKED evidence.
- Documented that the proof does not claim Raspberry HDMI, real reboot recovery, or monitor-pixel verification.


## 2026-06-02 06:20 EEST — v0.8.0

### Added
- Added manual Test Mode cronjob call buttons `1`, `2`, and `3` under the large TEST MODE FAST EMULATOR start button.
- Added per-button explanation text and hover titles for the manual regular, playback, and screen-on-off worker cronjob calls.
- Added controller-state tracking so the manual button panel is disabled before the large start button is pressed and enabled only after the owned Test Mode controller run exists.

### Changed
- Corrected the completed TEST MODE FAST EMULATOR feature line from patch-level `0.7.49` progression to the minor-version baseline `0.8.0`.
- Updated `proof:test-mode-whole-logic-emulator` to verify manual cronjob button gating and manual worker-call status/log evidence.

### Fixed
- None

### Removed
- None
## 2026-06-02 06:07 EEST — v0.7.49

### Added
- Added Group B TEST MODE FAST EMULATOR start-state behavior: the large button disables visually/functionally after start and duplicate starts are blocked.
- Added dedicated runtime log writing for `logs/end2end_test.log` after the large start button is clicked.
- Added backend-owned status rows after start, including passed controller rows and pending native playback/pipeline rows.

### Changed
- Updated `proof:test-mode-whole-logic-emulator` to verify disabled start state, duplicate-start blocking, status transitions, and sanitized end-to-end log evidence.
- Bumped project metadata from v0.7.48.a to v0.7.49 as the final Group B baseline.

### Fixed
- None

### Removed
- None

## 2026-06-02 05:50 EEST — v0.7.48.a

### Added
- Added Group A TEST MODE FAST EMULATOR status-circle panel rows for crontab, worker calls, native playback intent, and current pipeline stages.
- Added a focused terminal-like UI log surface for the Test Mode fast-emulator run process.
- Added shared status-row and focused-log contract helpers for blank/pending/passed/failed state modeling.

### Changed
- Renamed the View A no-login panel to `RUN whole logic without logging in — TEST MODE FAST EMULATOR`.
- Changed Test Mode fast-emulator cadence labels/config from 60/30/120 seconds to 6/3/12 seconds for regular/playback/screen-on-off worker records.
- Updated focused tests and proof expectations for the new fast-emulator wording and cadence model.

### Fixed
- None

### Removed
- None

## 2026-06-02 05:25 EEST — v0.7.48

### Added
- Added Group 3 owned Test Mode whole-logic controller state for q/w/e/r/t controls.
- Added `/api/testing/whole-logic-emulator/status` and `/api/testing/whole-logic-emulator/control`, both blocked outside Test Mode.
- Added deterministic `proof:test-mode-whole-logic-emulator` artifact runner and proof documentation.
- Added focused tests for controller state transitions, Test Mode gating, UI control buttons, and endpoint constants.

### Changed
- Updated the View A Test Mode panel to show controller status and q/w/e/r/t control buttons.
- Bumped project metadata from v0.7.47 to v0.7.48 for Group 3.

### Fixed
- None

### Removed
- None

## 2026-06-02 05:10 EEST — v0.7.47

### Added
- Added Group 2 backend/service boundary for the Test Mode whole-logic emulator start action.
- Added shared whole-logic Test Mode contract constants for UI/backend alignment.
- Added `/api/testing/whole-logic-emulator/start`, which is blocked outside Test Mode and writes the max-5 worker-stage config plus Windows CronEmulator crontab rows when called in Test Mode.
- Added focused tests for the Group 2 service, UI action enablement, and frontend endpoint constant.

### Changed
- Enabled the View A Test Mode button so it can call the safe backend boundary.
- Bumped project metadata from v0.7.46 to v0.7.47 for Group 2.

### Fixed
- None

### Removed
- None

## 2026-06-02 04:50 EEST — v0.7.46

### Added
- Added Group 1 Test Mode-only View A panel titled `RUN whole logic without logging in`.
- Added the requested long operator button label, native fullscreen shutdown key copy, and safe power-outage simulation boundary copy.
- Added `docs/20_architecture_and_specs/test_mode_whole_logic_emulator_contract.md` to pin the UI/contract scope before backend wiring.
- Added focused UI tests for Test Mode-only rendering and disabled Group 1 behavior.

### Changed
- Bumped project metadata from v0.7.45 to v0.7.46 for Group 1.

### Fixed
- None

### Removed
- None

## 2026-06-02 04:00 EEST — v0.7.44

### Added
- Added `proof:address-display-ui`, a deterministic dashboard/display-facing UI proof that renders selected playback address evidence into the Windows playback surface and fullscreen overlay.
- Added semantic UI assertions for the selected address, safe backend media URL, missing-address fallback copy, and omission of unsafe raw filesystem paths.
- Added focused tests for the address display UI proof envelope without storing brittle full-page snapshots.

### Changed
- Bumped project metadata from v0.7.43 to v0.7.44 for the new UI proof command.

### Fixed
- None

### Removed
- None

## 2026-06-02 03:24 EEST — v0.7.43

### Added
- Added `proof:real-geocode-provider-chain`, an opt-in real-network geocode proof that exercises the existing Python reverse-geocode provider interfaces and writes sanitized evidence under `runtime_data/proofs/`.
- Added proof checks for real provider success, cache-first miss, cache-hit reuse, placeholder rejection, and human-readable address plausibility.
- Added focused tests for the real geocode provider-chain proof helpers without making network calls in the normal test suite.

### Changed
- Bumped project metadata from v0.7.42 to v0.7.43 for the new real geocode provider-chain proof command.

### Fixed
- None

### Removed
- None

## 2026-06-02 03:02 EEST — v0.7.42

### Added
- Added `proof:e2e-local-photo-frame` to generate deterministic local product-story evidence from Wave D, Wave E, and address-display proof tests.
- Added focused tests for the local photo-frame proof wrapper, fixture discovery, and proof envelope status handling.

### Changed
- Bumped project metadata from v0.7.41 to v0.7.42 for the new proof artifact command.

### Fixed
- None

### Removed
- None

## 2026-06-02 02:50 EEST — v0.7.41

### Added
- Added shared proof subprocess helpers for local `tsx` commands and Python command fallback evidence.

### Changed
- Updated remaining local proof wrappers to avoid shell-dependent `npx` and hard-coded `python3` assumptions.
- Reused the shared local `tsx` command builder across deterministic proof runners.

### Fixed
- Fixed remaining proof artifact runner portability failures for full-test, GPS fallback, and deterministic media pipeline proofs.

### Removed
- None

## 2026-06-02 02:14 EEST — v0.7.40

### Added
- None

### Changed
- Updated proof runner command construction to use local runtimes instead of shell-dependent `npx` or `python3` assumptions.
- Aligned static dashboard render-call assertions with the current visual-mode-aware render signature.

### Fixed
- Fixed Windows full-launcher proof failures caused by missing `python3` and subprocess `npx` lookup failures.

### Removed
- None

## 2026-06-02 02:04 EEST — v0.7.39

### Added
- Added a PF_login-specific thin-entrypoint architecture rule to `AGENTS.md` for `server/index.ts` and `dashboard/app.ts`.

### Changed
- Bumped project metadata from v0.7.38 to v0.7.39 for the repo-local governance documentation update.

### Fixed
- None

### Removed
- None

## 2026-06-02 00:52 EEST — v0.7.38

- Merged remote `origin/master` updates into local `master`, including the repository VERSION output rule and root-only ZIP archive ignore rule.
- Preserved the local v0.7.36/v0.7.37 Windows launcher component-status monitor and repository packager changes.
- Bumped project metadata from v0.7.37 to v0.7.38 for the merge commit.

## 0.7.37 - 2026-06-01

- Committed the previously dirty `TRANSFERABLE_REPO_PACKAGER.cmd` improvements that report `.git` size/file-count checkpoints, run `git gc --prune=now`, and warn if `.git` metadata changes during packaging.
- Preserved the existing file-mode normalization for `scripts/raspberry_power_loss_recovery_check.sh` and `tools/run-dirty-shutdown-testing-proof.mjs` so the baseline working tree is clean.
- Bumped project metadata from v0.7.36 to v0.7.37 without changing app runtime behavior.

## 0.7.36 - 2026-06-01

- Updated `start_win.cmd` to keep its lightweight API/frontend launch behavior while also opening a component-status monitor terminal.
- Updated `start_win_full.cmd` / `start_scripts/start_win_full.ps1` to launch a status monitor tab/window alongside API and dashboard.
- Added `start_scripts/start_component_status.ps1`, which displays API and dashboard running status plus backend/dashboard versions without logging secrets or provider output.
- Updated Windows launcher documentation and bumped project metadata from v0.7.35 to v0.7.36.
- Excluded generated `dist/` output from TypeScript checks so launcher builds do not poison later `npm run typecheck` runs.

## 0.7.35 - 2026-05-31

- Bumped project metadata after the proof-artifact slices added since v0.7.34.
- Added changelog coverage for the NEW AUTH artifact controls, GPS fallback proof, deterministic media pipeline proof, real download continuation proof, address display proof, native/fullscreen playback proof, dirty-shutdown testing panel, and Windows CronEmulator proof.
- Aligned `VERSION`, `package.json`, `package-lock.json`, and final ZIP/folder naming for the new baseline.
- Preserved runtime behavior, backend routes, Test/Real separation, proof-artifact conventions, compatibility pointers, and existing documentation structure.

## 0.7.34 - 2026-05-31

- Added proof artifact schema and full test suite stability proof runner.
- Added sanitizer coverage for proof evidence so runtime artifacts can be shared without secrets.
- Added opt-in real iCloudPD pipeline proof runner that is blocked by default and uses only existing backend routes.
- Added opt-in real geocode provider proof runner that rejects placeholder-only proof.
- Added Raspberry power-loss recovery proof collector and device-side check helper.

## 0.7.33 - 31.05.2026, 12:33:00 EEST

- Fixed GPS worker queue failure-code normalization so all no-result GPS provider fallbacks persist the stable worker-level `gps_not_found` code.
- Preserved provider-chain fallback behavior for sidecar, filename, and path coordinate providers while preventing fallback-specific no-result codes from leaking into the Wave C queue contract.
- Preserved provider-specific failure codes for actual provider failures.
- Bumped version metadata from v0.7.32 to v0.7.33.

## 0.7.32 - 29.05.2026, 22:20:00 EEST

- Added a cache-first reverse-geocode provider registry with `address_cache` before all network providers.
- Added disabled-by-default Python adapters for `nominatim_osm`, `photon_komoot`, `postcodes_io_uk`, `pelias_self_hosted`, `opencage`, `geoapify`, `mapbox`, and `google_geocoding`.
- Standardized geocode provider account/config environment keys for username, account ID, contact email, API key, access token, user agent, base URL, timeout, and enabled state.
- Preserved existing geocode worker behavior by keeping network providers disabled and the deterministic placeholder fallback enabled by default.
- Added provider-registry tests proving default disabled behavior and address-cache-first resolution.
- Bumped version metadata from v0.7.31 to v0.7.32.

## 0.7.31 - 29.05.2026, 22:02:00 EEST

- Added backend-only Python provider contracts for GPS parsing and reverse geocoding under `server/scripts/media_pipeline/`.
- Extracted the current EXIF GPS behavior into `ExifGpsProvider` and the deterministic placeholder geocoder into `DeterministicPlaceholderGeocodeProvider`.
- Routed `stage3_process_gps_queue` and `stage4_process_geocode_queue` through provider-chain helpers while preserving endpoint-visible behavior, queue statuses, DB writes, provider labels, and placeholder output.
- Added regression tests for provider-chain fallback order and the preserved EXIF/placeholder helper outputs.
- Documented how future GPS/geocode providers should be added without frontend changes.
- Bumped version metadata from v0.7.30 to v0.7.31.

## 0.7.30 - 29.05.2026, 20:18:00 EEST

- Added `docs/20_architecture_and_specs/reference/LOGGING_STANDARD_CONTRACT.md` as a reusable logging contract extracted from the repo's durable backend, verbose request, auth debug, private raw-provider, Test/Real log isolation, and terminal-panel logging patterns.
- Added documentation regression coverage for the logging contract's mandatory sections and source-evidence links.
- Preserved existing runtime behavior, backend routes, Test Mode / Real Mode separation, worker stages, native playback controls, Queue terminology, and logging implementation code.
- Bumped version metadata from v0.7.29 to v0.7.30.

## 0.7.29 - 29.05.2026, 19:31:00 EEST

- Added a copy-ready Windows native fullscreen playback enablement example to `example.env` while preserving the checked-in disabled-by-default native playback values.
- Bumped version metadata from v0.7.28 to v0.7.29.

## 0.7.28 - 29.05.2026, 17:41:35 EEST

- Fixed regression guards so local untracked `test.env` files do not fail the checked-in single-env-source test.
- Tightened the OS playback observability frontend test to inspect only the dedicated read-only observability request instead of matching later unrelated POST calls.
- Preserved runtime behavior, backend routes, Test Mode / Real Mode separation, worker stages, native playback controls, and Queue terminology.
- Bumped version metadata from v0.7.27 to v0.7.28.

## 0.7.27 - 2026-05-29 EEST

- Added the native playback setup runbook, example environment keys, and API regression coverage.
- Verified mock native player status/detect/start-current/stop flow without launching a real OS player.


## 0.7.26 - 2026-05-29 EEST

- Added disabled-by-default playback worker integration for native fullscreen playback.
- The playback worker can launch native playback only when explicit native and auto-start gates are enabled.


## 0.7.25 - 2026-05-29 EEST

- Added native playback status/control UI to the Windows and Raspberry playback views.
- Wired dashboard controls for native player detection, start-current, stop, and native terminal rows.


## 0.7.24 - 2026-05-29 EEST

- Added a disabled-by-default native playback controller and status/detect/start-current/stop API routes.
- Native playback uses safe spawn argument arrays, tracks only the owned process, and supports a mock player for tests.


## 0.7.23 - 2026-05-29 EEST

- Added the native playback runner architecture spec for OS-native fullscreen playback.
- Documented the disabled-by-default native player boundary, process ownership rules, route contract, and worker integration constraints.


## 0.7.22 - 29.05.2026, 18:05:00 EEST

- Added `docs/10_runbooks/POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md` for manual Windows/Raspberry playback recovery verification after simulated power loss.
- Updated the playback resume checkpoint spec with implementation status for backend APIs, durable runtime-state persistence, frontend heartbeat reporting, startup restore, and fullscreen limitations.
- Added regression coverage for stale checkpoint reporting and invalid media checkpoint rejection.
- Linked the recovery checklist from runbook navigation, current-truth navigation, and the documentation index.
- Bumped version metadata from v0.7.21 to v0.7.22.

## 0.7.21 - 29.05.2026, 17:49:00 EEST

- Added startup playback resume checkpoint loading for Windows and Raspberry OS playback views.
- Restored the same playback item when the backend checkpoint is fresh, valid, and present in the current playback contract.
- Added a user-triggered `Restore fullscreen playback` action instead of assuming the browser can automatically re-enter fullscreen after restart.
- Preserved existing playback selection, queue rotation controls, worker stages, Test Mode / Real Mode separation, deterministic placeholder Geocode, and Queue terminology.
- Bumped version metadata from v0.7.20 to v0.7.21.

## 0.7.20 - 29.05.2026, 17:33:00 EEST

- Added passive frontend playback resume checkpoint heartbeat reporting for Windows and Raspberry OS playback views.
- Captured current item, active index, pause/fullscreen state, rotation timing, and best-effort video timestamp without changing startup restore behavior yet.
- Throttled checkpoint writes and preserved existing browser-side rotation, fullscreen controls, playback selection, worker stages, Test Mode / Real Mode separation, and Queue behavior.
- Added regression coverage confirming checkpoint reporting is additive and does not add playback rotate/fullscreen mutation endpoints.
- Bumped version metadata from v0.7.19 to v0.7.20.

## 0.7.19 - 29.05.2026, 17:18:00 EEST

- Added backend playback resume checkpoint APIs for reading, saving, and clearing Windows/Raspberry checkpoints.
- Persisted checkpoint payloads through the existing SQLite `runtime_state` surface without changing playback selection, worker stages, Queue behavior, or database schema.
- Added checkpoint validation against the current playback contract so stale or missing media references are reported safely.
- Added regression coverage for checkpoint save/read/clear behavior.
- Bumped version metadata from v0.7.18 to v0.7.19.

## 0.7.18 - 29.05.2026, 17:05:00 EEST

- Added `docs/20_architecture_and_specs/playback_resume_checkpoint_spec.md` defining the power-outage playback resume checkpoint contract for Windows and Raspberry OS playback views.
- Documented checkpoint fields, restore policy, stale checkpoint behavior, image/video behavior, fullscreen limitations, safe fallback rules, and Test Mode / Real Mode boundaries.
- Preserved runtime behavior, backend routes, database schema, playback selection, worker stages, Queue terminology, and deterministic placeholder Geocode behavior.
- Bumped version metadata from v0.7.17 to v0.7.18.

## 0.7.17 - 29.05.2026, 16:31:00 EEST

- Added `docs/10_runbooks/PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md` with an operator-facing PC/runtime verification checklist for the five regular worker stages: Download, Index, GPS parser, Geocode, and Queue.
- Added stage-by-stage evidence capture guidance covering UI evidence, backend/log evidence, DB/filesystem evidence, success/failure signs, and subjective assessment notes.
- Linked the checklist from current-truth docs, runbook navigation, the media pipeline implementation-status table, and the documentation index.
- Preserved runtime behavior, backend routes, database schema, Test Mode / Real Mode separation, and the deterministic placeholder Geocode boundary.
- Bumped version metadata from v0.7.16 to v0.7.17.

## 0.7.16 - 28.05.2026, 20:47:00 EEST

- Added `docs/00_current_truth/PROJECT_ISSUES_AND_IMPROVEMENT_GUIDE_20260528.md` as a high-level, evidence-aware guide for main project issues, improvement directions, workflow safeguards, and verification strategy.
- Documented the main remaining gaps around provider boundaries, Test Mode vs Real Mode separation, real geocoding, real iCloudPD runtime proof, GPS metadata breadth, Queue policy, UI stability, and baseline safety.
- Normalized current media-pipeline documentation and OS playback stage-label terminology to use `Queue` only.
- Preserved runtime behavior, backend routes, database schema, tests, and Test/Real mode behavior; this release changes documentation/status plus one display label only.
- Bumped version metadata from v0.7.15 to v0.7.16.

## 0.7.15 - 28.05.2026, 13:36:00 EEST

- Removed committed `test.env` as a supported runtime env source so operators can use only `.env` plus Test Mode `TEST_*` path projection.
- Fixed `verify-env` overlap validation to compare original `.env` real/test paths instead of the active Test Mode projection, preventing false `DB_PATH` / `TEST_DB_PATH` overlap errors.
- Kept temporary `INIT_ENV_FILE` support for isolated automated test harnesses while ignoring a literal `INIT_ENV_FILE=test.env` runtime override.
- Added regression coverage for Test Mode `verify-env` overlap checking with separated `.env` paths.
- Bumped version metadata from v0.7.14 to v0.7.15.

## 0.7.14 - 28.05.2026, 13:20:00 EEST

- Added a dashboard-shell `Pause live updates` / `Resume live updates` control so operators can temporarily stop background polling and transit-triggered renders while using browser DevTools `Inspect element`.
- Guarded `dashboard:transit`, scheduler run-log polling, OS playback observability polling, and backend-version completion with the live-update pause flow while preserving user-triggered controls.
- Added inspect/reality/backend-status metadata and targeted regression tests for the new pause control.
- Added repo-backed analysis, fix design, and verification notes for the DevTools inspection instability caused by full-root re-renders.
- Bumped version metadata from v0.7.13 to v0.7.14.

## 0.7.13 - 28.05.2026, 13:06:00 EEST

- Fixed the remaining nested scroll reset for backend result `Response payload` / JSON panels by marking `renderResultSurface()` payload blocks and inner `.result-json` surfaces with stable scroll-preservation keys.
- Added regression coverage proving result payload surfaces are included in scroll preservation while preserving provider-proof prompt rendering outside raw JSON.
- Added repo-backed failure analysis, fix design, and verification notes for the nested payload scroll reset.
- Verified targeted scroll/render tests and production build; full test suite was attempted in the Linux tool environment but timed out before completion.
- Bumped version metadata from v0.7.12 to v0.7.13.

## 0.7.12 - 28.05.2026, 12:48:00 EEST

- Isolated legacy auth logout unit tests from the shared `runtime_data/auth/auth-state.json` file by using an in-memory auth persistence double.
- Preserved provider logout boundary assertions, local auth state clearing, and auth persistence production behavior.
- Added repo-backed analysis, fix design, and verification notes for the Windows `EPERM` auth logout failure.
- Verified targeted auth logout/service/persistence tests and production build; full test suite was attempted in the Linux tool environment but timed out before completion.
- Bumped version metadata from v0.7.11 to v0.7.12.

## 0.7.11 - 28.05.2026, 12:28:00 EEST

- Added Goal 4 repo-backed media pipeline documentation covering Download, Index, GPS parser, Geocode, Queue, Playback Select, and orchestration.
- Added current-truth implementation-status table at `docs/00_current_truth/MEDIA_PIPELINE_IMPLEMENTATION_STATUS_20260528.md`, with the subjective PC-tested assessment column intentionally left pending.
- Added dated Goal 4 inventory, stage behavior, and verification alignment snapshots under `docs/30_status_snapshots/2026-05-28/`.
- Preserved runtime code, backend routes, Test/Real boundaries, playback selection behavior, and existing pipeline semantics; this release is documentation/status only.
- Bumped version metadata from v0.7.10 to v0.7.11.
## 0.7.10 - 28.05.2026, 12:01:00 EEST

- Added explicit scroll preservation for marked dashboard containers so full-root re-renders no longer force modals, logs, history panels, playback terminal panels, and database scroll areas back to the top while operators are reading them.
- Added focused scroll preservation helper and marker regression tests while preserving existing backend routes, polling, runtime truth semantics, Test/Real separation, playback boundaries, and terminal controls.
- Documented the repo-backed root cause in `docs/SCROLL_PRESERVATION_ANALYSIS_2805.md`.
- Bumped version metadata from v0.7.9 to v0.7.10.

## 0.7.9 - 28.05.2026, 10:20:00 EEST

- Added Goal 3 documentation for fullscreen playback activity reuse, preserved boundaries, and known Raspberry/PIR follow-up limits.
- Added regression coverage that confirms Goal 3 avoids new playback wake mutation endpoints and keeps View B/B5 activity testing separate.

## 0.7.8 - 28.05.2026, 10:15:00 EEST

- Wired fullscreen playback entry/exit to start and stop OS playback activity monitoring.
- Reused the Goal 2 browser mouse/keyboard event path to extend fullscreen keep-awake state without adding backend playback mutation endpoints.

## 0.7.7 - 28.05.2026, 10:10:00 EEST

- Rendered fullscreen playback wake/keep-on monitoring status in OS playback views and the fullscreen HUD.
- Kept the new UI informational at this slice boundary so playback selection, rotation, backend APIs, and scheduler behavior remain unchanged.

## 0.7.6 - 28.05.2026, 10:05:00 EEST

- Added OS playback activity state to the initial dashboard state for Windows and Raspberry playback surfaces.
- Extended the OS playback view model with monitoring, selected-source, unavailable-source, last-activity, and keep-awake labels while keeping rendering behavior unchanged.

## 0.7.5 - 28.05.2026, 10:00:00 EEST

- Added the OS playback activity detection adapter so Goal 3 can reuse the proven View B/B5 PIR/mouse/keyboard source model without coupling fullscreen playback to View B UI state.
- Preserved the honest PIR boundary: fullscreen playback does not fake PIR activity unless a verified backend source is introduced later.

## 0.6.10 - 2026-05-28 07:18 EEST

- Added a read-only OS playback observability contract at `GET /api/runtime/playback/observability` for Windows/Raspberry playback views.
- Wired the three worker cards to backend observability for regular state worker, playback worker, and on-off worker status, including last-called and time-since-last-call text.
- Wired scheduler, error-only, and main runtime terminal panels to mode-aware observability/log sources while preserving `copy all`, `clear`, and per-row `expand row` controls.
- Kept Windows playback tied to CronEmulator evidence and Raspberry playback tied to crontab/project-log style evidence, with Test/Real log path separation preserved through runtime mode env routing.
- Added `docs/OS_PLAYBACK_VIEWS_SLICE_4.md` and regression tests for observability view-model wiring, terminal controls, frontend polling, backend route shape, and documented boundaries.
- Preserved existing Views A-E, B2 Test/Real split, auth/iCloudPD behavior, database mutation endpoints, playback queue contract, media serving, browser rotation, fullscreen overlay, and deferred View B input detection reuse.

## 0.6.9 - 2026-05-28 01:15 EEST

- Added browser-side queue rotation for Windows/Raspberry playback views using the read-only playback contract items.
- Added active Previous, Next, and Start/Pause rotation controls when more than one queue item is loaded.
- Added a dedicated fullscreen playback overlay that uses the same backend-served media URL and resolved-address metadata as the preview surface.
- Added `docs/OS_PLAYBACK_VIEWS_SLICE_3.md` and regression tests for rotation state, fullscreen overlay rendering, media URL safety, and preserved backend boundaries.
- Preserved existing Views A-E, Test/Real runtime separation, B2 Test/Real split, auth/iCloudPD behavior, scheduler behavior, database mutation endpoints, Stage 6 backend selection behavior, and deferred View B input detection reuse.

## 0.6.8 - 2026-05-27 23:25 EEST

- Added read-only playback API contract endpoints for OS playback views: `GET /api/runtime/playback/current` and `GET /api/runtime/playback/queue`.
- Added backend-owned media serving by playback asset id through `/api/runtime/playback/media?assetId=...`, avoiding direct frontend filesystem access while preserving the existing path-based media route for compatibility.
- Wired Windows/Raspberry playback views to refresh from the playback contract and render backend-served image/video URLs with safe empty/error states.
- Added `docs/OS_PLAYBACK_VIEWS_SLICE_2.md` and regression tests for Test/Real playback database separation, queue contract shape, media URL safety, and asset-id media streaming.
- Preserved existing Views A-E, B2 Test/Real split, auth/iCloudPD behavior, database mutation endpoints, scheduler behavior, Stage 6 selection behavior, and v0.6.6 Test/Real runtime path isolation.

## 0.6.7 - 2026-05-27 22:20 EEST

- Added additive Windows Playback and Raspberry Playback view shells after existing Views A-E.
- Added queue-oriented playback preview surfaces with resolved-address text, fullscreen entry buttons, compact Download/Index/GPS/Geocode/Queue stage rows, three worker status cards, scheduler terminal placeholders, error-only terminal placeholders, and main runtime terminal placeholders.
- Added `docs/OS_PLAYBACK_VIEWS_SLICE_1.md` and regression tests guarding the new view shell contract.
- Preserved backend routes, Test/Real runtime path separation, existing A-E views, B4 rendering controls, scheduler/cron behavior, database behavior, auth/iCloudPD behavior, and playback selection behavior.

## 0.6.6 - 2026-05-27 20:18 EEST

- Added runtime mode env routing so Test Mode database/download/log calls resolve into `test_runtime_data/`.
- Added `test.env` as a redacted runnable copy of `test.example.env`.
- Added `docs/TEST_REAL_RUNTIME_BOUNDARY_SKILL.md` to document the reusable Test/Real boundary skill.
- Added regression tests for mode env isolation and frontend runtime mode header propagation.

## 0.6.5 - 2026-05-27 20:07 EEST

- Added `test.example.env` with redacted credentials and isolated test-mode runtime paths under `test_runtime_data/`, including downloads, logs, iCloudPD cookie storage, private raw-stdio log storage, and `test_photo_frame.sqlite`.
- Updated `example.env` log paths so real/example logs live under `runtime_data/logs` instead of the root `logs` folder.
- Preserved backend routes, dashboard cards, Test/Real Mode visibility behavior, auth/iCloudPD execution behavior, scheduler/cron behavior, pipeline behavior, playback behavior, and database runtime logic.

## 0.6.4 - 2026-05-27 18:39 EEST

- Split View B B2 rendering by selected dashboard mode: Test Mode shows only the mock/generated `B2` download action, while Real Mode shows only `B2-REAL_DOWNLOAD`.
- Added `docs/VIEW_CARD_MODE_CLASSIFICATION.md` with a per-view card classification table showing Universal, Test-only, Real-only, and Runtime-dependent cards.
- Added a regression test for the View B mode separation and updated the existing visual-mode gate static guard to reflect the explicit mode parameter.
- Preserved existing backend routes, action IDs, auth/iCloudPD behavior, scheduler/cron behavior, pipeline behavior, playback behavior, database actions, runtime truth state, and the startup mode gate.
- Bumped version metadata from v0.6.3 to v0.6.4 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.6.3 - 2026-05-27 17:22 EEST

- Isolated `tests/authService.test.js` from platform-specific filesystem persistence by adding an in-memory auth persistence test double.
- Fixed the mocked provider-failure regression where Windows `EPERM` could leak into the expected `icloud_login_failed` auth failure assertion.
- Preserved backend auth behavior, provider-boundary honesty, secret redaction, frontend behavior, visual-mode CSS load paths, routes, action IDs, downloads, scheduler/cron behavior, pipeline behavior, playback behavior, database actions, and runtime truth behavior.
- Bumped version metadata from v0.6.2 to v0.6.3 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.6.2 - 2026-05-27 15:49 EEST

- Fixed the Test Mode / Real Mode stylesheet load path by linking `dashboard/styles.test.css` and `dashboard/styles.real.css` from `dashboard/index.html` after the shared stylesheet instead of relying on trailing CSS `@import` statements.
- Updated the visual-mode static test to verify the explicit HTML link graph and the mode-specific CSS files directly.
- Preserved backend routes, authentication/iCloudPD behavior, downloads, scheduler/cron behavior, pipeline behavior, playback behavior, database actions, runtime truth behavior, and the shared dashboard mode-selection logic.

## 0.6.1 - 2026-05-27 13:58 EEST

- Strengthened Test Mode styling so the whole dashboard reads as a warm amber/yellow test environment instead of the Real Mode blue/dark theme with small yellow accents.
- Updated `dashboard/styles.test.css` with Test Mode design tokens, amber body gradients, warm sidebar/topbar/card/log surfaces, amber navigation accents, yellow primary buttons, and readable Test Mode badges.
- Kept Real Mode styling unchanged and preserved dashboard layout, button labels, data-action values, backend routes, authentication/iCloudPD behavior, download behavior, scheduler/cron behavior, pipeline behavior, playback behavior, database actions, and runtime behavior.

## 0.6.0 - 2026-05-27 12:50 EEST

- Organized mode-specific styling: moved Test Mode overrides into `dashboard/styles.test.css` and created `dashboard/styles.real.css` to isolate real-mode adjustments, importing both from the base `styles.css` after shared rules. Removed embedded test-mode overrides from the shared stylesheet to prevent accidental drift.
- Added visual pending-marker borders on incomplete or unverified cards (B3, B4, B5, D1–D4). The new `card--pending` class applies a warning‑colored outline without affecting layout or click behavior. These markers help operators see which areas require further implementation or verification.
- Added a concise visual mode banner in the dashboard top bar. When a visual mode is selected, the banner displays “Test Mode” or “Real Mode” instead of the default hybrid description, ensuring the current visual mode is visible in text and not only through background color.
- Documented the pending-marker rationale in `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md`, listing which cards have pending borders and why.
- Preserved backend routes, API payloads, authentication/iCloudPD behavior, download logic (both mock and real), scheduler/cron behavior, pipeline stages, playback behavior, database actions, and the shared dashboard structure unchanged.

## 0.5.44 - 2026-05-27 12:38 EEST

- Added the first frontend-only Test Mode / Real Mode startup gate so operators must choose a visual mode before the shared dashboard becomes visible.
- Added mode-specific frontend styling markers, including a Test Mode visual theme and an explicit unselected startup overlay.
- Preserved backend routes, auth/iCloudPD behavior, download behavior, scheduler behavior, pipeline behavior, playback behavior, database behavior, and existing dashboard controls.
- Bumped version metadata from v0.5.43 to v0.5.44 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.43 - 2026-05-27 12:25 EEST

- Added `.codex/skills/mock-test-real-implementation-boundary/SKILL.md` as a reusable skill for safely separating visual mode, data source mode, behavior/execution mode, and safety/permission mode across mock/test versus real implementations.
- Added the matching `agents/openai.yaml` descriptor so agent workflows can discover and invoke the new reusable skill.
- Updated `AGENTS.md` read-first guidance so future Test/Real and mock/test-versus-real architecture work reads the reusable boundary skill alongside the PF_login-specific mode skills.
- Preserved app source, UI runtime behavior, backend routes, auth, downloads, scheduler, pipeline, playback, and database behavior unchanged; this release is skill documentation and release metadata only.
- Bumped version metadata from v0.5.42 to v0.5.43 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.42 - 2026-05-27 09:45 EEST

- Added four `.codex/skills/` drafts for the upcoming Test Mode / Real Mode split: visual mode modal/state, mode-specific CSS architecture, pending card/button border audit, and future test-vs-real behavior boundaries.
- Added `agents/openai.yaml` descriptors for each new skill so Codex/agent workflows can discover and invoke them consistently.
- Updated `AGENTS.md` read-first guidance so future Test Mode / Real Mode work reads the new skills before changing UI, CSS, card/button markers, or behavior boundaries.
- Preserved source/UI/runtime/backend behavior unchanged; this release is skill documentation and release metadata only.
- Bumped version metadata from v0.5.41 to v0.5.42 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.41 - 2026-05-26 21:31 EEST

- Added the dated user-observed View A/B/D card/button status snapshot under `docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md`.
- Added read-first/navigation pointers from `AGENTS.md`, `docs/DOC_INDEX.md`, `docs/00_current_truth/README.md`, and `docs/30_status_snapshots/README.md` so the snapshot is discoverable.
- Added `tests/userObservedCardStatusDocs.test.js` to guard the snapshot content and read-first discoverability pointer.
- Preserved source/UI/runtime behavior unchanged; this release fixes documentation discoverability and test coverage only.
- Bumped version metadata from v0.5.40 to v0.5.41 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.40 - 2026-05-26 15:12 EEST

- Added `start_win_full.cmd` and `start_scripts/start_win_full.ps1` for full Windows startup: dependency install, tests, build, API/frontend tabs, and browser launch.
- Added `.codex/skills/windows-project-launcher/SKILL.md` to document the launcher workflow rules for future changes.
- Added `docs/10_runbooks/windows_full_launcher.md` and linked it from run/documentation entry points.
- Preserved existing `start_win.cmd` behavior and source/UI/runtime logic unchanged.
- Bumped version metadata from v0.5.39 to v0.5.40 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.39 - 2026-05-26 15:09 EEST

- Integrated the user-observed subjective assessment column into `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md` for the View A/B/D card/button audit.
- Added the user-observed follow-up issue list covering real-download batching, B3 provider uncertainty, B4 address/fullscreen issues, B5 screen simulation controls, View D worker telemetry, and scheduler verification.
- Updated documentation navigation pointers so future AI/documentation passes know the audit now includes subjective observations and follow-up issues.
- Preserved source/UI/runtime behavior unchanged; this release is documentation and release metadata only.
- Bumped version metadata from v0.5.38 to v0.5.39 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.38 - 2026-05-26 14:35 EEST

- Added a regression test for the View A/B/D card-button implementation audit.
- Corrected the B4 playback rendering button labels and data attributes in `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md` to match rendered source truth.
- Preserved source/UI/runtime behavior; this release only adds test coverage and documentation correction.
- Bumped version metadata from v0.5.37 to v0.5.38 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.37 - 2026-05-26 14:27 EEST

- Added `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md` with baseline-specific View A/B/D `.card` button inventory tables, implementation status according to tests/code, implementation status according to docs, and reconciliation notes.
- Added read-first/navigation pointers from `AGENTS.md`, `docs/DOC_INDEX.md`, and `docs/00_current_truth/README.md` so future AI runs can find the card/button audit without duplicating the full table.
- Preserved runtime behavior, frontend UI behavior, backend routes, tests, authentication, scheduler behavior, pipeline behavior, and monitoring behavior unchanged; this release is documentation and discoverability only.
- Bumped version metadata from v0.5.36 to v0.5.37 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.36 - 2026-05-26 03:33 EEST

- Added `copy all`, `clear`, and per-row `expand row` controls to the View A `cron endpoint / row live log` terminal.
- The per-row expand control opens the shared modal with full untruncated scheduler endpoint or cron row evidence JSON.
- Copy exports the full scheduler endpoint/row log as readable JSON and clear removes only this terminal log, preserving scheduler backend behavior and cron row highlight colors.
- Bumped version metadata from v0.5.35 to v0.5.36 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.35 - 2026-05-26 03:18 EEST

- Added the Slice 5 B2 real-download auth handoff status snapshot under `docs/30_status_snapshots/2026-05-26/`, summarizing the implemented characterization, bridge, provider diagnostic normalization, and safe blocked diagnostics.
- Updated the status snapshot navigation so future AI/operator reviews can find the current B2 real-download handoff evidence before changing the authentication boundary.
- Preserved runtime behavior unchanged; this slice is documentation and release metadata only.
- Bumped version metadata from v0.5.34 to v0.5.35 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.34 - 2026-05-26 03:12 EEST

- Added Slice 4 safe B2 real-download diagnostics that classify blocked requests as missing auth files, skipped provider proof, failed provider proof, provider unavailable, or ambiguous download output without exposing secrets.
- Included the diagnostics in both failed and successful `/api/runtime/download/real-run` responses so the dashboard can explain the current auth/download boundary more clearly.
- Added regression coverage for passive provider-proof blocks, provider-proof failures, and accepted bridge diagnostics.
- Bumped version metadata from v0.5.33 to v0.5.34 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.33 - 2026-05-26 03:04 EEST

- Added Slice 3 runtime-download provider diagnostic normalization so B2 real-download responses identify the iCloudPD boundary as `icloudpd` instead of leaking the legacy `icloud` registry label when the evidence is iCloudPD-specific.
- Preserved unrelated provider labels by only normalizing when the B2 runtime-download evidence contains iCloudPD codes, actions, messages, or provider metadata.
- Added regression coverage for normalized iCloudPD diagnostics and for preserving unrelated provider names.
- Bumped version metadata from v0.5.32 to v0.5.33 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.32 - 2026-05-26 02:58 EEST

- Added the Slice 2 B2 real-download auth bridge so ambiguous started iCloudPD download output is accepted only when active NEW AUTH provider proof verifies the saved session.
- Preserved the strict block for passive/session-file-only NEW AUTH states and unverified provider proof.
- Normalized the bridged B2 auth projection to `icloudpd` with `auth_ready` while keeping existing NEW AUTH login and provider-proof behavior unchanged.
- Added regression coverage for verified NEW AUTH bridge acceptance and passive/unverified rejection.
- Bumped version metadata from v0.5.31 to v0.5.32 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.31 - 2026-05-26 02:47 EEST

- Added Slice 1 B2 real-download auth handoff characterization coverage, proving active NEW AUTH provider proof authenticates through `verifyNewAuthSessionForRuntimeDownload`.
- Captured the current legacy single-file download downgrade path where `icloudpd_started_unverified` maps back to blocked auth with the legacy `icloud` provider name.
- Added a skipped TODO regression assertion for Slice 2 so the backend bridge can enable verified NEW AUTH proof without trusting passive session files.
- Bumped version metadata from v0.5.30 to v0.5.31 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.30 - 2026-05-26 02:21 EEST

- Fixed the dashboard shell CSS so the sidebar/main layout can shrink without forcing the main panel off-screen on narrower browser widths.
- Added min-width/max-width guards around cards, result panels, scheduler panels, terminal surfaces, and JSON blocks so long diagnostic content scrolls inside its own surface instead of widening the whole page.
- Made scheduler target cards, CronEmulator buttons, crontab textareas, and cron endpoint/row log rows use responsive grid behavior while preserving the existing labels, endpoint log content, and row execution highlight colors.
- Bumped version metadata from v0.5.29 to v0.5.30 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.29 - 2026-05-26 02:03 EEST

- Added actual scheduler row execution evidence polling through `GET /api/init/cron/run-log`, so the View A scheduler terminal can show when CronEmulator or Raspberry crontab rows really run.
- Highlighted successful cron row calls in green and failed/unsupported row calls in red, while preserving the existing scheduler endpoint request/response log rows.
- Added backend run-log projection for Windows CronEmulator API logs and Raspberry project `full_log.log` scheduler-worker entries without exposing unrelated log contents.
- Added scheduler worker invocation logging for crontab-launched backend worker mode so Raspberry cron calls can be detected from project logs.
- Bumped version metadata from v0.5.28 to v0.5.29 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.28 - 2026-05-26 01:49 EEST

- Added the terminal-style cron endpoint live log below the scheduler target cards and above `Latest backend result`, matching the requested placement for the Windows CronEmulator controls area.
- Recorded frontend-triggered scheduler endpoint request, response, and error events for the CronEmulator controls without changing `/api/init/cron/*` backend route compatibility or scheduler semantics.
- Preserved existing scheduler buttons, target selection behavior, crontab textareas, and `Latest backend result` rendering while adding the new diagnostic log panel.
- Bumped version metadata from v0.5.27 to v0.5.28 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.27 - 2026-05-25 21:03 EEST

- Added `docs/30_status_snapshots/2026-05-25/MAIN_GOAL_IMPLEMENTATION_STATUS_20260525.md`, a code-checked main-goal implementation status table for the autonomous picture-frame goal across login, download, parsing, queueing, playback, Windows fullscreen development rendering, Raspberry production rendering, scheduler automation, monitoring, and recovery.
- Updated the status snapshot README and documentation freshness matrix so the new snapshot is discoverable as the latest v0.5.26-based implementation-status reference.
- Preserved runtime behavior, backend routes, frontend UI behavior, authentication, download, parsing, playback, scheduler behavior, and Raspberry display behavior unchanged.
- Bumped version metadata from v0.5.26 to v0.5.27 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.26 - 2026-05-25 20:39 EEST

- Added safe NEW AUTH login artifact pack generation through `POST /api/auth/new/artifacts/generate`, writing sanitized evidence under `debug_artifacts/auth/auth_attempt_<estonian_timestamp>/`.
- Added `GET /api/auth/new/artifacts` plus frontend endpoint wrappers for listing generated NEW AUTH evidence packs.
- Captured passive status, session/path metadata, raw iCloudPD stdio private-log metadata, timeline, status matrix, evidence summary, hypotheses, and redaction checks without copying raw provider output or session contents.
- Updated the canonical NEW AUTH Evidence Pack guide to describe the implemented generator endpoints and safety boundaries.
- Bumped version metadata from v0.5.25 to v0.5.26 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.25 - 2026-05-25 18:17 EEST

- Enabled local-only raw iCloudPD stdout/stderr capture for Windows `start_win.cmd` launches by default while preserving existing environment overrides.
- Updated `example.env` so new copied repo env files opt into `ICLOUDPD_RAW_STDIO_LOG=1` with the existing private `runtime_data/private_logs/icloudpd_raw_stdio.log` path.
- Preserved sanitized API/UI/Event history behavior; raw provider output remains local private runtime evidence and is not exposed through normal auth routes.
- Bumped version metadata from v0.5.24 to v0.5.25 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.24 - 2026-05-25 17:56 EEST

- Added project-local skills `.codex/skills/icloudpd-login` and `.codex/skills/new-auth-login-monitor` for iCloudPD authentication guidance and NEW AUTH login monitoring workflows.
- Reviewed both added skill folders for GitHub safety and confirmed no hardcoded passwords, tokens, cookie values, API keys, or other credential material are present.
- Bumped version metadata from v0.5.23 to v0.5.24 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.23 - 2026-05-25 02:36 EEST

- Added an AI-first documentation navigation rule to `AGENTS.md` so agents read the closure report, documentation index, freshness matrix, reorganization plan, and link audit before trusting or changing docs.
- Documented the canonical numbered documentation folders and the rule that old categorized docs, compatibility pointers, TODOs, specs, backlog, and archive material are not current implementation truth without code/test/evidence verification.
- Bumped version metadata from v0.5.22 to v0.5.23 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.22 - 2026-05-14 04:10 Tallinn

- Added an opt-in raw-sensitive iCloudPD stdout/stderr capture sink gated by `ICLOUDPD_RAW_STDIO_LOG=1`.
- Isolated raw iCloudPD output under `runtime_data/private_logs/icloudpd_raw_stdio.log` by default and rejected configured raw log paths outside `runtime_data`.
- Preserved sanitized dashboard/API/Event history behavior; raw provider output is never returned through normal UI or API paths by default.
- Added focused regression coverage for disabled-by-default behavior, runtime_data path isolation, and opt-in raw capture from both provider and NEW AUTH interactive flows.
- Bumped version metadata from v0.5.21 to v0.5.22 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.21 - 2026-05-13 17:57 Tallinn

- Added dashboard request/response correlation ids to the shared frontend API client, HTTP request headers, echoed backend response headers, transit terminal lines, captured metadata, and Event history request/response detail rows.
- Added a dedicated sanitized `logindebug.log` sink for `/api/auth/*` traffic, including `1A-STASH-OFF NEW AUTH` request, response, and failure diagnostics without raw cookies, passwords, tokens, sessions, or submitted 2FA values.
- Stopped tracking generated `conf/runtime-truth.json` runtime state while preserving the local ignored file.
- Added focused regression coverage for request id propagation, Event history id display, backend header echoing, project logger file creation, and sanitized NEW AUTH login debug mirroring.
- Bumped version metadata from v0.5.20 to v0.5.21 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.20 - 2026-05-12 20:55 Tallinn

- Implemented Windows B4 browser-native playback rendering for the selected backend media item.
- Added the read-only `GET /api/runtime/playback/media` media stream endpoint with extension and path allow-list checks.
- Wired selected playback items to a safe media URL so the preview panel can render images/videos after B4 selects an item.
- Enabled the existing fullscreen rendering mode to request browser fullscreen on the Windows playback preview stage; pressing Esc exits fullscreen while playback state remains selected.
- Kept Raspberry OS rendering disabled/planned and preserved backend playback selection semantics.
- Added regression coverage for Windows preview/fullscreen markup and media URL projection.
- Bumped version metadata from v0.5.19 to v0.5.20 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.19 - 2026-05-12 18:39 Tallinn

- Updated `start_win.cmd` so it runs `npm run build` after dependency checks/install and before launching `npm run api`.
- The Windows launcher now stops before starting the API server if the production build fails.
- Bumped version metadata from v0.5.18 to v0.5.19 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.18 - 2026-05-12 18:34 Tallinn

- Updated current implementation/status documentation to reflect the completed NEW AUTH passive skipped-proof UX, active `Verify with iCloudPD` provider-proof action, and Slice 3 regression/redaction coverage.
- Added `docs/IMPLEMENTATION_STATUS_UPDATE_20260512_NEW_AUTH_PROVIDER_VERIFICATION.md` as the latest status update report for the Slice 1-3 login reconciliation work.
- Updated categorized status docs so local session files remain evidence only, passive status remains read-only, active provider proof uses `GET /api/auth/new/status`, and install verification remains separate from session proof.
- Updated README, HOW_TO_RUN, and documentation indexes with the v0.5.18 status-doc refresh.
- Bumped version metadata from v0.5.17 to v0.5.18 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.17 - 2026-05-12 18:21 Tallinn

- Slice 3: added focused NEW AUTH provider-verification UX regression coverage and operator documentation.
- Verified that passive skipped-proof status renders actionable copy, keeps `GET /api/auth/new/status?mode=passive` read-only, and leaves active provider proof on `GET /api/auth/new/status`.
- Added transit/logging coverage proving the active provider-verification action uses the shared frontend API client instead of bypassing request logging.
- Added redaction coverage for provider communication shown through the NEW AUTH modal/history path.
- Documented the distinction between `Verify iCloudPD install`, passive `Check login`, and active `Verify with iCloudPD`.
- Bumped version metadata from v0.5.16 to v0.5.17 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.16 - 2026-05-12 17:58 Tallinn

- Slice 2: added the NEW AUTH `Verify with iCloudPD` provider-session proof action for the passive skipped-provider-proof state.
- Wired `new-auth-verify-provider-session` through the existing runtime-truth action map and shared `requestJson`/event-history request path, targeting active `GET /api/auth/new/status` instead of passive `GET /api/auth/new/status?mode=passive`.
- Preserved existing passive check-login semantics, iCloudPD install verification, login/2FA flow, backend endpoint contracts, and secret redaction behavior.
- Added regression coverage for the new active provider-proof action, button metadata, initial state/action compatibility, and View A rendering.
- Bumped version metadata from v0.5.15 to v0.5.16 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.15 - 2026-05-12 17:33 Tallinn

- Slice 1: mapped `NEW_AUTH_PROVIDER_PROOF_SKIPPED` passive new-auth status into a clear actionable UI state instead of a vague pending state.
- The NEW AUTH card now shows `Session files found, provider verification not run yet.` with explanatory copy telling the user that passive status did not contact iCloudPD.
- Preserved passive status semantics: `GET /api/auth/new/status?mode=passive` still does not start provider proof, backend contracts are unchanged, and displayed provider/auth data remains sanitized.
- Added/updated regression coverage for the passive skipped-provider-proof state projection.
- Bumped version metadata from v0.5.14 to v0.5.15 in `VERSION`, `package.json`, and `package-lock.json`.

## 0.5.14 - 2026-05-12 17:23 Tallinn

- Added root `start_win.cmd` Windows launcher according to the default project setup expectation.
- The launcher checks for `node` and `npm`, installs dependencies with `npm install --verbose` when `node_modules` is missing, then opens separate terminals for `npm run api` and `npm run dev`.
- Bumped version metadata from v0.5.13 to v0.5.14 in `VERSION`, `package.json`, and `package-lock.json`.
- Preserved existing package scripts and runtime behavior; the new script is an additive Windows convenience entrypoint.

## 0.5.13 - 2026-05-12 16:00 Tallinn

- **Wave 2 – Read‑only runtime projections**. Added a live runtime projection endpoint to the backend, wired the dashboard to fetch the projection, and provided safe preload behaviour:
  - Added `projectionLive` to `RUNTIME_EXECUTION_ENDPOINTS` and a `getRuntimeLiveProjection()` helper in `dashboard/services/runtimeExecutionService.ts`.
  - Added `runtimeLiveProjectionHandler` and route `'GET /api/runtime/projection/live'` to `server/index.ts`, assembling a combined `LiveRuntimeProjection` with field provenance labels.
  - Added `loadLiveRuntimeProjection()` to the runtime‑truth demo actions and a `refresh-running-process` action dispatch in `runtimeTruthBehavior.ts`.
  - Modified `app.ts` to run safe preloads on first entry to View A and to refresh last‑run and running‑process data when switching to views C and D, respectively.
  - Updated the running process view to support both mock preview and live monitor modes with dynamic hero copy, badges, controls and log titles.
  - Bumped the project version to 0.5.13 and updated `VERSION`, `package.json` and `package-lock.json` accordingly.


## 2026-05-12 15:50 Tallinn

- Added `docs/RUNTIME_TRUTH_AUTHORITY_MAP_20260512.md` capturing the final runtime truth authority model.  The document codifies that SQLite is the durable source of truth, lock files are for process coordination only, logs are for audit/debugging, `conf/runtime‑truth.json` is a non‑authoritative projection, front‑end local state is transient and backend projections must declare field sources.  It provides view‑specific guidance and recommended next slices without changing any behaviour.
- Added `shared/runtimeProjectionContracts.ts` defining runtime projection source enums, runtime namespaces, a generic `RuntimeField<T>` wrapper, and high‑level contracts for worker health, last‑run, playback, screen and live runtime projections.  These TypeScript contracts are framework‑agnostic and do not implement any runtime logic.
- Added `tests/runtimeProjectionContracts.test.js` verifying that the runtime projection sources and namespaces are exported correctly and contain all expected values.
- Updated `docs/main_readme.md` to link to the new runtime truth authority map document.
- This documentation and contract slice does not alter runtime, frontend or backend behaviour, and does not bump package versions.

## 2026-05-12 14:16 Tallinn

- Added `docs/IMPLEMENTATION_GOAL_STATUS_RECONCILIATION_20260512.md` as a canonical reconciliation of implementation goals, current statuses, unresolved questions and conflicts.  The document consolidates existing status docs, harmonises status vocabulary and provides a recommended implementation order without changing runtime behaviour.
- Updated `docs/main_readme.md` to link to the new reconciliation document.
- This documentation update does not bump the repository version or modify any code.

## 0.5.12 - 2026-05-10 23:08 Tallinn

- Fixed `B2-REAL_DOWNLOAD` backend auth gating to use the same NEW AUTH provider-proof session model as `/api/auth/new/status`.
- Preserved the dedicated `POST /api/runtime/download/real-run` route, batch selector behavior, and existing B2 mock/test download action.
- Added regression tests for missing NEW AUTH session blocking and provider-proof-authenticated runtime gate success.

## 0.5.11 - 2026-05-10 21:37 Tallinn

- Added a View B `B2-REAL_DOWNLOAD` companion action beside the existing B2 test download action.
- Added `POST /api/runtime/download/real-run` as a dedicated authenticated real iCloudPD download route with safe batch-size normalization.
- Added a frontend selector for real-download batch size and guarded the action behind known authenticated session state while preserving backend verification.
- Preserved existing B2 mock/test download behavior at `POST /api/runtime/download/run`.
- Tests run: `npm test -- --test-reporter=spec tests/runtimeExecutionService.test.js tests/authIcloudpdProvider.test.js tests/viewB.buttonWorkflow.test.js`.


## 0.5.10 - 2026-05-10 20:50 Tallinn

- Restored `TRANSFERABLE_REPO_PACKAGER.cmd` as a tracked repo utility.
- Kept `zip_ignore.json` as a local-only archive ignore configuration by adding it to `.gitignore`.
- Removed the stale local `dashboard/inspect/guideCopy.json` artifact from the working tree; current inspect copy remains sourced from `dashboard/inspect/guideCopy.ts` and split modules.

## 0.5.9 - 2026-05-10 20:10 Tallinn

- Slice 9: extracted the runtime status route family into `server/routes/runtimeStatusRoutes.ts`.
- Files changed: `server/index.ts`, `server/routes/runtimeStatusRoutes.ts`, `tests/runtimeStatusRoutesCompatibility.test.js`, `VERSION`, `package.json`, `package-lock.json`, and `CHANGELOG.md`.
- Behavior preserved: `/api/runtime/orchestration/current` and `/api/runtime/orchestration/last` keep the same HTTP methods, paths, handlers, response shapes, and status behavior.
- Tests run: focused runtime status route compatibility test command attempted; typecheck compared against the Slice 7 baseline and Slice 8 state.
- Known remaining pre-existing failures: baseline typecheck is blocked by missing Node type definitions in this environment; focused tests are blocked because `tsx` is unavailable.

## 0.5.8 - 2026-05-10 20:05 Tallinn

- Slice 8: extracted the inspection route family into `server/routes/inspectionRoutes.ts`.
- Files changed: `server/index.ts`, `server/routes/inspectionRoutes.ts`, `tests/inspectionRoutesCompatibility.test.js`, `docs/active_workflow_docs/slice_8_9_route_selection.md`, `VERSION`, `package.json`, `package-lock.json`, and `CHANGELOG.md`.
- Behavior preserved: `/api/version` and `/api/init/verify-env` keep the same HTTP methods, paths, handlers, response shapes, and status behavior.
- Tests run: focused inspection route compatibility test command attempted; typecheck compared against the Slice 7 baseline.
- Known remaining pre-existing failures: baseline typecheck is blocked by missing Node type definitions in this environment.

## 0.5.7 - 2026-05-10 19:21 Tallinn

- Extracted the runtime-truth and pipeline lock maintenance route handlers into `server/routes/runtimeTruthRoutes.ts`.
- Preserved `/api/runtime-truth`, `/api/runtime/pipeline/issues/detect`, and `/api/runtime/pipeline/stale-locks/clear` endpoint paths, methods, response envelopes, and persisted runtime-truth file behavior.
- Bumped version metadata from v0.5.6 to v0.5.7.

## 0.5.6 - 2026-05-10 19:05 Tallinn

- Extracted the runtime screen-simulation route handlers and private simulation state into `server/routes/screenSimulationRoutes.ts`.
- Preserved the existing `/api/runtime/screen-simulation/state` and `/api/runtime/screen-simulation/configure` endpoints, response shapes, validation errors, and simulation-only hardware boundary.
- Bumped version metadata from v0.5.5 to v0.5.6.

## 0.5.5 - 2026-05-10 19:00 Tallinn

- Refactored the scheduler and CronEmulator route-key table into `server/routes/schedulerRoutes.ts` while preserving all existing endpoint paths, HTTP methods, and handler wiring.
- Added a scheduler route compatibility test that pins the extracted route family to the legacy route keys.
- Preserved `server/index.ts` request parsing, middleware flow, response handling, scheduler behavior, and cron emulator behavior.


## 2026-05-28 10:22 EEST — v0.7.4

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-05-28 10:22 EEST — v0.7.3

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-05-28 10:21 EEST — v0.7.2

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-05-28 10:20 EEST — v0.7.1

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-05-28 10:20 EEST — v0.7.0

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-05-10 18:50 EEST — v0.5.4

### Added
- Added focused internal NEW AUTH helper modules for shared types, constants, command execution, path/session metadata, sanitization, and structured event shaping.

### Changed
- Refactored `server/auth/newAuthService.ts` into a smaller compatibility facade while preserving NEW AUTH endpoint/service behavior.
- Bumped version metadata from v0.5.3 to v0.5.4.

### Fixed
- None

### Removed
- None

## 2026-05-10 18:46 EEST — v0.5.3

### Added
- Added dedicated renderer utility and modal renderer modules while preserving the existing dashboard renderer compatibility entrypoint.

### Changed
- Extracted modal-specific rendering from `dashboard/services/renderers.ts` into a focused renderer module.
- Bumped version metadata from v0.5.2 to v0.5.3.

### Fixed
- None

### Removed
- None

## 2026-05-10 17:56 EEST — v0.5.2

### Added
- Added checked-in Windows CronEmulator entrypoint files for `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker`.

### Changed
- Updated the default Windows CronEmulator crontab to call the three worker entrypoint files instead of inline placeholders or inline screen-simulation commands.
- Reused shared Raspberry cron row constants for all three scheduler workers while preserving the existing Raspberry disabled/planned UI target state.

### Fixed
- Kept `regular_stage_worker` scoped to B3.1-B3.5 in its entrypoint and left current playable item selection in `playback_worker`.

### Removed
- None

## 2026-05-10 17:38 EEST — v0.5.2

### Added
- Added documentation clarification that B3.5 owns queue preparation/building and `playback_worker` is the final worker-stage action that selects the current playable item from prepared playback state.

### Changed
- Reconciled B4 playback, placeholder, README, and code-verified status docs so they do not overclaim real preview/fullscreen rendering, Raspberry OS rendering, queue building inside `playback_worker`, or live Windows CronEmulator execution proof.
- Updated version metadata from v0.5.1 to v0.5.2.

### Fixed
- Corrected stale documentation wording that could imply `playback_worker` prepares/builds the queue or that CronEmulator vendoring proves live scheduler execution.

### Removed
- None

## 2026-05-10 17:00 EEST — v0.5.1

### Added
- Vendored CronEmulator under `tools/CronEmulator` as normal tracked repository files instead of an implicit nested Git repository.
- Added a tracked `crontab_emulated.example.txt` template and pytest configuration for local CronEmulator tests.

### Changed
- Updated ignore rules so CronEmulator runtime crontab, logs, caches, bytecode, and virtualenvs stay out of Git.
- Bumped version metadata from v0.5.0 to v0.5.1.

### Fixed
- None

### Removed
- Removed the root Git gitlink dependency for `tools/CronEmulator`.

## 2026-05-10 16:52 EEST — v0.5.0

### Added
- Added a code-verified B4 playback flow closure/status document covering Run, route, worker, scheduler command, rendering controls, and remaining placeholders.
- Added a focused documentation guard to prevent the B4 status document from overclaiming real preview/fullscreen or Raspberry display support.

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-05-10 16:47 EEST — v0.5.0

### Added
- Added shared scheduler playback-worker command constants for Windows CronEmulator and Raspberry cron.
- Added focused scheduler command tests proving both platform rows reach `npm run api -- --scheduler playback-worker`.

### Changed
- Updated the View A Windows CronEmulator default install crontab so B4 playback uses the Slice 3 backend playback-worker entrypoint instead of `/path/to/playback_worker`.
- Kept Raspberry cron generation aligned with the same shared playback-worker command.
- Kept Node test/server-side initial scheduler rendering Windows-first while preserving browser platform detection in real frontend rendering.

### Fixed
- Fixed the parent-repo scheduler wiring gap where the Windows CronEmulator default textarea still contained a playback_worker placeholder.

### Removed
- None

## 2026-05-10 16:42 EEST — v0.5.0

### Added
- Added a backend playback selection service shared by the B4 HTTP route and the new playback_worker entrypoint.
- Added playback_worker single-run execution with a scheduler status file, worker lock file, selected-item evidence, skipped reasons, and failure reasons.
- Added focused playback_worker tests for selected, skipped, lock-conflict, route-payload-preservation, and no-rendering/no-B3/no-B5 boundaries.

### Changed
- Reused the shared Stage 6 selection service from `POST /api/runtime/playback/select-current` without changing the route path or successful/error response behavior.
- Added `--scheduler playback-worker` dispatch so scheduled playback commands no longer start the HTTP server by default.

### Fixed
- Closed the placeholder gap where the scheduled playback worker command was present in crontab text but had no backend worker dispatch path.

### Removed
- None

## 2026-05-10 16:35 EEST — v0.5.0

### Added
- Added B4 rendering mode controls for playback without rendering, preview rendering, and fullscreen rendering.
- Added Windows and disabled Raspberry OS rendering tabs for B4 while preserving backend playback selection behavior.
- Added focused View B tests for disabled-before-run, failed-run gating, successful-run enablement, and unchanged select-current endpoint wiring.

### Changed
- Connected the B4 UI to the shared playback renderer contract from Slice 1 without adding rendering dependencies or backend worker behavior.

### Fixed
- None

### Removed
- None

## 2026-05-10 16:24 EEST — v0.5.0

### Added
- Added a B4 playback rendering contract service that defines the default no-rendering mode, Windows/Raspberry rendering targets, and one shared browser-native renderer abstraction for future preview-window and fullscreen modes.
- Added focused tests for B4 rendering defaults, disabled preview/fullscreen gating, state normalization, and shared renderer identity.

### Changed
- Updated version metadata from v0.4.5 to v0.5.0.

### Fixed
- None

### Removed
- None

## 2026-05-10 15:59 EEST — v0.4.5

### Added
- Added project-local component sync verification and component communication smoke-test Codex skills.

### Changed
- Updated version metadata from v0.4.4 to v0.4.5.

### Fixed
- None

### Removed
- None

## 2026-05-10 15:55 EEST — v0.4.4

### Added
- Added project-local runtime worker implementation, worker verification, runtime service extraction, worker documentation reconciliation, and screen hardware contract Codex skills.

### Changed
- Updated version metadata from v0.4.3 to v0.4.4.

### Fixed
- None

### Removed
- None

## 2026-05-10 15:34 EEST — v0.4.3

### Added
- Added confirmation before NEW AUTH local iCloudPD session-file removal.
- Added regression coverage for read-only unknown NEW AUTH 2FA prompts and frontend submission guards.

### Changed
- Changed NEW AUTH unknown iCloudPD 2FA prompts to wait for a visible provider prompt before rendering a response input.
- Updated NEW AUTH 2FA submission handling to trim input and cancel empty submissions before calling the backend.
- Updated version metadata from v0.4.2 to v0.4.3.

### Fixed
- Fixed the operator path where an SMS code could be submitted while iCloudPD had not yet exposed whether it needed a device index or a six-digit code.

### Removed
- None.

## 2026-05-08 11:24 EEST — v0.4.2

### Added
- Added sanitized iCloudPD provider communication lines to the NEW AUTH split-modal terminal panel.
- Added focused regression coverage for terminal panel waiting state, provider preview rendering, and frontend secret/code redaction.

### Changed
- Updated NEW AUTH modal state passing so only safe provider preview text reaches the right-side communication panel.
- Updated version metadata from v0.4.1 to v0.4.2.

### Fixed
- Fixed the NEW AUTH communication panel appearing empty while sanitized provider output is available.

### Removed
- None.

## 2026-05-08 07:25 EEST — v0.4.1

### Added
- Added View B pipeline maintenance controls for detecting pipeline issues and clearing stale pipeline locks.
- Added backend runtime pipeline maintenance endpoints for stale persisted pipeline lock detection and cleanup.
- Added regression coverage for stale-lock helper behavior, endpoint constants, View B button placement/action wiring, and inspect metadata drift.

### Changed
- Updated View B inspect, real-vs-mock, backend-status, current-status, and placeholder documentation for the new pipeline maintenance controls.
- Updated version metadata from v0.4.0 to v0.4.1.

### Fixed
- Fixed the stale B3.2 pipeline-lock recovery path by allowing operators to detect stale persisted lock state before clearing only stale locks.
- Fixed inspect metadata coverage for the new pipeline maintenance buttons so they do not fall back to generic control copy.

### Removed
- None.

## 2026-05-08 07:11 EEST — v0.4.0

### Added
- Added a split NEW AUTH modal communication panel with separate status, prompt, and instruction surfaces plus regression coverage for modal prompt copy.
- Added the source-of-truth Codex skill for classifying repository truth claims, runtime evidence, target specifications, documentation-derived status, and unknown implementation state.
- Added the photo-frame event history triage Codex skill with an analyzer script for classifying scheduler, CronEmulator, pipeline lock, mock download, runtime truth, and nested failure evidence.

### Changed
- Changed scheduler GET target requests to send the selected scheduler target as query parameters aligned with the backend route contract.
- Updated version metadata from v0.3.61 to v0.4.0.

### Fixed
- Fixed View A scheduler GET control request construction so selected targets are preserved through frontend service calls and covered by button workflow regression tests.

### Removed
- None.

## 2026-05-08 05:59 EEST — v0.3.61

### Added
- Added Windows 11 CronEmulator control endpoints for checking, starting, stopping, installing a crontab, and reading the active crontab.
- Added View A 3A CronEmulator controls with login-style status circles, centralized scheduler button status copy, and terminal-style crontab textareas.
- Added regression coverage for CronEmulator endpoint crontab install/read behavior and View A CronEmulator button ordering, status circles, and textarea update rules.

### Changed
- Changed the Windows scheduler panel to expose `Check emulator scheduler`, `Run emulator`, `Stop emulator`, `Install crontab`, and `Get active crontab` controls.
- Updated version metadata from v0.3.60 to v0.3.61.

### Fixed
- Wired the Windows scheduler controls to real CronEmulator backend actions instead of leaving the new emulator operations as UI-only controls.

### Removed
- None.

## 2026-05-08 02:49 EEST — v0.3.60

### Added
- Added regression coverage proving passive NEW AUTH status does not classify active provider output or expose live 2FA prompts.
- Added route-level coverage proving `/api/auth/new/status?mode=passive` does not start provider proof.

### Changed
- Changed passive NEW AUTH status handling so passive checks are enforced before active-attempt inspection and provider proof.
- Updated Slice 4 two-factor diagnostics tests to use an injected fake provider process instead of platform-specific shell scripts.
- Updated version metadata from v0.3.59 to v0.3.60.

### Fixed
- Prevented the `Check login` passive status path from reading active iCloudPD output or triggering provider proof that could advance real provider authentication.

### Removed
- None.

## 2026-05-08 02:35 EEST — v0.3.59

### Added
- Added repo-level source comment discipline in `AGENTS.md` for future source-file edits.

### Changed
- Updated version metadata from v0.3.58 to v0.3.59.

### Fixed
- None.

### Removed
- None.

## 2026-05-08 02:32 EEST — v0.3.58

### Added
- Added regression coverage proving passive NEW AUTH status does not spawn provider proof.

### Changed
- Changed the NEW AUTH `Check login` button to call passive status mode so it observes current login/session state without starting provider authentication.
- Clarified button copy and operator docs that `Check login` is passive.
- Updated version metadata from v0.3.57 to v0.3.58.

### Fixed
- Prevented the dashboard `Check login` action from starting an `icloudpd` provider-proof subprocess.

### Removed
- None.

## 2026-05-08 02:25 EEST — v0.3.57

### Added
- Added regression coverage for NEW AUTH button-state recalculation after logged-out status and executable-readiness results.

### Changed
- Recalculated NEW AUTH button circles on action start and backend result so session-dependent login/check-login status cannot stay stale.
- Updated version metadata from v0.3.56 to v0.3.57.

### Fixed
- Cleared stale green login/check-login circles after logout or logged-out status while preserving iCloudPD verification as readiness-only.

### Removed
- None.

## 2026-05-06 16:35 EEST — v0.3.56

### Added
- Added docs-only closure update after NEW AUTH Slice 10 to align implementation-status, operator, backlog, and auth/pipeline docs with the completed new-auth endpoint family.
- Documented that NEW AUTH uses only `/api/auth/new/*` endpoints for the new card/control family.
- Documented visible two-factor prompts: `ENTER 6-DIGIT CODE` and `ENTER DEVICE INDEX (A)`.

### Changed
- Updated current-status docs so local session files alone are no longer described as authenticated.
- Clarified that `authenticated` requires provider proof or stronger test-download proof.
- Updated backlog wording so NEW AUTH Slices 1–10 are no longer tracked as unfinished implementation work.
- Clarified that View C has a backend last-run read path but restore/resume remains placeholder or decision-gated.
- Updated version metadata from v0.3.55 to v0.3.56.

### Fixed
- Removed stale status wording that said provider proof was still future work for NEW AUTH.
- Reconciled docs with the completed 2FA, login, logout, and test-download proof endpoint family.

### Removed
- None.

## 2026-05-06 15:00 EEST — v0.3.50

### Added
- Added NEW AUTH Slice 5 interactive 2FA submission flow.
- Added validation for six‑digit verification codes and single‑letter device indices.
- Added new error codes `NEW_AUTH_INVALID_2FA_CODE`, `NEW_AUTH_INVALID_2FA_DEVICE_INDEX`, and `NEW_AUTH_NO_ACTIVE_2FA_CHALLENGE` for 2FA submission failures.

### Changed
- Disabled fallback login spawn for two‑factor submissions; submissions now require an active login attempt.
- Updated `/api/auth/new/submit-2fa` to return HTTP 400 for invalid or missing input and HTTP 409 for other errors.
- Updated version metadata from v0.3.49 to v0.3.50.

### Fixed
- Prevented two‑factor submissions from starting a new login when no active challenge exists.
- Ensured six‑digit code length is enforced and device index is validated before forwarding to the provider.

### Removed
- None.

## 2026-05-06 15:10 EEST — v0.3.51

### Added
- Added NEW AUTH Slice 6 real login flow using `.env` credentials through the backend service.
- Added structured login states and reason codes for login start, `requires_2fa`, `authenticated`, `failed`, and `unverified`.

### Changed
- Ensured that the login process reads configured `.env` values and does not expose the password in event messages or logs.
- Updated version metadata from v0.3.50 to v0.3.51.

### Fixed
- None.

### Removed
- None.

## 2026-05-06 15:20 EEST — v0.3.52

### Added
- Added NEW AUTH Slice 7 safe logout flow that counts removed session files and reports removal results.

### Changed
- Updated `/api/auth/new/logout` to return `removedFileCount` and `skippedFileCount` in the details payload.
- Ensured logout only deletes the configured session directory and refuses unsafe paths.
- Updated version metadata from v0.3.51 to v0.3.52.

### Fixed
- Prevented session cleanup from leaving behind stale session files by recreating the directory after deletion.

### Removed
- None.

## 2026-05-06 15:30 EEST — v0.3.53

### Added
- Added NEW AUTH Slice 8 test-download proof endpoint. A new backend route `/api/auth/new/test-download` verifies an authenticated session and returns success if the session is valid.
- Added a frontend service method `runNewAuthTestDownload` to trigger the test-download proof.

### Changed
- Registered the new endpoint in the server router and new auth routes, and updated the new auth service endpoint map.
- Updated version metadata from v0.3.52 to v0.3.53.

### Fixed
- None.

### Removed
- None.

## 2026-05-06 15:40 EEST — v0.3.54

### Added
- Added NEW AUTH Slice 9 UI and event-history hardening. Improved button state transitions and clarified prompts for 2FA and login flows.
- Added structured diagnostics in event history to surface operations, endpoints, reason codes, provider proof, user prompts, and content flags to the user.

### Changed
- Enhanced UI copy to clearly explain provider installation, local session state, provider proof, 2FA requirements, authenticated state, logged-out state, and test-download results.
- Updated version metadata from v0.3.53 to v0.3.54.

### Fixed
- None.

### Removed
- None.

## 2026-05-06 15:50 EEST — v0.3.55

### Added
- Added NEW AUTH Slice 10 final audit and closure. Completed all remaining slices and documentation updates for the new authentication system.
- Added a final audit report describing the endpoints, states, safety considerations, and usage guidelines.

### Changed
- Verified that all NEW AUTH controls call only `/api/auth/new/*` endpoints and that old auth endpoints remain intact.
- Audited secret safety to ensure passwords, two‑factor codes, cookies, and session contents are never exposed in logs, UI, or tests.
- Audited authentication truth: sessions are authenticated only after provider proof or test‑download proof; local session files alone are never trusted.
- Updated version metadata from v0.3.54 to v0.3.55.

### Fixed
- None.

### Removed
- None.

## 2026-05-06 14:46 EEST — v0.3.49

### Added
- Added NEW AUTH Slice 4 provider-proof 2FA diagnostics so provider output that reaches a two-factor prompt is classified as `NEW_AUTH_PROVIDER_REQUIRES_2FA`.
- Added visible user action prompts for 2FA-required responses: `ENTER 6-DIGIT CODE` and `ENTER DEVICE INDEX (A)`.
- Added regression coverage for 2FA-vs-timeout classification, prompt extraction, and visible prompt rendering outside raw JSON.

### Changed
- Changed `/api/auth/new/status` classification priority so 2FA provider prompts win over generic timeout when both are present.
- Updated version metadata from v0.3.48 to v0.3.49.

### Fixed
- Fixed misleading status diagnostics where iCloudPD output clearly requested 2FA but the UI primarily reported a provider-proof timeout.
- Preserved sanitized provider previews and secret/session redaction while exposing only safe prompt metadata.

### Removed
- None.

## 2026-05-06 12:58 EEST — v0.3.48

### Added
- Added NEW AUTH Slice 3 provider-proof status verification for saved local iCloudPD sessions.
- Added regression coverage proving local session files are not promoted to authenticated without provider verification.

### Changed
- Changed `/api/auth/new/status` so session-like files now report `unverified` unless iCloudPD provider proof verifies the session.
- Updated version metadata from v0.3.47 to v0.3.48.

### Fixed
- Removed the temporary Slice 2 message that treated local session files as authenticated until provider proof existed.
- Redacted provider-proof command paths and secret-adjacent values from status diagnostics.

### Removed
- None.

## 2026-04-29 16:24 EEST — v0.3.47

### Added
- Completed NEW AUTH Slice 3 endpoint handlers for real login, 2FA submission, and local session cleanup under the new /api/auth/new/* route family.
- Added safe iCloudPD login command execution using .env values, pending-2FA state detection, 2FA stdin submission support, and deterministic non-secret Slice 3 verification coverage.

### Changed
- Replaced Slice 2 placeholder handlers for /api/auth/new/login, /api/auth/new/submit-2fa, and /api/auth/new/logout with structured backend behavior.
- Updated version metadata from v0.3.46 to v0.3.47.

### Fixed
- Added local-session cleanup path safety checks so logout refuses broad or unsafe directories.

### Removed
- None.

## 2026-04-29 16:15 EEST — v0.3.46

### Added
- Added NEW AUTH Slice 2 backend route family for `1A-STASH-OFF` using new `/api/auth/new/*` endpoints only.
- Added safe iCloudPD executable verification, structured real session-status inspection, and session path/file metadata inspection.
- Added `tests/newAuthSlice2.verify.mjs` to verify route registration, missing/executable iCloudPD handling, structured status responses, and session-file secrecy.

### Changed
- Wired the Slice 1 frontend helper to avoid sending JSON bodies on GET-only NEW AUTH endpoints.
- Registered safe Slice 3 placeholder responses for login, 2FA submit, and logout under the new endpoint family without aliasing old auth routes.
- Updated version metadata from v0.3.45 to v0.3.46.

### Fixed
- Prevented NEW AUTH command verification timers and child-process handles from keeping verification scripts alive after checks complete.

### Removed
- None.


## 2026-04-29 15:50 EEST — v0.3.45

### Added
- Added Slice 1 NEW AUTH View A card `1A-STASH-OFF` with five frontend actions, per-button status circles, explanatory status text, and a login modal shell with 2FA input.
- Added new frontend-only API helper functions targeting only `/api/auth/new/*` endpoint paths.
- Added runtime-truth state/action wiring for the new card without reusing existing auth/login endpoints.

### Changed
- Extended inspect metadata and auth-button status copy for the new auth controls.
- Added blinking yellow running/pending status styling and row-level status text styling for the new auth card.
- Updated version metadata from v0.3.44 to v0.3.45.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 14:10 EEST — v0.3.44

### Added
- Added final Slice 17 closure boundary contracts for dashboard shared constants and inspect-guide JSON exports.
- Added a closure audit record for the function-boundary typing migration.

### Changed
- Updated version metadata from v0.3.43 to v0.3.44.
- Preserved existing runtime values, UI copy, route behavior, auth behavior, scheduler semantics, database behavior, and runtime stage ordering.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 14:10 EEST — v0.3.43

### Added
- Added Slice 16 function boundary types for runtime-truth persistence and inspect-mode summary helper contracts.

### Changed
- Added named persistence endpoint/payload contracts and inspect summary metadata contracts without changing runtime behavior, endpoint payloads, UI labels, auth behavior, scheduler semantics, or database behavior.
- Updated version metadata from v0.3.42 to v0.3.43.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 14:09 EEST — v0.3.42

### Added
- Added Slice 15 function boundary types for runtime-truth scheduler, auth-button, truth-seed, and database-viewer state helper contracts.

### Changed
- Added named runtime-truth state helper types and explicit return types without changing runtime behavior, endpoint payloads, UI labels, scheduler semantics, or database behavior.
- Updated version metadata from v0.3.41 to v0.3.42.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 14:01 EEST — v0.3.41

### Added
- Added Slice 13+14 function boundary types for remaining database service result boundaries and low-risk server-side tooling scripts.

### Changed
- Replaced repeated inline database runtime result return shapes with named local interfaces and added JSDoc helper contracts to server-side maintenance scripts without changing runtime behavior.
- Updated version metadata from v0.3.40 to v0.3.41.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 13:44 EEST — v0.3.40

### Added
- Added Slice 11+12 TypeScript function boundary types for runtime stage orchestration and server route-adjacent helper boundaries.

### Changed
- Added named request context, handler result, environment check, runtime truth, media collection, database viewer logging, scheduler payload, and orchestration state contracts without changing endpoint payloads, scheduler semantics, or runtime stage ordering.
- Updated version metadata from v0.3.39 to v0.3.40.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 13:05 EEST — v0.3.39

### Added
- Added Slice 9+10 TypeScript function boundary types for database persistence, project logging, and scheduler host runtime boundaries.

### Changed
- Added named database service, SQLite bridge, logger, scheduler status, lock, and log-entry contracts without changing SQL behavior, scheduler semantics, endpoint payloads, or runtime stage ordering.
- Updated version metadata from v0.3.38 to v0.3.39.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:56 EEST — v0.3.38

### Added
- Added Slice 7+8 TypeScript function boundary types for auth domain, auth routes, auth persistence, auth session resume, icloudpd provider, provider registry, process runner, and sanitizer modules.

### Changed
- Added named auth/provider/session/icloudpd contracts without changing auth endpoint payload shapes, provider behavior, secret redaction behavior, or icloudpd command construction semantics.
- Updated version metadata from v0.3.37 to v0.3.38.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:37 EEST — v0.3.37

### Added
- Added Slice 6 JSDoc function boundary types for low-risk JavaScript test helpers.

### Changed
- Added explicit DOM fixture, fetch stub, and transit record test helper types without changing test assertions or production behavior.
- Updated version metadata from v0.3.36 to v0.3.37.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:27 EEST — v0.3.36

### Added
- Added Slice 5 TypeScript function boundary types for the inspect guide tooltip controller.

### Changed
- Added explicit controller dependency, public controller API, tooltip detail, and DOM element group types without changing inspect-mode tooltip behavior or visible UI copy.
- Updated version metadata from v0.3.35 to v0.3.36.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:19 EEST — v0.3.35

### Added
- Added Slice 4 TypeScript function boundary types for dashboard renderer helpers and the transit terminal service.

### Changed
- Added explicit render input, modal, transport, log/history, step-list, transit record, and terminal API types without changing rendered HTML strings or transit formatting behavior.
- Updated version metadata from v0.3.34 to v0.3.35.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 12:08 EEST — v0.3.34

### Added
- Added Slice 3 TypeScript function boundary types for runtime-truth persistence and top-level runtime-truth state service entrypoints.

### Changed
- Added explicit listener, mutator, persistence dependency, persistence API, queue option, and runtime action payload types without changing runtime behavior.
- Updated version metadata from v0.3.33 to v0.3.34.

### Fixed
- None.

### Removed
- None.


## 2026-04-29 11:55 EEST — v0.3.33

### Added
- Added Slice 2 TypeScript function boundary types for runtime-truth action utility helpers and duplicate-action guard helpers.

### Changed
- Added explicit parameter and return types around existing runtime-truth logging, status mapping, payload summary, scheduler capability extraction, and guard callbacks without changing runtime behavior.
- Updated version metadata from v0.3.32 to v0.3.33.

### Fixed
- None.

### Removed
- None.

## 2026-04-29 11:44 EEST — v0.3.32

### Added
- Added Slice 1 low-risk TypeScript function boundary types for the dashboard API client and dashboard service wrappers.

### Changed
- Added explicit parameter and return types around existing request/response metadata paths without changing endpoint URLs, payload keys, UI copy, or runtime behavior.
- Updated version metadata from v0.3.31 to v0.3.32.

### Fixed
- None.

### Removed
- None.

## 2026-04-28 17:55 EEST — v0.3.31

### Added
- Added `docs/vision_and_implementation/VIEW_A_AUTH_PREFLIGHT_BUTTONS.md` documenting every View A `1A-AUTH` button, endpoint, semantic success rule, status-circle meaning, inspect metadata expectation, and legacy B1 compatibility boundary.
- Added focused 2FA tests covering the auth button semantic status classifier and the current unsupported non-interactive `icloudpd` 2FA provider boundary.

### Changed
- Hardened the `Submit 2FA` button status rule so it turns green only when both authenticated status and completed 2FA are proven by backend/provider state.
- Documented remaining old B1 action/status keys as intentional compatibility adapters for the visible View A `1A-AUTH` card.
- Updated auth and dashboard vision docs to reference the new button-level auth preflight spec.
- Updated version metadata from v0.3.30 to v0.3.31.

### Fixed
- Fixed a 2FA overclaiming risk where completed 2FA status alone could mark the `Submit 2FA` button successful without also proving authenticated state.

### Removed
- None.

## 2026-04-28 16:47 EEST — v0.3.30

### Added
- Added Slice 2 structured auth button status/help copy in `dashboard/data/authButtonStatusCopy.js` for every View A `1A-AUTH` button and every status state.
- Added tooltip/help text generation for auth buttons so titles, ARIA labels, and status shell metadata update from the shared copy source.
- Added inspect metadata coverage for all auth buttons across Explain controls, Explain values, Show real vs mock, and Show backend status modes.
- Added tests proving auth button copy coverage and inspect metadata coverage for all target auth controls.

### Changed
- Updated View A auth button rendering to use semantic help copy instead of raw per-request messages only.
- Updated 1A-AUTH value/backend metadata so the auth card uses `state.authPreflight.*` and the legacy `B1` compatibility key intentionally, rather than falling back to generic View A init result metadata.
- Updated version metadata from v0.3.29 to v0.3.30.

### Fixed
- Fixed missing per-button inspect metadata for auth controls including refresh status, reset local attempt, logout, check login, verify icloudpd, login using `.env`, 2FA submit, and single-file diagnostic download.

### Removed
- None.

## 2026-04-28 16:15 EEST — v0.3.29

### Added
- Added Slice 1 per-button auth status indicators for View A `1A-AUTH`, including neutral, running, pending, success, failed, and blocked visual states.
- Added runtime-truth button state storage under `authPreflight.buttonStates` so each auth control can resolve independently instead of relying only on the legacy `B1` card status.
- Added frontend/runtime tests covering auth button indicator rendering and semantic state transitions.

### Changed
- Updated View A auth rendering to wrap every auth control in a status shell without changing the existing auth endpoints or data-action names.
- Updated auth runtime action handling so button indicators use semantic backend/provider results rather than treating every HTTP response as green success.
- Updated version metadata from v0.3.28 to v0.3.29.

### Fixed
- Fixed the View A auth UI gap where individual buttons did not show their own execution/result state.

### Removed
- None.

## 2026-04-26 20:08 EEST — v0.3.28

### Added
- Added Slice 3 target architecture, pipeline/workers, auth/2FA, scheduler/runtime recovery, and final reconciliation documentation under `docs/vision_and_implementation/`.
- Added `docs/active_workflow_docs/vision_slice3_prompt_analysis_critique_refinement.md` with the analyzed, critiqued, and refined Slice 3 prompt.
- Added `docs/vision_and_implementation/reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md` as the final 3-slice reconciliation report.

### Changed
- Updated the vision/spec documentation README, authority map, unresolved questions, and deprecated/superseded docs log for Slice 3 closure.
- Recorded that auth tests, full `npm test`, and `npm run task-docs:check` were intentionally skipped under Slice 3 constraints.
- Updated version metadata from v0.3.27 to v0.3.28.

### Fixed
- None.

### Removed
- None.

## 2026-04-26 19:59 EEST — v0.3.27

### Added
- Added Slice 2 current vision/specification documents under `docs/vision_and_implementation/`: project vision, current implementation spec, and dashboard views spec.
- Added `docs/active_workflow_docs/vision_slice2_prompt_analysis_critique_refinement.md` with the analyzed, critiqued, and refined Slice 2 prompt.
- Added `docs/vision_and_implementation/reconciliation/SLICE2_CURRENT_VISION_SPEC_REPORT.md` to record Slice 2 outputs and verification notes.

### Changed
- Updated the vision/spec documentation README and unresolved questions list for Slice 2.
- Updated `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md` to record Slice 2 harvesting status without moving or deleting old docs.
- Recorded that `npm run task-docs:check` timed out twice and should not be rerun in Slice 3 without user approval or prior inspection.
- Updated version metadata from v0.3.26 to v0.3.27.

### Fixed
- None.

### Removed
- None.

## 2026-04-26 19:47 EEST — v0.3.26

### Added
- Added Slice 1 vision/specification documentation authority baseline under `docs/vision_and_implementation/`.
- Added `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md` to track deprecated, superseded, and historical documentation candidates without moving or deleting files.
- Added `docs/active_workflow_docs/vision_slice1_prompt_analysis_critique_refinement.md` as the prompt analysis, critique, and refined Slice 1 prompt record.

### Changed
- Updated version metadata from v0.3.25 to v0.3.26.

### Fixed
- None.

### Removed
- None.

## [0.3.25] - 2026-04-26 18:08 EEST

### Added
- Added Part 3 Slice 4 final Browser Repo Verifier & Doc Curator report under `docs/active_workflow_docs/`.
- Finalized the documentation truth matrix and recommended documentation authority model.
- Updated the active workflow docs index for Slice 4 finalization artifacts.

### Notes
- Documentation-only workflow finalization.
- No production code was changed.
- No existing documentation was moved or deleted.

## [0.3.24] - 2026-04-26 17:20 EEST

### Added
- Added `docs/active_workflow_docs/` as the active output folder for `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`.
- Added current part-one documentation inventory outputs and part-two repo structure analysis outputs to the active workflow docs folder.
- Added a prompt-analysis record documenting the active workflow docs folder rule.


## 2026-04-26 04:14 EEST — v0.3.23

- Updated auth API step tests to match the backend-owned honest provider failure contract.
- Preserved the runtime behavior where missing/unavailable icloudpd returns a safe provider failure instead of a fake successful/blocking login state.
- Updated version metadata from v0.3.22 to v0.3.23.

> Note: changelog entries before v0.3.3 are preserved as legacy history and are not backfilled. Structured forward-only enforcement begins at v0.3.3.
## 2026-04-26 03:18 EEST — v0.3.22

### Added
- Added View A `1A-AUTH — VERIFY ICLOUDPD` between `1A VERIFY .ENV` and `2A DB`.
- Added backend-owned `POST /api/auth/verify-icloudpd` readiness endpoint for icloudpd executable/config checks without claiming authenticated login.

### Changed
- Rewired View A auth controls to explicit `Verify icloudpd`, `Check login`, `Login using .env values`, and `Logout` actions.
- Updated version metadata to v0.3.22.

### Fixed
- Kept login checking backend-owned through session verification instead of frontend inference from required files or local UI state.

### Removed
- None


## 2026-04-26 00:51 EEST — v0.3.21

### Added
- Added Slice 3 documentation/status closure for the restored View A / B1 backend auth integration.

### Changed
- Updated B1 button verification, inspect metadata, and implementation overview docs so B1 is described as backend-auth-backed through `/api/auth/*` instead of frontend-only/mock.
- Updated version metadata from v0.3.20 to v0.3.21.

### Fixed
- Corrected stale B1 auth wording that still described the restored auth control as mock, placeholder, frontend-only, or missing backend wiring.

### Removed
- None


## 2026-04-25 22:45 EEST — v0.3.20

### Added
- Added merge-closure metadata for the sliced auth/provider and database-service import.

### Changed
- Updated version metadata from v0.3.11 to v0.3.20 to align the target repository with the completed sliced merge state.
- Documented the already-merged backend auth/provider foundation, mocked auth verification boundary, and centralized Node-side database service.

### Fixed
- Corrected stale documentation status that still described backend authentication as entirely missing after Slice 1.

### Removed
- None


## 2026-04-23 00:21 EEST — v0.3.11

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 23:53 EEST — v0.3.10

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 21:09 EEST — v0.3.9

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 20:45 EEST — v0.3.8

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 20:21 EEST — v0.3.7

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 19:44 EEST — v0.3.6

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 19:32 EEST — v0.3.5

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 19:26 EEST — v0.3.4

### Added
- None

### Changed
- None

### Fixed
- None

### Removed
- None

## 2026-04-22 18:58 EEST — v0.3.3

### Added
- Added `docs/VERSIONING_AND_CHANGELOG_POLICY.md` as the forward-only governance document for SemVer, changelog structure, and Git hook compliance from `v0.3.3` onward.
- Added `scripts/version_guard.mjs` with repo validation, commit-message validation, and deterministic version/changelog preparation support.
- Added repo-local `commit-msg` and strengthened `pre-commit` hooks plus Windows/Linux hook-install helpers.

### Changed
- Updated `README.md` and `docs/IMPLEMENTATION_STATUS_AUDIT.md` so the new governance policy is discoverable and treated as authoritative for future compliance work.
- Updated `VERSION`, `package.json`, and `package-lock.json` to `0.3.3` as the first forward-only enforcement release.

### Fixed
- Fixed the repository governance gap where new changes could land without synchronized version metadata, structured changelog updates, or commit-message enforcement.

### Removed
- None

## 2026-04-19 18:22 EEST — v0.3.0
- Performed safe inclusion and validation pass across the incoming frontend bundle and the audited system-documentation bundle.
- Kept the stronger modular frontend from the incoming project, including separate view files for A, B, C, and D, shared runtime-truth mock state, generated test data, and the Vite-based package setup.
- Included the stronger audited system documents `00_TABLE_OF_CONTENTS.md` through `14_VERSIONING_AND_CHANGELOG_RULES.md`.
- Preserved the frontend view documentation files because they remained consistent with the current UI surface and did not contradict the stronger system documents.
- Added `vite.config.js` so `npm run dev` works from the repository root while keeping the frontend files under `dashboard/`.
- Updated top-level README and documentation control text to clarify precedence between system documents and frontend view documents.

## 2026-04-20 19:00 EEST — v0.3.1
- Added the central `docs/issues_errors_discrepancies.md` registry and recorded the first verified HIGH issues.
- Fixed overlapping B3 pipeline stage execution in the frontend runtime-truth layer by enforcing a shared pipeline lock and sequential auto-stage execution.
- Fixed duplicate B4 playback and real-run start behavior by adding single-instance guards and idempotent start handling.

## 2026-04-20 19:16 EEST — v0.3.2
- Fixed B5 screen simulation so toggle and timeout changes now drive shared screen/playback truth and the B4 preview state.
- Added re-entrant action guards for generic control actions and the B1 login flow to prevent overlapping timers and duplicate UI runs.
- Recorded and verified ISSUE-0003 and ISSUE-0004 in the central issues registry.

## 0.8.8 - 2026-06-03

- Fixed worker-autostart live native playback proof timeout behavior by launching the native player detached from the worker CLI process.
- Improved worker-selected item extraction from proof stdout when surrounding log lines are present.
- Added persisted owned PID stop fallback for native playback started by a short-lived worker process, without killing arbitrary mpv/vlc processes by name.
- Preserved native playback disabled by default outside the dedicated proof launcher.

## 0.8.24 - Proof-seeded native video selection

- Updated the Test Mode-only live Windows native video proof seed path so seeded generated video fixtures are promoted ahead of existing READY image rows for the proof database only.
- Added diagnostic seed/current stage evidence to BLOCKED video proof envelopes.
- Preserved normal production playback ordering and the guarded Test Mode-only seed route.

## 0.8.55 — Raspberry install/runtime blocker repair

- Fixed the shared proof `runCommand` helper so callers can pass stdin to child processes. This repairs the managed cron installer path that previously called `crontab -` without feeding the generated crontab text and timed out on Raspberry.
- Added `proof:raspberry-executable-permissions` with optional `--repair` to check/restore executable bits for project-owned Raspberry launcher/proof entrypoints after ZIP extraction.
- Added `proof:raspberry-env-preflight` with optional `--create` / `--create-from-example` to create `.env` from `example.env` when missing and verify minimum runtime keys before scheduler workers such as `playback_worker` run.
- Added proof documentation and regression tests for stdin command input, executable-bit repair, and env bootstrap/preflight.
- Preserved proof boundaries: no Raspberry app-running PASS, native playback PASS, cron install PASS, reboot recovery, power-loss recovery, production iCloud continuation, or real geocode provider behavior is claimed without target evidence.


## 0.8.56 — Raspberry v1.0 release-gate matrix

- Added `docs/20_architecture_and_specs/openspec/raspberry_v1_release_gate_matrix_openspec.md` to encode the answered v1.0 question matrix as release gates.
- Added `proof:raspberry-v1-readiness`, a proof-artifact evaluator that scans latest `runtime_data/proofs/*.json` artifacts and reports which v1.0-required gates are still blocked.
- Added `docs/proofs/raspberry_v1_readiness_proof.md` and regression tests for real iCloud/GPS/geocode requirements, non-v1 reboot/power-loss gates, regular worker product-pipeline requirement, dashboard status requirement, and latest-proof artifact selection.
- Preserved proof honesty: this slice does not run real iCloud, GPS/geocode, native playback, dashboard, reboot, or power-loss proof commands by itself and does not claim Raspberry v1.0 readiness without target evidence.


## 0.8.57 — Raspberry three-worker startup smoke proof

- Added `proof:raspberry-worker-startup-smoke` to run executable/env/database preflights and start `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker` as scheduler commands.
- Added `--prepare` mode to repair executable permissions, create `.env`, and create/inspect the SQLite DB from `example.env` before worker startup checks on a fresh Raspberry extraction.
- Added proof documentation and regression tests for the three-worker startup command sequence, off-target BLOCKED semantics, Raspberry PASS semantics, and Raspberry worker-failure FAILED semantics.
- Preserved proof honesty: this slice does not claim cron timing, real regular worker product pipeline work, native display playback, dashboard status, reboot recovery, or physical power-loss recovery.

## 0.8.81 - Fedora parity preflight proofs

- Added Fedora executable-permission parity proof with optional `--repair`.
- Expanded Fedora env/tool reporting toward Raspberry-style preflight parity.
- Added Fedora iCloudPD preflight, worker command inventory, proof artifact export, and readiness-gate coverage.
- Preserved Raspberry v1 proof boundary: Fedora remains rehearsal evidence, not Raspberry display/playback proof.

## 0.8.82 - Fedora parity proof repair

- Repaired Fedora iCloudPD preflight to use Fedora-local config presence reporting.
- Kept `crontab` as optional in the generic Fedora tool checker; dedicated cron readiness remains covered by `proof:linux-fedora-cron-preflight`.

## 0.8.83 - Fedora tool parity optional media fix

- Marked Fedora media/playback tools as optional in the generic tool checker.
- Preserved separate playback/display proof boundaries; missing `mpv` does not block generic Fedora environment/tool readiness.

## v0.8.139 - Overall completeness reporting runbook and 3X2ACR review

- Added `docs/10_runbooks/overall_project_completeness_reporting.md`.
- Added `docs/50_audits_and_migrations/OVERALL_COMPLETENESS_3X2ACR_REVIEW_20260617.md`.
- Linked completeness reporting docs/proof entries from README, runbook index, proof index, and table of contents.
- No runtime PhotoFrame behavior changed.

## v0.8.138 - Overall completeness docs tests

- Added `tests/overallProjectCompletenessRegistry.test.js`.
- Tests normalized status enums, resolvable registry source paths, planned proof command separation, Debug docs/runtime separation, and Project Completeness Reporting OpenSpec coverage.

## v0.8.137 - Overall project completeness registry proof

- Added `tools/run-overall-project-completeness-registry-proof.mjs` and package script `proof:overall-project-completeness-registry`.
- Added `docs/proofs/overall_project_completeness_registry_proof.md`.
- The proof validates registry source paths, normalized statuses, planned-vs-implemented proof command states, and Debug page runtime non-claims.

## v0.8.136 - Project completeness reporting OpenSpec

- Added `docs/20_architecture_and_specs/openspec/project_completeness_reporting_openspec.md`.
- Defines source priority, runtime proof artifact absence handling, archive/snapshot precedence, Debug docs/runtime separation, planned proof command handling, and percentage formulas.
- Links the new OpenSpec from OpenSpec, architecture, and table-of-contents navigation.

## v0.8.135 - Overall project goal registry

- Added `docs/40_backlog_and_tasks/overall_project_goal_registry.md` and `.json` as the active source registry for `print overall project completeness` reports.
- Captures Raspberry v1 gates, Debug page goals, active backlog items, status enums, proof command states, source paths, and non-claim boundaries.
- Keeps Debug page documentation separate from runtime/UI proof and marks planned proof commands separately from implemented commands.

## v0.8.134 - Project status enum registry

- Added `docs/20_architecture_and_specs/reference/project_status_enum_registry.md` as the normalized status vocabulary for overall project completeness reports.
- Defines proof-safe enum meanings for `PROVEN`, `PARTIAL`, `PRE_PASS`, `SPECIFIED`, `SCAFFOLDED`, `DOCS_ONLY`, `DECISION_GATED`, and planned proof command states.
- No runtime behavior changed.
