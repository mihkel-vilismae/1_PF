# V2 real cron runtime seconds proofrunner XACR — 2026-06-28

## Scope

This checkpoint implements the next proofrunner slice after `v0.10.80`: prove that a managed real crontab can launch a seconds-based proof loop that writes regular/playback/screen worker truth after a recorded marker.

## XACR decision

Linux cron is minute-based. The safe way to satisfy seconds-based testing is not to pretend cron supports seconds directly. Instead:

```text
cron once per minute -> seconds-based proof loop -> worker truth events -> runtime proof PASS
```

## Implemented proof commands

```text
proof:v2-install-real-crontab
proof:v2-real-cron-runtime
proof:v2-real-cron-cleanup
```

The default prooflauncher order is now:

```text
npm install --verbose --registry=https://registry.npmjs.org/
npm run proof:v2-real-machine-readiness
npm run proof:v2-install-real-crontab
npm run proof:v2-real-cron-runtime
npm run proof:v2-real-cron-evidence
npm run proof:v2-real-playback-display
npm run proof:v2-autonomous-contract
npm run proof:v2-final-autonomous-bundle
```

Full `npm test` remains intentionally excluded from the target prooflauncher.

## Evidence behavior

The crontab installer preserves existing user crontab lines and replaces only this managed block:

```text
# BEGIN PHOTOFRAME_V2_MANAGED_CRON
* * * * * cd "<repo_root>" && ... bash tools/v2-cron-proof-loop.sh ...
# END PHOTOFRAME_V2_MANAGED_CRON
```

The runtime proof writes:

```text
runtime_data/proofs/v2_real_cron_wait_marker_*.json
runtime_data/proofs/v2_real_cron_runtime_wait_*.log
runtime_data/proofs/crontab_before.txt
runtime_data/proofs/crontab_after_install.txt
runtime_data/proofs/crontab_after_runtime.txt
runtime_data/proofs/cron_proof_loop_logs/*.log
runtime_data/v2_worker_truth/real/*.truth.jsonl
```

## Acceptance

A target run is successful when:

```text
managed crontab block is installed
pre-wait marker is written
cron launches the proof loop
worker events are written after the marker
worker events include source=cron-proof-loop / cron / scheduler
regular, playback, and screen worker truth exists
playback media_started/media_finished/queue_advanced exists
final autonomous bundle passes
```

## Boundary

This proves cron-launched backend worker truth. It still does not visually inspect the physical screen. Physical display proof remains a separate target/human/video evidence boundary.
