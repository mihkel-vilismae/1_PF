# Main Goal Implementation Status Verification — 2026-05-31

## Purpose

This corrective audit verifies the main PF_login / 1234_PF app goals against repository files, tests, scripts, proof tooling, and documentation. It corrects the earlier Gate A documentation pass by separating **documentation inventory integration** from **implementation-status verification**.

This document is documentation-only. It does not change runtime behavior, APIs, architecture, routes, scripts, tests, compatibility pointers, or source code.

## Baseline used

- Baseline ZIP/workspace: `PF_login--v0.7.34--doc-update-gate-a-full_git.zip`
- Starting commit: `efc8e7f docs: integrate Gate A documentation audit and update navigation, freshness matrix, and runbook (2026-05-31)`
- Version: `0.7.34`

## Skills / rules applied

| Skill / rule | Fit check |
| --- | --- |
| ACR Skill Check Rule | Applied: this audit records Analyze, Criticise, Refine, and safe documentation implementation only. |
| Documentation Navigation Rule | Applied: governance docs were read before status claims were updated. |
| Baseline/Snapshot Discipline | Applied: this audit uses the `doc-update-gate-a` ZIP as the immutable baseline. |
| Regression Intolerance | Applied: no source behavior, public route, script, or compatibility pointer was changed. |
| source-of-truth classification | Applied: status claims are graded as Verified, Inferred, Unknown, Historical, or Contradicted. |
| pf-doc-governance-writer | Applied: new audit material is placed in `docs/50_audits_and_migrations/` and navigation/freshness docs are updated. |
| contract-doc-consolidation | Not applied: no document merge or canonicalization was approved for this corrective slice. |

## Specialist role summary

| Role | Finding |
| --- | --- |
| Governance Specialist | Canonical documentation folders and compatibility-pointer policy are preserved. The new corrective audit belongs in `docs/50_audits_and_migrations/`. |
| Goal Verification Specialist | The six product goals are partially implemented with clear strong areas: auth/provider boundary, deterministic pipeline, GPS/geocode provider architecture, queue/playback selection. Real provider/runtime/hardware proof remains incomplete. |
| Frontend/Dashboard Specialist | View B mode separation and control documentation are test-covered; dashboard controls exist for Test/Real paths, pipeline stages, playback selection, and native playback surfaces. |
| Backend/Pipeline Specialist | Runtime routes exist for mock download, real auth-gated iCloudPD download, index, GPS, geocode, queue, playback selection, playback status, and native playback. Real external provider/hardware success remains environment-dependent. |
| Test/Proof Specialist | Targeted tests passed for auth/provider, real-iCloudPD gating/proof opt-in, media provider contracts, geocode proof gating, native playback config/routes, card inventory, and playback worker. Full `npm test` was attempted but did not finish in this environment and was stopped. |
| Risk/Correction Specialist | The earlier Gate A audit overclaimed the implementation-verification depth. That audit must now point to this corrective document as the authoritative implementation-status verification for this slice. |

## Files inspected

### Governance and status docs

- `docs/50_audits_and_migrations/GATE_A_DOCUMENTATION_AUDIT_20260531.md`
- `docs/DOC_REFACTOR_CLOSURE_REPORT_20260525.md`
- `docs/table_of_contents.md`
- `docs/DOC_INDEX.md`
- `docs/DOC_FRESHNESS_MATRIX.md`
- `docs/DOC_REORGANIZATION_PLAN.md`
- `docs/DOC_LINK_AUDIT.md`
- `docs/00_current_truth/MEDIA_PIPELINE_IMPLEMENTATION_STATUS_20260528.md`
- `docs/00_current_truth/AUTH_EVIDENCE_PACK.md`
- `docs/00_current_truth/PROJECT_ISSUES_AND_IMPROVEMENT_GUIDE_20260528.md`
- `docs/20_architecture_and_specs/product_vision_and_authority.md`
- `docs/20_architecture_and_specs/media_pipeline_provider_interfaces.md`
- `docs/20_architecture_and_specs/media_pipeline_geocode_provider_chain.md`
- `docs/20_architecture_and_specs/native_playback_runner_spec.md`
- `docs/20_architecture_and_specs/playback_resume_checkpoint_spec.md`
- `docs/20_architecture_and_specs/runtime_truth_local_state.md`
- `docs/10_runbooks/PC_RUNTIME_WORKER_STAGE_VERIFICATION_CHECKLIST_20260529.md`
- `docs/10_runbooks/POWER_OUTAGE_PLAYBACK_RECOVERY_CHECKLIST_20260529.md`
- `docs/proofs/README.md`
- `docs/proofs/full_test_suite_stability_proof.md`
- `docs/proofs/real_icloudpd_pipeline_proof.md`
- `docs/proofs/geocode_provider_proof.md`
- `docs/proofs/raspberry_power_loss_recovery_proof.md`
- `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md`
- `docs/30_status_snapshots/2026-05-26/USER_OBSERVED_CARD_STATUS_AND_ISSUES_20260526_1457_EEST.md`

### Implementation files and tests

- `package.json`, `VERSION`, `CHANGELOG.md`, `README.md`, `HOW_TO_RUN.md`, `example.env`, `test.example.env`, `schema.sql`, `conf/runtime-truth.seed.json`, `.gitignore`
- `dashboard/app.ts`, `dashboard/views/initView.ts`, `dashboard/views/testView.ts`, `dashboard/views/lastRunView.ts`, `dashboard/views/osPlaybackView.ts`, `dashboard/views/runningProcessView.ts`
- `dashboard/services/runtimeExecutionService.ts`, `dashboard/services/runtimeTruth.ts`, `dashboard/services/runtimeTruth/*`, `dashboard/services/newAuthService.ts`, `dashboard/services/authPreflightService.ts`, `dashboard/services/apiClient.ts`, `dashboard/services/playbackRenderer.ts`, `dashboard/services/osPlaybackActivityDetection.ts`, `dashboard/services/osPlaybackViewModel.ts`, `dashboard/services/viewBActivityDetection.ts`, `dashboard/services/databaseViewerService.ts`
- `server/index.ts`, `server/auth/*`, `server/auth/newAuth/*`, `server/auth/providers/*`, `server/database/databaseService.ts`, `server/runtimeRealDownloadAuthBridge.ts`, `server/runtimePipelineLocks.ts`, `server/routes/*`, `server/playback/*`, `server/nativePlayback/nativePlaybackController.ts`, `server/workers/playbackWorker.ts`, `server/scripts/sqlite_admin.py`, `server/scripts/media_pipeline/*`
- `shared/runtimeProjectionContracts.ts`, `shared/schedulerPlatformCapabilities.ts`, `shared/schedulerWorkerCommands.ts`
- `scripts/*`, `tools/run-full-test-proof.mjs`, `tools/run-real-icloudpd-pipeline-proof.mjs`, `tools/run-geocode-provider-proof.mjs`, `tools/collect-raspberry-recovery-proof.mjs`, `tools/real-icloudpd-pipeline-proof-lib.mjs`, `tools/geocode-provider-proof-lib.mjs`, `tools/raspberry-recovery-proof-lib.mjs`, `tools/proof-utils.mjs`, `tools/CronEmulator/*`
- Targeted tests listed in the verification command section.

## Command verification results

| Command | Result |
| --- | --- |
| `git status --short` | Clean before edits. |
| `git diff --check` | Passed before edits. |
| `find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*"` | 194 Markdown files found before edits. |
| stale marker grep | 547 matches before edits; most are intentional compatibility-pointer/archive/backlog/placeholder-audit language rather than newly introduced implementation TODOs. |
| `cat package.json` | Verified scripts: `api`, `dev`, `test`, `typecheck`, `build`, proof scripts. |
| `npm install --verbose` | Passed; installed local dependencies required for typecheck/tests in this environment. |
| `npm run typecheck` | Passed after dependencies were installed. |
| Targeted auth/provider/real-iCloudPD tests | Passed: 37 tests. |
| Targeted media/geocode tests | Passed: 9 tests. |
| `npx tsx --test tests/playbackWorker.test.js` | Passed: 4 tests. |
| `npx tsx --test tests/nativePlaybackController.test.js` | Passed: 5 tests. |
| `npx tsx --test tests/raspberryRecoveryProof.test.js` | Passed: 4 tests. |
| `timeout -s KILL 30s npx tsx --test tests/playbackApiContract.test.js` | Timed out/killed with exit 137 after printing TAP header only; no pass/fail claim is made for this test in this environment. |
| `npm test` | Attempted, but the full parallel suite did not finish in this environment and spawned backend/test processes; it was stopped. No pass/fail claim is made for the full suite in this corrective audit. |

## Main goal implementation status matrix

| Goal | Evidence grade | Status conclusion | Implementation evidence | Tests / proof evidence | Honest limitation |
| --- | --- | --- | --- | --- | --- |
| Goal 1 — iCloud-connected digital photo frame | Inferred / partially verified | NEW AUTH/iCloudPD provider boundary is implemented and heavily tested; live iCloud account success is environment-dependent and not proven here. | `server/auth/newAuthService.ts`; `server/auth/providers/icloudpdProvider.ts`; `server/auth/providers/icloudpdProcessRunner.ts`; `server/auth/newAuthRoutes.ts`; `server/runtimeRealDownloadAuthBridge.ts`; `dashboard/services/newAuthService.ts`; `dashboard/views/initView.ts` | `tests/authIcloudpdProvider.test.js`; `tests/authProviderRegistry.test.js`; `tests/newAuthProviderVerificationUx.test.js`; `tests/newAuthStatusProviderProof.test.js`; `docs/00_current_truth/AUTH_EVIDENCE_PACK.md` | Repository tests prove provider mapping, redaction, session-proof rules, and auth gating. They do not prove real Apple/iCloud service access in this environment. |
| Goal 2 — automatic picture download into system | Inferred / partially verified | Deterministic mock/generated download is implemented. Real iCloudPD download route is implemented and auth-gated, but real provider success and repeated-batch semantics remain runtime concerns. | `server/index.ts` `runtimeDownloadRunHandler` and `runtimeRealDownloadRunHandler`; `server/runtimeRealDownloadAuthBridge.ts`; `dashboard/views/testView.ts`; `dashboard/services/runtimeExecutionService.ts` | `tests/realIcloudpdPipelineProof.test.js`; `tests/runtimeRealDownloadAuthHandoff.slice1.test.js`; `tools/real-icloudpd-pipeline-proof-lib.mjs`; `docs/proofs/real_icloudpd_pipeline_proof.md` | Real download proof is blocked by default and must be explicitly run with a real backend/provider session. Automatic production download is not fully proven by this audit. |
| Goal 3 — media processing pipeline | Verified for deterministic pipeline; Inferred for production pipeline | Stage routes and backend helpers exist for Download, Index, GPS, Geocode, Queue, and Playback Select. Deterministic/mock and provider-gated boundaries are documented. | `server/index.ts` runtime routes; `server/database/databaseService.ts`; `server/scripts/sqlite_admin.py`; `server/scripts/media_pipeline/*`; `dashboard/views/testView.ts`; `schema.sql` | `tests/mediaPipelineProviderContracts.test.js` passed; `tests/waveD.e2e.test.js`; `tests/waveE.step5.test.js`. | Real iCloudPD and real network geocode provider behavior are not proven as a complete unattended production pipeline. |
| Goal 4 — GPS/address display | Verified for local GPS/provider architecture; Inferred for production-quality addresses | GPS provider chain includes EXIF and local/offline fallbacks. Geocode chain is cache-first with registered network providers disabled by default and deterministic placeholder fallback. | `server/scripts/media_pipeline/gps_exif_provider.py`; `server/scripts/media_pipeline/gps_sidecar_providers.py`; `server/scripts/media_pipeline/provider_chain.py`; `server/scripts/media_pipeline/geocode_provider_registry.py`; `server/scripts/media_pipeline/geocode_address_cache_provider.py`; `server/scripts/media_pipeline/geocode_http_providers.py`; `server/scripts/media_pipeline/geocode_placeholder_provider.py`; `server/scripts/media_pipeline/geocode_config.py` | `tests/mediaPipelineProviderContracts.test.js`; `tests/geocodeProviderProof.test.js`; `tools/geocode-provider-proof-lib.mjs`; `docs/proofs/geocode_provider_proof.md` | Address quality from real geocoders is not proven unless `PF_PROOF_ENABLE_REAL_GEOCODE=true` and a provider ID are configured and the proof passes. Placeholder `Lat/Lon` fallback is not production reverse geocoding. |
| Goal 5 — playback/display behavior | Verified for selection; Inferred/partial for rendering/fullscreen/native playback | Queue/playback selection is backend-owned and tested. Native playback controller/routes exist and are disabled by default; browser preview/fullscreen remains separate from selection. | `server/playback/playbackSelectionService.ts`; `server/playback/playbackContractService.ts`; `server/workers/playbackWorker.ts`; `server/nativePlayback/nativePlaybackController.ts`; `dashboard/services/playbackRenderer.ts`; `dashboard/views/osPlaybackView.ts` | `tests/playbackWorker.test.js` passed; `tests/nativePlaybackController.test.js` passed; `docs/20_architecture_and_specs/native_playback_runner_spec.md` | Playback worker selecting an item does not equal proven fullscreen display on target hardware. Native playback is opt-in/disabled by default and requires environment setup. |
| Goal 6 — Raspberry power-loss auto-restart/recovery | Inferred / partial / hardware-unproven | Raspberry recovery scripts and proof artifact tooling exist. Scheduler platform profiles include Raspberry real crontab support. Hardware recovery success is not proven here. | `scripts/raspberry_power_loss_recovery_check.sh`; `tools/collect-raspberry-recovery-proof.mjs`; `tools/raspberry-recovery-proof-lib.mjs`; `shared/schedulerPlatformCapabilities.ts`; `shared/schedulerWorkerCommands.ts`; `tools/CronEmulator/*`; `server/scheduler_host.ts` | `tests/raspberryRecoveryProof.test.js` passed and proves the proof-envelope rules; `docs/proofs/raspberry_power_loss_recovery_proof.md` defines the required hardware proof. | Actual power-loss recovery requires device-level observation. Current repo can collect a proof artifact but this audit did not perform Raspberry hardware testing. |

## Overclaimed docs / claims corrected by this slice

| Document | Overclaim risk | Correction |
| --- | --- | --- |
| `docs/50_audits_and_migrations/GATE_A_DOCUMENTATION_AUDIT_20260531.md` | The previous audit text implied implementation-status verification was more complete than it actually was. | Added an explicit correction note pointing to this document as the authoritative corrective implementation-status verification for main goals. |
| `docs/00_current_truth/MEDIA_PIPELINE_IMPLEMENTATION_STATUS_20260528.md` | Current-truth pipeline wording could be read as broader than deterministic/proof-gated support. | Added a 2026-05-31 corrective verification note clarifying deterministic vs production/hardware proof boundaries. |
| `docs/00_current_truth/PROJECT_ISSUES_AND_IMPROVEMENT_GUIDE_20260528.md` | Some issue priorities changed after GPS/geocode provider work and proof tooling additions. | Added a note that this guide remains planning guidance and that the 2026-05-31 corrective verification supersedes it for exact main-goal status. |
| `docs/CARD_BUTTON_IMPLEMENTATION_STATUS.md` | Button/control presence can be mistaken for proven runtime behavior. | Added a pointer to the corrective audit and clarified evidence grades. |

## Underclaimed docs / claims

| Area | Underclaim | Evidence |
| --- | --- | --- |
| GPS providers | Earlier planning language described GPS parsing as narrow; current repo includes multiple offline fallback providers. | `server/scripts/media_pipeline/gps_sidecar_providers.py`; `tests/mediaPipelineProviderContracts.test.js`; `docs/10_runbooks/gps_metadata_sources.md`. |
| Geocode architecture | Some older docs describe geocode as placeholder-only; current repo has cache-first provider registry with network providers disabled by default. | `server/scripts/media_pipeline/geocode_provider_registry.py`; `server/scripts/media_pipeline/geocode_http_providers.py`; `tests/mediaPipelineProviderContracts.test.js`; `docs/20_architecture_and_specs/media_pipeline_geocode_provider_chain.md`. |
| Native playback scaffold | Native playback is more than a future idea: controller/routes/config detection exist. | `server/nativePlayback/nativePlaybackController.ts`; `server/index.ts` native routes; `tests/nativePlaybackController.test.js`; `docs/20_architecture_and_specs/native_playback_runner_spec.md`. |

## Unknown / unproven areas

- Real iCloudPD login and download against a live iCloud account were not executed in this environment.
- Real reverse-geocode provider quality was not proven; provider proof remains opt-in and environment-dependent.
- Full `npm test` did not finish in this environment; targeted tests provide partial verification only.
- Raspberry power-loss recovery was not hardware-tested.
- Native fullscreen playback was not launched on a real display in this audit.
- Repeated real-download batch behavior remains a runtime concern from the user-observed status docs.

## Regression risks

- Overpromoting “implemented” to “production ready” could hide real provider/hardware risks.
- Moving or merging docs would create link and compatibility-pointer risk; this slice does not do that.
- Deleting old indexes or compatibility pointers would break historical prompts; this slice does not do that.
- Running full tests can spawn backend processes; the attempted full suite had to be stopped in this environment.

## Next recommended slices

1. Real iCloudPD proof slice: run `tools/run-real-icloudpd-pipeline-proof.mjs` with explicit opt-in and a live local backend/session.
2. Real geocode provider proof slice: enable one provider safely, run `tools/run-geocode-provider-proof.mjs`, and document address quality.
3. Raspberry hardware recovery proof slice: run the device-level power-loss recovery checklist and collect a proof artifact.
4. Native fullscreen playback proof slice: enable native playback explicitly and verify process ownership/fullscreen behavior on the target display.
5. Full test stability proof slice: run `tools/run-full-test-proof.mjs` in a suitable environment that can finish the entire suite without orphaned server processes.

## Gate status

| Gate | Status |
| --- | --- |
| Gate A | Completed: status verification and documentation correction notes only. |
| Gate B | Pending/blocked: no move, merge, archive, or canonicalization was performed. |
| Gate C | Pending/blocked: no deletes, pointer retirement, or old-index removal was performed. |
| Gate D | Required after edits: run link checks, `git diff --check`, targeted tests, and clean git status before packaging. |

## Slice 6 native/fullscreen proof update — 2026-05-31

A deterministic native/fullscreen playback proof was added in Slice 6. It verifies disabled-by-default native playback, safe mock-player proof mode, route separation, process-ownership documentation, and browser fullscreen overlay behavior. It does **not** prove real OS fullscreen stability, native player launch behavior, Raspberry HDMI output, or hardware display behavior. Use `npm run proof:native-fullscreen-playback` for this deterministic boundary proof.


## Slice 7 dirty-shutdown testing panel note

`docs/proofs/dirty_shutdown_testing_proof.md` documents a deterministic Test Mode-only View C `TESTING` panel and backend guard scaffold. This improves software recovery testing readiness, but it does not prove real Raspberry hardware power loss, does not kill the backend process, and does not execute startup recovery.
