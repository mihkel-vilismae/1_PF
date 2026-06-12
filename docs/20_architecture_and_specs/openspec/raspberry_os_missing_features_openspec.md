# Raspberry OS missing feature OpenSpec

Version introduced: v0.8.31  
Status: OpenSpec / documentation-only contract  
Runtime behavior changed by this document: none

## Purpose

This OpenSpec defines the missing Raspberry OS feature set for PF_login before implementation begins. It translates the already-proven Windows proof ladder into Raspberry-specific contracts without claiming Raspberry playback, cron, reboot, or power-loss recovery.

The document is intentionally a planning contract. Code, tests, generated proof artifacts, and target-machine Raspberry evidence remain the source of truth for implementation status.

## Baseline context

The active baseline before this OpenSpec was v0.8.30. It already preserves these Windows-side proof checkpoints:

| Area | Status |
|---|---:|
| Generated video fixture validation | PASSED |
| Native Windows image playback | PASSED |
| Native Windows worker-autostart image playback | PASSED |
| Native Windows video playback | PASSED |
| Controlled Windows native recovery | PASSED |
| Proof-owned live Windows scheduler loop | PASSED |
| Windows reboot/restart recovery preflight | PASSED |

Those Windows results do not prove Raspberry OS behavior. They provide reusable proof patterns only.

## Scope

Raspberry OS support must eventually provide a target-machine path for:

1. Raspberry OS runtime launcher.
2. Raspberry local tool checker/installer preflight for `mpv`, `ffmpeg`, and `ffprobe` (implemented in v0.8.37; installer remains operator-managed).
3. Raspberry native fullscreen image playback (implemented as a target-gated proof runner in v0.8.40; target PASS still requires Raspberry/display/`mpv` evidence).
4. Raspberry native fullscreen video playback.
5. Raspberry address/location overlay strategy.
6. Raspberry path, environment, and runtime-data portability.
7. Raspberry project-owned scheduler loop.
8. Raspberry worker autostart after boot.
9. Raspberry screen on/off worker behavior.
10. Raspberry cron worker runtime contract for app-running: active cron plus `regular_stage_worker` every 10 minutes, `playback_worker` every 1 minute, and `screen_on_off_worker` every 3 minutes, with singleton, duplicate-skip, cross-worker independence, and stale-lock recovery proof requirements.
10. Raspberry generated fixture validation proof.
11. Raspberry controlled process recovery proof.
12. Raspberry manual reboot recovery proof.
13. Raspberry power-loss recovery proof.
14. Raspberry evidence bundle export.
15. Raspberry HOW_TO_RUN/operator guide.

## Non-goals

- Do not change runtime behavior in the OpenSpec slice.
- Do not claim Raspberry native playback is implemented.
- Do not claim Raspberry generated fixture validation has run on target hardware.
- Do not claim Raspberry cron, reboot, or power-loss recovery is proven.
- Do not vendor Raspberry `mpv`, `ffmpeg`, or `ffprobe` binaries into Git.
- Do not re-track local `tools/mpv/` or `tools/ffmpeg/` bundles.
- Do not require Windows Task Scheduler. Windows Task Scheduler is not part of PF_login project scope.
- Do not silently translate Windows paths into Raspberry paths. The path boundary must be explicit.
- Do not treat system cron or systemd as proven until a dedicated target-machine proof is added and explicitly approved.

## Status vocabulary

Raspberry proof docs and artifacts must use the same status vocabulary as the rest of PF_login:

| Status | Meaning for Raspberry OS |
|---|---|
| `NOT_IMPLEMENTED` | The contract exists, but code/launcher/proof behavior has not been added. |
| `NOT_RUN` | Implementation or proof exists, but no target-machine proof has been executed. |
| `BLOCKED` | The proof was attempted but required hardware, display, package, session, or config was unavailable. |
| `PASSED` | The exact behavior was observed on the intended target and sanitized evidence was written. |
| `FAILED` | The attempted behavior produced evidence of failure. |

## Feature contracts

### 1. Raspberry OS runtime launcher

Status: `NOT_IMPLEMENTED`

Contract:

- Provide a project-owned launcher for Raspberry OS.
- Set repo root, runtime environment, log folder, and proof artifact paths explicitly.
- Avoid Windows-only shell syntax.
- Prefer a shell script such as `start_raspberry_full.sh` or `scripts/start_raspberry_full.sh` when implemented.
- Emit sanitized startup evidence under ignored runtime/log paths.

Expected future artifacts:

- launcher script
- setup/run documentation
- smoke/preflight proof JSON

### 2. Raspberry local tool checker/installer preflight

Status: `IMPLEMENTED_PREFLIGHT` as of v0.8.37; target-machine PASS still requires Raspberry-like hardware/OS and available tools. Installer behavior remains operator-managed and is not implemented.

Contract:

- Verify `mpv`, `ffmpeg`, and `ffprobe` availability using PATH or a documented local operator install path.
- Never commit downloaded system binaries to Git.
- Preserve `tools/mpv/` and `tools/ffmpeg/` as local-only ignored tool bundles if present on a developer machine.
- Report missing tools as `BLOCKED`, not `FAILED`, unless an install/check command itself errors unexpectedly.
- Use `npm run proof:raspberry-tool-checker` for the implemented preflight.
- Do not treat a non-Raspberry or override-based run as Raspberry target proof.

Implemented command:

```bash
mpv --version
ffmpeg -version
ffprobe -version
```

### 3. Raspberry native fullscreen image playback

Status: `IMPLEMENTED_TARGET_GATED_PROOF` as of v0.8.40; target-machine PASS still requires non-override Raspberry-like display hardware/session and `mpv`.

Contract:

- Launch a deterministic generated image fixture on the Raspberry display using a bounded proof-owned `mpv` process.
- Use `npm run proof:raspberry-native-image-playback` for the implemented target-gated proof.
- Record project-owned launcher dry-run evidence, selected media identity, native command shape, process result, and stop boundary evidence.
- Do not kill arbitrary `mpv`, `vlc`, `node`, or system processes by name.
- Native playback remains disabled by default outside explicit proof/operator mode.

### 4. Raspberry native fullscreen video playback

Status: `NOT_IMPLEMENTED`

Contract:

- Launch a deterministic or selected video item on Raspberry using native playback.
- Verify the media identity and media type are video.
- Prefer generated test video fixtures for deterministic proof setup before real iCloud videos are used.
- Record missing video/tool/display conditions as `BLOCKED`.

### 5. Raspberry address/location overlay strategy

Status: `NOT_IMPLEMENTED`

Contract:

- Decide how address captions are displayed on Raspberry target playback.
- Native `mpv` alone may not provide the same HTML overlay as the browser dashboard.
- Acceptable future strategies include browser fullscreen display, generated subtitle/OSD overlay, composed media surface, or a split display controller.
- The strategy must prove that the selected media and resolved address text reach the display-facing surface.

### 6. Raspberry path/env/runtime-data portability

Status: `NOT_IMPLEMENTED`

Contract:

- Define Linux/Raspberry paths for repo root, runtime data, logs, proof artifacts, generated test data, and local environment files.
- Avoid hardcoded Windows drive paths.
- Keep private local paths out of proof artifacts through sanitization.
- Preserve ignored runtime data boundaries.

Recommended future path shape:

```text
runtime_data/proofs/
runtime_data/logs/
runtime_data/raspberry/
```

### 7. Raspberry project-owned scheduler loop

Status: `NOT_IMPLEMENTED`

Contract:

- Reuse the project-owned scheduler-loop pattern proven on Windows where possible.
- Invoke regular, playback, and screen on/off worker entrypoints through bounded proof-owned calls.
- Preserve duplicate-lock protection for playback workers.
- Do not conflate this loop with system cron/systemd proof.

### 7a. Raspberry cron worker runtime contract

Status: `OPENSPEC_DEFINED` as of v0.8.44; runtime proof not implemented

Contract:

- Do not call the Raspberry PhotoFrame app running unless cron is active and all three worker lanes are operational.
- The required worker lanes are `regular_stage_worker` every 10 minutes, `playback_worker` every 1 minute, and `screen_on_off_worker` every 3 minutes.
- Each worker lane must prove same-worker singleton behavior before real work.
- Duplicate invocations of the same worker must skip safely and leave evidence.
- Different worker types must not block each other merely because one worker lane is active.
- Stale locks after dirty shutdown, reboot, or restored power must be reclaimed or invalidated safely.
- See `raspberry_cron_worker_runtime_openspec.md` and `docs/proofs/raspberry_cron_worker_singleton_recovery_proof.md`.

### 8. Raspberry worker autostart after boot

Status: `NOT_IMPLEMENTED`

Contract:

- Define how PF_login is started after Raspberry OS boot without claiming it is proven.
- A future proof may use operator-managed autostart, project-owned launcher invocation, cron, or systemd only if that mechanism is explicitly documented and approved.
- Evidence must distinguish configured autostart, observed process startup, worker execution, and playback readiness.

### 9. Raspberry screen on/off worker behavior

Status: `NOT_IMPLEMENTED`

Contract:

- Define Raspberry display power commands or display-session behavior separately from Windows/browser UI state.
- Evidence must report target display stack, command executed, exit code, and sanitized output.
- If no display/session is available, report `BLOCKED`.

### 10. Raspberry generated fixture validation proof

Status: `NOT_IMPLEMENTED`

Contract:

- Run the existing generated media fixture validation on Raspberry with a local `ffprobe`.
- Confirm generated fixture count, metadata expectations, video fixture validity, and no zero-byte blocker paths.
- Do not treat Windows fixture validation as Raspberry fixture validation.

Expected future command:

```bash
npm run proof:verify-generated-test-data
```

### 11. Raspberry controlled process recovery proof

Status: `NOT_IMPLEMENTED`

Contract:

- Prove controlled stop/restart of PF_login API/playback processes on Raspberry before full reboot or power-loss proof.
- Preserve selected media/checkpoint identity before and after controlled restart.
- Stop only proof-owned processes.

### 12. Raspberry manual reboot recovery proof

Status: `NOT_IMPLEMENTED`

Contract:

- Provide a two-step target proof: prepare-before-reboot, then resume-after-manual-reboot.
- The proof runner must not reboot the device automatically unless a later explicitly approved slice adds that behavior.
- Evidence must include pre-reboot marker, post-reboot marker, repo version/commit, selected media/checkpoint continuity, scheduler readiness, and playback readiness.

### 13. Raspberry power-loss recovery proof

Status: `NOT_IMPLEMENTED` / existing collector is `BLOCKED` unless explicit hardware evidence is supplied

Contract:

- A real proof requires actual Raspberry power interruption or an explicitly equivalent target-machine hardware event.
- The existing `proof:raspberry-recovery` collector is an evidence collector, not proof that power loss occurred by itself.
- The operator must explicitly provide environment evidence such as power loss performed, workers started, playback safe, and startup mechanism.
- Windows CronEmulator or project-owned scheduler-loop evidence must not be counted as Raspberry hardware proof.

### 14. Raspberry evidence bundle export

Status: `NOT_IMPLEMENTED`

Contract:

- Export Raspberry logs, proof JSON, sanitized command output, tool-version output, and selected media/checkpoint summaries into a portable archive.
- Prefer `.tar.gz` on Raspberry, with `.zip` allowed when tooling is present.
- Do not include secrets, Apple IDs, cookies, raw provider output, or private absolute paths.

### 15. Raspberry HOW_TO_RUN/operator guide

Status: `NOT_IMPLEMENTED`

Contract:

- Add a Raspberry setup/run/proof guide before asking an operator to execute target-machine proofs.
- Include prerequisites, commands, expected outputs, proof artifact locations, and troubleshooting.
- Keep missing feature status honest until target evidence exists.

## Raspberry proof matrix

| Feature | Current OpenSpec status | Proof state | Next proof slice |
|---|---|---:|---|
| Runtime launcher | Contract defined | NOT_IMPLEMENTED | Launcher/preflight |
| Tool checker/installer preflight | Implemented preflight | NOT_RUN on Raspberry / BLOCKED off-target | Run `npm run proof:raspberry-tool-checker` on target |
| Native image playback | Contract defined | NOT_IMPLEMENTED | Target playback proof |
| Native video playback | Contract defined | NOT_IMPLEMENTED | Target video proof |
| Address overlay strategy | Contract defined | NOT_IMPLEMENTED | Design/proof preflight |
| Path/env portability | Contract defined | NOT_IMPLEMENTED | Portability preflight |
| Project-owned scheduler loop | Contract defined | NOT_IMPLEMENTED | Scheduler loop proof |
| Cron three-worker runtime | Contract defined in v0.8.44 | NOT_IMPLEMENTED / NOT_RUN | App-running cron worker proof |
| Worker autostart after boot | Contract defined | NOT_IMPLEMENTED | Boot-start preflight |
| Screen on/off worker | Contract defined | NOT_IMPLEMENTED | Display control proof |
| Generated fixture validation | Contract defined | NOT_RUN | Run on Raspberry target |
| Controlled process recovery | Contract defined | NOT_IMPLEMENTED | Controlled recovery proof |
| Manual reboot recovery | Contract defined | NOT_IMPLEMENTED | Manual two-step proof |
| Power-loss recovery | Contract clarified | BLOCKED unless explicit hardware evidence | Hardware/operator proof |
| Evidence bundle export | Contract defined | NOT_IMPLEMENTED | Exporter implementation |
| HOW_TO_RUN/operator guide | Contract defined | NOT_IMPLEMENTED | Operator docs slice |

## Required future proof artifact fields

Future Raspberry proof artifacts should include:

- `proof_kind`
- `proof_status`
- `platform: raspberry-os`
- `repo_version`
- `git_commit`
- `runtime_mode`
- `tool_versions`
- `selected_media_summary`
- `checkpoint_summary`
- `scheduler_evidence`
- `playback_evidence`
- `display_evidence`
- `operator_evidence` when human/hardware action is required
- `non_claims`
- `sanitization_notes`

## Recommended implementation slice order

1. Raspberry OpenSpec docs and status guards. This document.
2. Raspberry local tool checker preflight. Implemented in v0.8.37; run on Raspberry target for target evidence.
3. Raspberry path portability preflight.
4. Raspberry project-owned launcher and evidence export scaffold.
5. Raspberry generated fixture validation target proof.
6. Raspberry native image playback proof. Implemented in v0.8.40 as a target-gated proof runner; run on Raspberry target for PASS evidence.
7. Raspberry native video playback proof.
8. Raspberry project-owned scheduler loop proof.
9. Raspberry controlled process recovery proof.
10. Raspberry manual reboot recovery proof.
11. Raspberry power-loss recovery proof.
12. Raspberry address overlay/display proof refinement.

## Explicit non-claims

This OpenSpec now defines the Raspberry app-running cron worker requirement, but it still does not prove runtime cron behavior.

This OpenSpec does not prove:

- Raspberry native video playback.
- Raspberry display focus or monitor pixels.
- Raspberry generated fixture validation on hardware.
- Raspberry cron/systemd/autostart behavior.
- Raspberry app-running through all three worker lanes.
- Raspberry controlled recovery.
- Raspberry manual reboot recovery.
- Raspberry power-loss recovery.
- Production iCloud continuation.
- Windows Task Scheduler, which is out of project scope.
- Vendored `tools/mpv/` or `tools/ffmpeg/` binaries.
