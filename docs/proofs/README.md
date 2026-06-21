# Proof artifacts

This folder documents proof workflows for behavior that cannot be honestly proven by source code alone.

| Layer | Location | Tracked in Git | Purpose |
|---|---|---:|---|
| Human proof docs | `docs/proofs/` | Yes | Explain how to run and interpret a proof. |
| Runtime proof JSON | `runtime_data/proofs/` | No | Timestamped sanitized evidence generated on the machine that ran the proof. |

| Status | Meaning |
|---|---|
| `PASSED` | The exact behavior was observed and sanitized evidence was written. |
| `FAILED` | The proof was attempted and observed a failure. |
| `BLOCKED` | The proof could not run because a dependency, session, config, or hardware was missing. |
| `PARTIAL` | Some proof steps succeeded, but the full proof chain was not completed. |
| `TIMED_OUT` | The proof command exceeded its configured timeout. |

Proof artifacts must not include Apple IDs, passwords, 2FA codes, cookies, API keys, provider tokens, raw provider output, or private filesystem paths.

## Available proof runners

| Proof | Command | Runtime mode |
|---|---|---|
| Full test suite stability | `npm run proof:full-test` | local test |
| Real iCloudPD readiness | `npm run proof:real-icloudpd-readiness` | local iCloud/auth readiness preflight |
| Real iCloudPD pipeline | `npm run proof:real-icloudpd` | opt-in real provider |
| Real geocode provider | `npm run proof:geocode-provider` | opt-in real provider |
| Geocode provider selection | `npm run proof:geocode-provider-selection` | local provider matrix guard |
| Real geocode provider readiness | `npm run proof:real-geocode-provider-readiness` | local real-geocode readiness preflight |
| Real geocode provider chain | `npm run proof:real-geocode-provider-chain` | opt-in real network provider |
| GPS fallback parsing | `npm run proof:gps-fallback` | deterministic local |
| Deterministic media pipeline | `npm run proof:deterministic-media-pipeline` | deterministic local |
| Real iCloud filtered download OpenSpec | `npm run proof:real-icloud-filtered-download-openspec` | local contract |
| Auth session usable evidence | `npm run proof:auth-session-usable-evidence` | local auth evidence contract |
| iCloud filter signature | `npm run proof:icloud-filter-signature` | local filter contract |
| Download manifest safe schema | `npm run proof:download-manifest-safe-schema` | local manifest contract |
| Download manifest overlap check | `npm run proof:download-manifest-overlap-check` | local no-loop manifest contract |
| Download batch ledger | `npm run proof:download-batch-ledger` | local ledger contract |
| Real iCloud download preflight | `npm run proof:real-icloud-download-preflight` | real-provider preflight, blocked by default |
| Real iCloud filtered download batch 1 | `npm run proof:real-icloud-filtered-download-batch1` | real-provider artifact proof, blocked by default |
| Real iCloud filtered download batch 2 | `npm run proof:real-icloud-filtered-download-batch2` | real-provider artifact proof, blocked by default |
| Real iCloud download no-loop | `npm run proof:real-icloud-download-no-loop` | real-provider artifact no-loop proof, blocked by default |
| Real download continuation readiness | `npm run proof:real-download-readiness` | local real-download readiness preflight |
| Real download continuation | `npm run proof:real-download-continuation` | opt-in real provider |
| Address display | `npm run proof:address-display` | deterministic local |
| Address display UI | `npm run proof:address-display-ui` | deterministic local UI render |
| Native / fullscreen playback | `npm run proof:native-fullscreen-playback` | deterministic local/browser boundary |
| Dirty-shutdown testing panel | `npm run proof:dirty-shutdown-testing` | deterministic Test Mode |
| Windows CronEmulator | `npm run proof:windows-cronemulator` | deterministic Windows CronEmulator |
| E2E local photo frame | `npm run proof:e2e-local-photo-frame` | deterministic local end-to-end |
| Test Mode whole-logic emulator | `npm run proof:test-mode-whole-logic-emulator` | deterministic Test Mode controller |
| Live Windows native playback | `npm run proof:live-windows-native-playback` | opt-in Windows native proof |
| Live Windows native playback wrapper | `npm run proof:live-windows-native-playback:windows` | Windows launcher wrapper |
| Live Windows native video playback | `npm run proof:live-windows-native-video-playback` | opt-in Windows native video proof |
| Live Windows native video playback wrapper | `npm run proof:live-windows-native-video-playback:windows` | Windows launcher wrapper |
| Live Windows native recovery | `npm run proof:live-windows-native-recovery` | opt-in Windows controlled recovery proof |
| Live Windows native recovery wrapper | `npm run proof:live-windows-native-recovery:windows` | Windows launcher wrapper |
| Live Windows scheduler loop | `npm run proof:live-windows-scheduler` | proof-owned scheduler loop |
| Live Windows scheduler wrapper | `npm run proof:live-windows-scheduler:windows` | Windows launcher wrapper |
| Generated fixture validation | `npm run proof:verify-generated-test-data` | deterministic fixture validation |
| Windows reboot/restart recovery preflight | `npm run proof:windows-reboot-recovery-preflight` | safe preflight, no reboot |
| Fedora executable-permission repair | `npm run proof:linux-fedora-executable-permissions` | Fedora/Linux target permission repair |
| Fedora env preflight | `npm run proof:linux-fedora-env-preflight` | Fedora/Linux target `.env` preflight |
| Fedora tool checker | `npm run proof:linux-fedora-tool-checker` | Fedora/Linux target readiness preflight |
| Fedora iCloudPD preflight | `npm run proof:linux-fedora-icloudpd-preflight` | Fedora/Linux iCloudPD discovery preflight |
| Fedora worker command inventory | `npm run proof:linux-fedora-worker-command-inventory` | Fedora/Linux worker command inventory |
| Fedora cron preflight | `npm run proof:linux-fedora-cron-preflight` | Fedora/Linux cron readiness preflight |
| Fedora worker singleton pack | `npm run proof:linux-fedora-worker-singleton-pack` | Fedora/Linux worker singleton proof pack |
| Fedora product pipeline rehearsal | `npm run proof:linux-fedora-product-pipeline-rehearsal` | Fedora/Linux product pipeline rehearsal |
| Fedora export proof artifacts | `npm run proof:linux-fedora-export-proof-artifacts` | Fedora/Linux proof artifact export |
| Fedora readiness | `npm run proof:linux-fedora-readiness` | Fedora/Linux readiness summary |
| Raspberry recovery evidence collector | `npm run proof:raspberry-recovery` | hardware/operator collector; not current Raspberry proof |
| Raspberry tool checker | `npm run proof:raspberry-tool-checker` | Raspberry target readiness preflight |
| Raspberry generated fixture validation | `npm run proof:raspberry-generated-fixtures` | Raspberry target fixture validation |
| Raspberry native image playback | `npm run proof:raspberry-native-image-playback` | Raspberry target native image playback |
| Raspberry native video playback | `npm run proof:raspberry-native-video-playback` | Raspberry target native video playback |
| Raspberry executable-permission repair | `npm run proof:raspberry-executable-permissions` | Checks/repairs repo-owned executable bits after ZIP extraction |
| Raspberry env preflight | `npm run proof:raspberry-env-preflight` | Checks/creates `.env` from `example.env` before playback worker runtime |
| Raspberry v1.0 readiness | `npm run proof:raspberry-v1-readiness` | Evaluates latest proof artifacts against answered v1.0 release gates |
| Raspberry worker startup smoke | `npm run proof:raspberry-worker-startup-smoke` | Starts all three scheduler worker commands after install/runtime preflights |
| Raspberry cron preflight | `npm run proof:raspberry-cron-preflight` | Checks/installs PF_login managed cron worker rows |
| Raspberry worker evidence generator | `npm run proof:raspberry-worker-evidence` | Generates `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE` for cron runtime proof |
| Raspberry cron worker runtime | `npm run proof:raspberry-cron-worker-runtime` | Raspberry target cron app-running proof |
| Raspberry app-running status | `npm run proof:raspberry-app-running-status` | Operator-facing Raspberry app-running status summary |
| Raspberry app-running PASS chain | `npm run proof:raspberry-app-running-chain` | Worker evidence -> cron runtime -> app-running status chain |
| Raspberry app-running PASS harness | `npm run proof:raspberry-app-running-pass` | Proof-owned all-worker evidence harness feeding app-running chain |
| Raspberry reboot evidence generator | `npm run proof:raspberry-reboot-evidence` | Prepare/collect evidence for manual reboot recovery proof |
| Raspberry reboot recovery | `npm run proof:raspberry-reboot-recovery` | Manual pre/post reboot recovery proof |
| Raspberry physical power-loss recovery | `npm run proof:raspberry-power-loss-recovery` | Manual physical power-loss/restored-power proof |
| Raspberry cron worker singleton/recovery proof plan | planned; no runtime command in v0.8.44 | documentation-only Raspberry app-running proof contract |

| Raspberry dashboard status view | `npm run proof:raspberry-dashboard-status-view` | Raspberry target/local projection proof |
| Raspberry screen-worker non-blocking | `npm run proof:raspberry-screen-worker-non-blocking` | Raspberry target/design proof |
| Raspberry v1 docs reconciliation | `npm run proof:raspberry-v1-docs-reconciliation` | docs/OpenSpec v1 reconciliation |

| Provider proof env template | `npm run proof:provider-env-template` | local secret-safe env template guard |
| Proof report blocker summary | `npm run proof:proof-report-blocker-summary` | local proof-report blocker summary |
| Proof runner final readiness summary | `npm run proof:proof-runner-final-summary` | local proof-report summary guard |
| Proof runner queue order | `npm run proof:proof-runner-queue` | local proof-runner ordering contract |

The table above is intentionally complete for current `proof:*` package scripts. As of this repository version, `package.json` exposes 115 proof package scripts and every one must appear in this table. `tests/docsNpmScriptReferences.test.js` guards active documentation against stale `npm run ...` script references and against missing proof-runner inventory entries.

When adding, renaming, or removing a `proof:*` script, update this table in the same change as the package script so the proof catalog does not drift from the runnable command surface. Keep runtime-mode wording conservative: table entries describe how to run a proof command, not that the underlying hardware/provider/runtime behavior is already proven.

## Ordered proof-runner handoff flow

The 2proofrunner handoff should not run release-readiness summaries too early. `npm run proof:proof-runner-queue` proves the intended queue order: proof-producing commands run first, then `npm run proof:raspberry-v1-readiness`, then `npm run proof:proof-report-blocker-summary`, then `npm run proof:proof-runner-final-summary`.

`npm run proof:proof-runner-final-summary` reads existing `runtime_data/proofs` artifacts and writes a compact final marker. It does not execute provider, product, overlay, or hardware proofs itself. It is `BLOCKED` when readiness has not been run yet or when a newer input artifact appears after the readiness summary.

This order prevents proof reports from showing real-provider artifacts as `MISSING` merely because readiness ran before `proof:real-icloudpd`, `proof:real-download-continuation`, or `proof:real-geocode-provider-chain`.

## Real geocode provider-chain proof

`npm run proof:real-geocode-provider-chain` is blocked by default. To run it, set `PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true` and choose a real provider with `PF_GEOCODE_CHAIN_PROOF_PROVIDER`, for example `nominatim_osm`. The proof uses the existing Python reverse-geocode provider interfaces, disables deterministic placeholder fallback for the subprocess, checks cache miss -> network provider -> cache hit behavior, and verifies that the returned address is human-readable and contains expected terms. For v1.0 production acceptance, placeholder geocoding is forbidden as success.

Example PowerShell setup for the no-key Nominatim path:

```powershell
$env:PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN = "true"
$env:PF_GEOCODE_CHAIN_PROOF_PROVIDER = "nominatim_osm"
$env:PF_GEOCODE_CHAIN_EXPECTED_TERMS = "Tallinn;Estonia"
$env:GEOCODE_NOMINATIM_OSM_USER_AGENT = "PF_login-proof/0.7.43"
npm run proof:real-geocode-provider-chain
```

Use provider-specific API-key or token environment variables for providers that require accounts. The generated artifact must not include API keys, access tokens, raw headers, or raw provider output.

## Address display UI proof

`npm run proof:address-display-ui` renders the dashboard/display-facing Windows playback view and fullscreen overlay from deterministic local state. It asserts semantic UI fragments only, including the selected media name, resolved address label, expected address text, safe backend media URL, pending-address fallback copy, and absence of raw filesystem path exposure.

The generated JSON artifact intentionally stores assertion results and markup length metrics, not full HTML snapshots. This keeps the proof stable across harmless layout/CSS changes while still proving the address evidence reaches the display-facing UI contract.


## Raspberry runtime `.env` readiness

`docs/proofs/raspberry-runtime-env.md` describes the minimum Raspberry `.env` keys required before worker startup, cron app-running, and v1 readiness proofs can pass honestly. `npm run proof:raspberry-env-preflight -- --create` may bootstrap `.env` from `example.env`, but generated artifacts must record only key names/presence and sanitized missing-key guidance, never values or secrets.

## Windows native proof milestone

`docs/proofs/windows_native_proof_milestone_v0.8.26.md` is the consolidated proof-status snapshot for the v0.8.26 Windows target-machine checkpoint. It records the PASSED Windows native image/video/recovery/scheduler-loop evidence and states Windows Task Scheduler is out of scope and keeps non-claims explicit for full Windows reboot, Raspberry cron/reboot/power-loss recovery, monitor-pixel proof, production iCloud continuation, and vendored media tooling.

## Windows scheduler scope

Windows Task Scheduler is not part of PF_login project scope. Task Scheduler-only proof files, scripts, and recommendations were removed in v0.8.29. The supported Windows scheduler evidence path is the proof-owned scheduler loop proof.

## Windows reboot/restart recovery preflight

`npm run proof:windows-reboot-recovery-preflight` validates the project-owned Windows recovery proof contract without rebooting. It checks required launchers and proof scripts, local-only media-tool ignore boundaries, cleanup rules, and non-claims. Windows Task Scheduler is not part of PF_login project scope and the preflight does not use `schtasks.exe`.

## Raspberry v1 readiness gap runbook

`docs/proofs/raspberry-v1-readiness-gap-runbook.md` explains how to interpret the `readiness_gap_report` generated by `npm run proof:raspberry-v1-readiness`. Missing, planned, blocked, and failed proof kinds remain blockers; the gap report is a next-command guide, not a proof pass.

## Raspberry OS proof planning

The Raspberry OS implementation path is documented first as OpenSpec, not as a runtime proof claim: `docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md`. It marks Raspberry runtime launcher, local tool checker, native image/video playback, address overlay, path portability, project-owned scheduler loop, worker autostart, screen on/off behavior, generated fixture validation on Raspberry, controlled recovery, manual reboot recovery, power-loss recovery, evidence export, and operator guide work as not implemented/not proven unless later evidence says otherwise.

Windows Task Scheduler is not part of PF_login project scope; the Raspberry OpenSpec does not reintroduce it as a project path.

## Raspberry tool checker proof

`npm run proof:raspberry-tool-checker` checks Raspberry target readiness for `mpv`, `ffmpeg`, and `ffprobe`. It returns `PASSED` only on a Raspberry-like target with all tools available, and returns `BLOCKED` for off-target or missing-tool runs. It does not prove Raspberry playback, scheduler behavior, reboot recovery, power-loss recovery, display focus, monitor pixels, or production iCloud continuation.

- `npm run proof:raspberry-generated-fixtures` — Raspberry target generated fixture validation; see `raspberry_generated_fixture_proof.md`.

## Raspberry generated fixture proof

`npm run proof:raspberry-generated-fixtures` validates `generated_test_data/` on a Raspberry-like target using `python3` and `ffprobe`. It returns `BLOCKED` off-target or when prerequisites are missing, and does not prove native playback, scheduler behavior, recovery, display focus, or production iCloud continuation. See [`raspberry_generated_fixture_proof.md`](raspberry_generated_fixture_proof.md).


## Registry and runtime proof-enabler commands

These commands are part of the active proof-enabler and local/runtime proof lanes. They may prove local contracts, produce honest `BLOCKED` target-provider state, or validate registry/readiness data requirements without claiming final Raspberry v1 readiness by themselves.

| Proof | Command | Runtime mode |
|---|---|---|
| Overall project completeness registry | `npm run proof:overall-project-completeness-registry` | local registry validation |
| Debug page runtime | `npm run proof:debug-page-runtime` | local Debug UI/runtime proof |
| Runtime status projection | `npm run proof:runtime-status-projection` | local read-only status projection |
| View A refresh plan | `npm run proof:view-a-refresh-plan` | local View A contract |
| View A mode safety | `npm run proof:view-a-mode-safety` | local Test/Real mode guard |
| View C read-only wording | `npm run proof:view-c-readonly-wording` | local UI wording guard |
| Controlled restore contract | `npm run proof:controlled-restore-contract` | OpenSpec/contract proof |
| Scheduler host boundary | `npm run proof:scheduler-host-boundary` | OpenSpec/contract proof |
| Scheduler host mock | `npm run proof:scheduler-host-mock` | local mock scheduler status proof |
| iCloudPD preflight secret boundary | `npm run proof:icloudpd-preflight-boundary` | local redaction/target-boundary proof |
| Auth checkpoint state | `npm run proof:auth-checkpoint-state` | sanitized app-owned auth checkpoint proof |
| Auth checkpoint state tests | `npm run proof:auth-checkpoint-state:test` | local auth checkpoint unit proof |
| Auth checkpoint operator flow | `npm run proof:auth-checkpoint-operator-flow` | local auth operator runbook proof |
| Auth operator 2FA checkpoint | `npm run proof:auth-operator-2fa-checkpoint` | local secret-safe interactive-auth checkpoint proof |
| Regular worker product contract | `npm run proof:regular-worker-product-contract` | local product contract proof |
| Regular worker product evidence template | `npm run proof:regular-worker-product-evidence-template` | local evidence template proof |
| Screen worker nonblocking design | `npm run proof:screen-worker-nonblocking-design` | local nonblocking design pre-pass |
| V1 readiness data requirements | `npm run proof:v1-readiness-data-requirements` | local live-data requirements proof |
| Proofrunner Windows launcher contract | `npm run proof:proofrunner-windows-launcher-contract` | local launcher contract validation |
| Prooflauncher GUI selection | `npm run proof:prooflauncher-gui-selection` | local launcher GUI/mode-selection proof |
| Windows live proof blocked contract | `npm run proof:windows-live-proof-blocked-contract` | local Windows optional-live BLOCKED contract proof |
| Prooflauncher timing history | `npm run proof:prooflauncher-timing-history` | local prooflauncher timing/ETA contract proof |
| Auth/session snapshot contract | `npm run proof:auth-session-snapshot-contract` | local secret-safe auth snapshot contract proof |
| iCloudPD session path validator | `npm run proof:icloudpd-session-path-validator` | local secret-safe session path validator |
| Real iCloud listing preflight | `npm run proof:real-icloud-listing-preflight` | opt-in real iCloud listing preflight |
| Geocode dry run from sample | `npm run proof:geocode-dry-run-from-sample` | deterministic local sample GPS/geocode dry-run |
| Runtime state durable checkpoint | `npm run proof:runtime-state-durable-checkpoint` | local durable runtime-state checkpoint contract proof |
| Proof run handoff triage | `npm run proof:proof-run-handoff-triage` | local proof upload/summary triage proof |
| Proofrunner PowerShell safe log name/path | `npm run proof:proofrunner-powershell-safe-log-name` | local Windows launcher safe log-name and workdir path regression proof |
| Proofrunner handoff artifact export contract | `npm run proof:proofrunner-handoff-artifact-export-contract` | local handoff summary/export contract proof |
| Proofrunner packaging identity | `npm run proof:proofrunner-packaging-identity` | local repo ZIP/handoff naming and version identity contract proof |
| Proofrunner platform filter contract | `npm run proof:proofrunner-platform-filter-contract` | local handoff platform-filter contract proof |
| Proofrunner handoff runtime contract | `npm run proof:proofrunner-handoff-runtime-contract` | local handoff output-root and last-run-stats contract proof |
| Proofrunner launcher progress contract | `npm run proof:proofrunner-launcher-progress-contract` | local launcher color, heartbeat, elapsed-time, and ETA contract proof |

## Raspberry native image playback proof

`npm run proof:raspberry-native-image-playback` is the first target-gated Raspberry native playback proof. It selects `generated_test_data/gps_valid/gps_valid_01.jpg`, records the project-owned Raspberry launcher dry-run boundary, and starts a bounded `mpv` fullscreen image command only on a non-override Raspberry-like display target with `mpv` available. Off-target, explicit-override, missing-display, missing-tool, or missing-fixture runs return `BLOCKED`. See [`raspberry_native_image_playback_proof.md`](raspberry_native_image_playback_proof.md).
## Raspberry native video playback proof

`npm run proof:raspberry-native-video-playback` is the target-gated Raspberry native video playback proof. It selects `generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4`, records the project-owned Raspberry launcher dry-run boundary, records duration/media metadata with `ffprobe`, and starts a bounded `mpv` fullscreen video command only on a non-override Raspberry-like display target with `mpv` and `ffprobe` available. Off-target, explicit-override, missing-display, missing-tool, or missing-fixture runs return `BLOCKED`. See [`raspberry_native_video_playback_proof.md`](raspberry_native_video_playback_proof.md).


## Raspberry cron worker singleton and recovery proof plan

`docs/proofs/raspberry_cron_worker_singleton_recovery_proof.md` defines the proof evidence required before PhotoFrame can honestly claim the Raspberry app is running through cron. The required app-running definition is active cron plus all three worker lanes: `regular_stage_worker` every 10 minutes, `playback_worker` every 1 minute, and `screen_on_off_worker` every 3 minutes.

The plan requires same-worker singleton checks, duplicate same-worker skip evidence, cross-worker independence, stale-lock reclaim, and separate reboot/restored-power evidence. It is documentation-only in v0.8.44 and does not prove Raspberry cron, reboot recovery, power-loss recovery, monitor-pixel proof, production iCloud continuation, or real provider chains.

## Raspberry cron worker runtime proof

`npm run proof:raspberry-cron-worker-runtime` implements the target-gated Raspberry app-running proof runner. It requires active managed cron rows and worker evidence proving invocation, same-worker singleton duplicate-skip, cross-worker independence, and stale-lock reclaim for `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker`. It can auto-load the portable `runtime_data/raspberry_worker_evidence/latest.json` handoff generated by `npm run proof:raspberry-worker-evidence`; `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE` remains an explicit override. Redacted machine-readable references stay `BLOCKED`, not `PASSED`. See [`raspberry_cron_worker_runtime_proof.md`](raspberry_cron_worker_runtime_proof.md).

## Raspberry app-running status proof

`npm run proof:raspberry-app-running-status` converts cron worker runtime proof evidence into an app-running status summary. See [`raspberry_app_running_status_proof.md`](raspberry_app_running_status_proof.md).

## Raspberry reboot recovery proof

`npm run proof:raspberry-reboot-recovery` validates manual pre/post reboot evidence and requires the three-worker app-running status to pass after reboot. See [`raspberry_reboot_recovery_proof.md`](raspberry_reboot_recovery_proof.md).

## Raspberry physical power-loss recovery proof

`npm run proof:raspberry-power-loss-recovery` validates explicit physical power-loss/restored-power evidence and requires the three-worker app-running status to pass after restored power. It never uses Windows CronEmulator evidence as hardware proof. See [`raspberry_power_loss_recovery_v2_proof.md`](raspberry_power_loss_recovery_v2_proof.md).

## Raspberry worker evidence generator

`npm run proof:raspberry-worker-evidence` generates the worker evidence consumed by `npm run proof:raspberry-cron-worker-runtime`, updates the portable machine-readable `runtime_data/raspberry_worker_evidence/latest.json` handoff, and prints an optional `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE` override. On Raspberry it uses a proof-owned harness to collect invocation, duplicate-skip, cross-worker independence, and stale-lock reclaim evidence for all three lanes; incomplete evidence remains `BLOCKED` rather than faking app-running. See [`raspberry_worker_evidence_generator_proof.md`](raspberry_worker_evidence_generator_proof.md).

## Raspberry app-running PASS chain proof

`npm run proof:raspberry-app-running-chain` runs worker evidence generation, cron worker runtime proof, and app-running status proof in one chain. See [`raspberry_app_running_chain_proof.md`](raspberry_app_running_chain_proof.md).

### Standalone versus chained app-running proof

The chain proof carries freshly generated worker evidence in-process. The standalone commands use the portable latest handoff under `runtime_data/raspberry_worker_evidence/latest.json` unless `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE` explicitly overrides it. These paths must remain machine-readable; human-facing artifacts and logs may sanitize paths, but the runtime handoff must not use `[REDACTED]` as a file reference.

The standalone path is intentionally stricter than a successful shell exit: `proof_status` remains the proof truth, and incomplete or stale worker evidence remains `BLOCKED`.

## Raspberry app-running PASS harness

`npm run proof:raspberry-app-running-pass` runs the proof-owned app-running harness and feeds generated evidence into the app-running chain. See [`raspberry_app_running_pass_harness_proof.md`](raspberry_app_running_pass_harness_proof.md).

## Raspberry reboot evidence generator

`npm run proof:raspberry-reboot-evidence -- --prepare` writes the pre-reboot marker. After a manual reboot, `npm run proof:raspberry-reboot-evidence -- --collect` writes the evidence file consumed by `proof:raspberry-reboot-recovery`. See [`raspberry_reboot_evidence_generator_proof.md`](raspberry_reboot_evidence_generator_proof.md).

## Raspberry managed cron preflight

`npm run proof:raspberry-cron-preflight` checks whether the PF_login managed three-worker cron rows exist. `npm run proof:raspberry-cron-preflight -- --install` installs/replaces only the PF_login managed block. See [`raspberry_cron_preflight_proof.md`](raspberry_cron_preflight_proof.md).


## Raspberry executable-permission repair

`npm run proof:raspberry-executable-permissions` checks whether the project-owned Raspberry launcher/proof entrypoints are executable. `npm run proof:raspberry-executable-permissions -- --repair` repairs known repo-local executable bits after ZIP extraction, then writes proof evidence. See [`raspberry_executable_permissions_proof.md`](raspberry_executable_permissions_proof.md).

## Raspberry env preflight

`npm run proof:raspberry-env-preflight` checks for a parseable runtime `.env` with minimum scheduler/playback keys. `npm run proof:raspberry-env-preflight -- --create` creates `.env` from `example.env` if missing, then checks it. See [`raspberry_env_preflight_proof.md`](raspberry_env_preflight_proof.md).


## Raspberry v1.0 readiness

`npm run proof:raspberry-v1-readiness` scans latest local proof artifacts and evaluates them against the answered v1.0 release-gate matrix. It is a gate evaluator, not a substitute for target proof execution. A repaired standalone cron/app-running handoff can remove the app-running blocker, but readiness must still remain `BLOCKED` while required real-artifact gates are missing, planned, blocked, partial, timed out, failed, or unknown. See [`raspberry_v1_readiness_proof.md`](raspberry_v1_readiness_proof.md).


## Raspberry worker startup smoke

`npm run proof:raspberry-worker-startup-smoke` starts the three scheduler worker commands and reports whether they exit cleanly after executable/env preflights. `-- --prepare` repairs executable bits and creates `.env` from `example.env` first. See [`raspberry_worker_startup_smoke_proof.md`](raspberry_worker_startup_smoke_proof.md).

| Raspberry address overlay device display | `npm run proof:raspberry-address-overlay-device-display` | Operator/evidence gate for native device display address overlay. |
| Address overlay proof marker contract | `npm run proof:address-overlay-proof-marker-contract` | Generates the visible `PF_ADDR_<run_id>` marker used to link later visual evidence to a proof run. |
| Raspberry address overlay display command | `npm run proof:raspberry-address-overlay-display-command` | Attempts configured Raspberry display command with rendered marker artifact; does not prove visual visibility. |

| Raspberry regular worker product pipeline | `npm run proof:raspberry-regular-stage-worker-product-pipeline` | Evidence gate for real regular_stage_worker download/index/GPS/geocode/queue work. |

| Raspberry app-running target pack | `npm run proof:raspberry-app-running-target-pack` | Runs the setup/startup/cron/app-running/geocode/native-playback target chain, packages an uploadable ZIP, and summarizes v1 readiness blockers. Interpret each step by its internal `proof_status`; shell exit code alone is not proof truth. |

| Raspberry address overlay evidence template | `npm run proof:raspberry-address-overlay-template` | Writes a non-claiming operator evidence JSON template for the address overlay gate. |

| Raspberry regular product evidence template | `npm run proof:raspberry-regular-product-template` | Writes a non-claiming operator evidence JSON template for regular_stage_worker product pipeline proof. |

| Raspberry iCloudPD preflight | `npm run proof:raspberry-icloudpd-preflight` | Discovers local iCloudPD readiness without login/download claims. |

| Local/generated media pipeline rehearsal | `npm run proof:local-generated-media-pipeline-rehearsal` | Windows-safe generated-media rehearsal for product pipeline fixtures without iCloud/Raspberry claims. |

| Docs reconciliation audit | `npm run proof:docs-reconciliation-audit` | Critical v1 docs audit pre-pass for missing docs and known contradictory claims. |

| OpenSpec v1 audit | `npm run proof:openspec-v1-audit` | Static audit that critical Raspberry v1 OpenSpec docs exist and include status, purpose/goal, and non-claims sections. |

Tracked `tools/mpv/windows/.gitkeep` and `tools/mpv/windows/README.md` are allowed documentation/placeholders for the Windows mpv directory contract; runtime mpv binaries remain ignored and must not be vendored.

## Overall project completeness registry proof

- [Overall Project Completeness Registry Proof](overall_project_completeness_registry_proof.md) validates the completeness registry, status enums, planned-vs-implemented proof command split, source paths, and Debug runtime non-claims.


## Debug page keybook

| Debug page keybook | `npm run proof:debug-page-keybook` | Validates Debug Page Keybook entries, stable ID uniqueness, file/doc/test/proof references, runtime data-ui-element-id source markers, `*` inspector marker contract, and local metadata modal contract without claiming real provider/runtime behavior. |
| Debug page world-class plan | `npm run proof:debug-page-world-class-plan` | Validates the Debug page world-class OpenSpec and max-scope 4-batch/18-slice plan without claiming the slices are implemented. |

| Debug page keybook render | `npm run proof:debug-page-keybook-render` | Source-level proof for rendered Debug page keybook IDs, panes, toolbar, markers, modal, behavior registry, and proof input panel. |
| Debug page style contract | `npm run proof:debug-page-style-contract` | Source-level proof for visual toolbar/schema/mode/status/marker/modal CSS; not a screenshot proof. |
| Debug page world-class reconciliation | `npm run proof:debug-page-world-class-reconciliation` | Reconciles world-class OpenSpec, sliceplan, keybook, behavior, proof input, and style contracts. |
| Debug page world-class completion | `npm run proof:debug-page-world-class-completion` | Scores Debug View 85%+ local proof track and generates two next batches without claiming product v1 readiness. |


## Proofrunner platform-filter contract

`npm run proof:proofrunner-platform-filter-contract` validates the queue contract that prevented the v0.8.235 RaspberryOS proofrunner from being green: Raspberry/Linux handoff launchers must exclude package-script aliases ending in `:windows`, while Windows launchers must preserve them. The skipped Windows aliases remain listed in launcher logs so the omission is explicit and auditable, not silent.

This proof does not remove the Windows wrapper proofs from `package.json`; it only prevents non-Windows launchers from executing PowerShell-only aliases such as `proof:live-windows-native-playback:windows` on RaspberryOS/Linux.


The launcher must run queue discovery from the extracted repo root (`$REPO_ROOT`) because the queue helper imports `./tools/proof-runner-queue-lib.mjs`. If queue discovery fails or returns zero proofs, the launcher must stop with a nonzero exit instead of packaging an empty proof-result ZIP.

| Auth session usable evidence producer | `npm run proof:auth-session-usable-evidence-producer` | Validates redacted operator auth/session evidence for real-provider proof inputs. |

| Real iCloud proof runbook | `npm run proof:real-icloud-proof-runbook` | Validates operator runbook and required env/artifact guidance. |

| Real iCloud filter config | `npm run proof:real-icloud-filter-config` | Validates normalized real download filter config/signature. |

| Real iCloud controlled download dir | `npm run proof:real-icloud-controlled-download-dir` | Validates proof-owned download directory setup. |

| Real iCloud batch 1 producer | `npm run proof:real-icloud-batch1-producer` | Validates first real batch manifest when supplied. |

| Real iCloud batch 2 producer | `npm run proof:real-icloud-batch2-producer` | Validates second real batch manifest when supplied. |

| Real iCloud no-loop producer | `npm run proof:real-icloud-no-loop-producer` | Validates batch1/batch2 no-overlap artifacts. |

| Real provider artifact redaction | `npm run proof:real-provider-artifact-redaction` | Audits configured artifacts for secret-like values. |

| Download partial file safety | `npm run proof:download-partial-file-safety` | Rejects zero-byte/temp/partial manifest items. |

| Real iCloud download report | `npm run proof:real-icloud-download-report` | Summarizes auth/filter/dir/batch/no-loop/redaction checks. |

| Regular worker real download bridge | `npm run proof:regular-worker-real-download-bridge` | Gates worker bridge on real no-loop evidence and opt-in. |

| Regular worker consumes download manifest | `npm run proof:regular-worker-consumes-download-manifest` | Gates worker manifest consumption on evidence and opt-in. |

| Regular worker filter signature | `npm run proof:regular-worker-filter-signature` | Checks worker filter signature alignment with manifest. |

| Operator status real download | `npm run proof:operator-status-real-download` | Reports real download sections without hiding blocked states. |

| Real download error classification | `npm run proof:real-download-error-classification` | Classifies auth/filter/manifest/no-loop/secret blocked states. |

| Real iCloud evidence run package | `npm run proof:real-icloud-evidence-run-package` | Validates the grouped operator evidence package for auth/filter/download/manifests/no-loop/redaction. |

| Real iCloud evidence ZIP contract | `npm run proof:real-icloud-evidence-zip-contract` | Validates the uploadable evidence ZIP/package manifest contract and secret-safety requirements. |

| Operator-safe iCloud session checkpoint | `npm run proof:operator-safe-icloud-session-checkpoint` | Validates B1.1/B1.2 operator-safe real iCloud readiness ordering, auth-session evidence requirement, and secret-safety boundaries. |
