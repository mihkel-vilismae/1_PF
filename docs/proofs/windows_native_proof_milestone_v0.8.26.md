# Windows native proof milestone — v0.8.26

Version: 1.0.0
Date: 2026-06-05
Status: current proof milestone snapshot for PF_login v0.8.26

## Purpose

This document consolidates the Windows native proof checkpoint reached at PF_login v0.8.26. It records which target-machine proof claims are currently supported by sanitized proof artifacts and which related claims remain explicitly out of scope.

## Baseline

| Field | Value |
|---|---|
| Repository version | `0.8.26` |
| Baseline ZIP | `PF_login--v0.8.26--live-windows-scheduler-proof-evidence-full_git.zip` |
| Commit | `c1ad0f7 test: collect live scheduler proof evidence` |
| Platform scope | Windows target-machine proof runs |
| Proof artifact location | `runtime_data/proofs/` on the target machine; evidence ZIPs exported to Downloads by proof launchers |

## Passed Windows target proofs

| Capability | Command / launcher | Target evidence status | What the proof supports |
|---|---|---:|---|
| Generated video fixture validation | `npm run proof:verify-generated-test-data` | PASSED | Fixture directories, manifests, checksums, README paths, `ffprobe`, H.264/AAC stream metadata, resolution, duration, and location-tag semantics validated. |
| Native Windows image playback | `start_live_windows_native_playback_proof.cmd` | PASSED | Proof-owned API/native playback launched a selected image through repo-local/local-only `mpv`; owned process stop succeeded. |
| Native Windows worker-autostart image playback | `start_live_windows_native_playback_proof.cmd -WorkerAutostart` | PASSED | Playback worker selected the item and the native playback path launched the same media asset; worker output was parsed into the proof envelope. |
| Native Windows video playback | `start_live_windows_native_video_playback_proof.cmd` | PASSED | Test Mode proof seed selected `generated_test_data/videos_with_gps/apple_like_h264_mp4_gps_new_york.mp4`; native status reported `currentMediaType=video`; owned stop succeeded. |
| Controlled Windows native recovery | `start_live_windows_native_recovery_proof.cmd` | PASSED | Proof-owned API process was stopped and restarted; the same selected item was restored and native playback relaunched; owned stop succeeded. |
| Proof-owned live Windows scheduler loop | `start_live_windows_scheduler_proof.cmd` | PASSED | Proof-owned scheduler loop invoked regular, playback, and screen-on-off workers, recorded call timestamps/counts, and verified duplicate playback worker lock protection. |

## Explicit non-claims

These proof results do not claim the following:

- Windows Task Scheduler installation or startup integration.
- Full Windows reboot recovery.
- Raspberry playback, Raspberry cron, Raspberry reboot, or Raspberry power-loss recovery.
- Monitor-pixel verification, screen-focus verification, or long-running physical display stability.
- Production iCloud download continuation or real-account provider behavior.
- Vendored media tooling in Git. `tools/mpv/` and `tools/ffmpeg/` are intentionally local-only ignored tool bundles and must not be re-added to Git or Git history.

## Evidence interpretation rules

- `PASSED` means the target proof command ran and wrote sanitized evidence for the named behavior.
- `BLOCKED` means a prerequisite was missing and should not be treated as success.
- Proof-owned launchers may start and stop only processes they own.
- Test Mode proof seed behavior must remain isolated from normal production playback ordering.
- Local media tool bundles may exist on the operator machine but should remain ignored and absent from baseline ZIP history.

## Recommended next proof work

| Priority | Next proof | Reason |
|---:|---|---|
| 1 | Windows Task Scheduler proof | The v0.8.26 scheduler proof is a proof-owned bounded scheduler loop, not real Windows Task Scheduler. |
| 2 | Windows reboot recovery proof | Controlled API restart is proven, but full OS reboot recovery is not. |
| 3 | Raspberry playback/recovery proof | Raspberry cron, reboot, and power-loss claims still need hardware evidence. |
| 4 | Long-run display observation proof | Native launch/stop is proven, but extended display/focus/pixel behavior is not. |

## CHANGELOG

| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-06-05 | Added consolidated v0.8.26 Windows native proof milestone snapshot with passed proof matrix, non-claims, evidence interpretation rules, and next proof priorities. |
