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
| Real iCloudPD pipeline | `npm run proof:real-icloudpd` | opt-in real provider |
| Real geocode provider | `npm run proof:geocode-provider` | opt-in real provider |
| Real geocode provider chain | `npm run proof:real-geocode-provider-chain` | opt-in real network provider |
| GPS fallback parsing | `npm run proof:gps-fallback` | deterministic local |
| Deterministic media pipeline | `npm run proof:deterministic-media-pipeline` | deterministic local |
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

The table above is intentionally complete for current `proof:*` package scripts. `tests/docsNpmScriptReferences.test.js` guards active documentation against stale `npm run ...` script references.

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

## Windows native proof milestone

`docs/proofs/windows_native_proof_milestone_v0.8.26.md` is the consolidated proof-status snapshot for the v0.8.26 Windows target-machine checkpoint. It records the PASSED Windows native image/video/recovery/scheduler-loop evidence and states Windows Task Scheduler is out of scope and keeps non-claims explicit for full Windows reboot, Raspberry cron/reboot/power-loss recovery, monitor-pixel proof, production iCloud continuation, and vendored media tooling.

## Windows scheduler scope

Windows Task Scheduler is not part of PF_login project scope. Task Scheduler-only proof files, scripts, and recommendations were removed in v0.8.29. The supported Windows scheduler evidence path is the proof-owned scheduler loop proof.

## Windows reboot/restart recovery preflight

`npm run proof:windows-reboot-recovery-preflight` validates the project-owned Windows recovery proof contract without rebooting. It checks required launchers and proof scripts, local-only media-tool ignore boundaries, cleanup rules, and non-claims. Windows Task Scheduler is not part of PF_login project scope and the preflight does not use `schtasks.exe`.
## Raspberry OS proof planning

The Raspberry OS implementation path is documented first as OpenSpec, not as a runtime proof claim: `docs/20_architecture_and_specs/openspec/raspberry_os_missing_features_openspec.md`. It marks Raspberry runtime launcher, local tool checker, native image/video playback, address overlay, path portability, project-owned scheduler loop, worker autostart, screen on/off behavior, generated fixture validation on Raspberry, controlled recovery, manual reboot recovery, power-loss recovery, evidence export, and operator guide work as not implemented/not proven unless later evidence says otherwise.

Windows Task Scheduler is not part of PF_login project scope; the Raspberry OpenSpec does not reintroduce it as a project path.

## Raspberry tool checker proof

`npm run proof:raspberry-tool-checker` checks Raspberry target readiness for `mpv`, `ffmpeg`, and `ffprobe`. It returns `PASSED` only on a Raspberry-like target with all tools available, and returns `BLOCKED` for off-target or missing-tool runs. It does not prove Raspberry playback, scheduler behavior, reboot recovery, power-loss recovery, display focus, monitor pixels, or production iCloud continuation.

- `npm run proof:raspberry-generated-fixtures` — Raspberry target generated fixture validation; see `raspberry_generated_fixture_proof.md`.

## Raspberry generated fixture proof

`npm run proof:raspberry-generated-fixtures` validates `generated_test_data/` on a Raspberry-like target using `python3` and `ffprobe`. It returns `BLOCKED` off-target or when prerequisites are missing, and does not prove native playback, scheduler behavior, recovery, display focus, or production iCloud continuation. See [`raspberry_generated_fixture_proof.md`](raspberry_generated_fixture_proof.md).

## Raspberry native image playback proof

`npm run proof:raspberry-native-image-playback` is the first target-gated Raspberry native playback proof. It selects `generated_test_data/gps_valid/gps_valid_01.jpg`, records the project-owned Raspberry launcher dry-run boundary, and starts a bounded `mpv` fullscreen image command only on a non-override Raspberry-like display target with `mpv` available. Off-target, explicit-override, missing-display, missing-tool, or missing-fixture runs return `BLOCKED`. See [`raspberry_native_image_playback_proof.md`](raspberry_native_image_playback_proof.md).
## Raspberry native video playback proof

`npm run proof:raspberry-native-video-playback` is the target-gated Raspberry native video playback proof. It selects `generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4`, records the project-owned Raspberry launcher dry-run boundary, records duration/media metadata with `ffprobe`, and starts a bounded `mpv` fullscreen video command only on a non-override Raspberry-like display target with `mpv` and `ffprobe` available. Off-target, explicit-override, missing-display, missing-tool, or missing-fixture runs return `BLOCKED`. See [`raspberry_native_video_playback_proof.md`](raspberry_native_video_playback_proof.md).


## Raspberry cron worker singleton and recovery proof plan

`docs/proofs/raspberry_cron_worker_singleton_recovery_proof.md` defines the proof evidence required before PhotoFrame can honestly claim the Raspberry app is running through cron. The required app-running definition is active cron plus all three worker lanes: `regular_stage_worker` every 10 minutes, `playback_worker` every 1 minute, and `screen_on_off_worker` every 3 minutes.

The plan requires same-worker singleton checks, duplicate same-worker skip evidence, cross-worker independence, stale-lock reclaim, and separate reboot/restored-power evidence. It is documentation-only in v0.8.44 and does not prove Raspberry cron, reboot recovery, power-loss recovery, monitor-pixel proof, production iCloud continuation, or real provider chains.

## Raspberry cron worker runtime proof

`npm run proof:raspberry-cron-worker-runtime` implements the target-gated Raspberry app-running proof runner. It requires active managed cron rows and an operator evidence file proving invocation, same-worker singleton duplicate-skip, cross-worker independence, and stale-lock reclaim for `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker`. See [`raspberry_cron_worker_runtime_proof.md`](raspberry_cron_worker_runtime_proof.md).

## Raspberry app-running status proof

`npm run proof:raspberry-app-running-status` converts cron worker runtime proof evidence into an app-running status summary. See [`raspberry_app_running_status_proof.md`](raspberry_app_running_status_proof.md).

## Raspberry reboot recovery proof

`npm run proof:raspberry-reboot-recovery` validates manual pre/post reboot evidence and requires the three-worker app-running status to pass after reboot. See [`raspberry_reboot_recovery_proof.md`](raspberry_reboot_recovery_proof.md).

## Raspberry physical power-loss recovery proof

`npm run proof:raspberry-power-loss-recovery` validates explicit physical power-loss/restored-power evidence and requires the three-worker app-running status to pass after restored power. It never uses Windows CronEmulator evidence as hardware proof. See [`raspberry_power_loss_recovery_v2_proof.md`](raspberry_power_loss_recovery_v2_proof.md).

## Raspberry worker evidence generator

`npm run proof:raspberry-worker-evidence` generates the `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE` consumed by `npm run proof:raspberry-cron-worker-runtime`. It reads worker status/lock evidence for all three Raspberry worker lanes and remains `BLOCKED` rather than faking missing regular/screen worker evidence. See [`raspberry_worker_evidence_generator_proof.md`](raspberry_worker_evidence_generator_proof.md).

## Raspberry app-running PASS chain proof

`npm run proof:raspberry-app-running-chain` runs worker evidence generation, cron worker runtime proof, and app-running status proof in one chain. See [`raspberry_app_running_chain_proof.md`](raspberry_app_running_chain_proof.md).

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

`npm run proof:raspberry-v1-readiness` scans latest local proof artifacts and evaluates them against the answered v1.0 release-gate matrix. It is a gate evaluator, not a substitute for target proof execution. See [`raspberry_v1_readiness_proof.md`](raspberry_v1_readiness_proof.md).


## Raspberry worker startup smoke

`npm run proof:raspberry-worker-startup-smoke` starts the three scheduler worker commands and reports whether they exit cleanly after executable/env preflights. `-- --prepare` repairs executable bits and creates `.env` from `example.env` first. See [`raspberry_worker_startup_smoke_proof.md`](raspberry_worker_startup_smoke_proof.md).

| Raspberry address overlay device display | `npm run proof:raspberry-address-overlay-device-display` | Operator/evidence gate for native device display address overlay. |
