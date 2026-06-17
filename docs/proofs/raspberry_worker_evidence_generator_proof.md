# Raspberry worker evidence generator

Version introduced: v0.8.49  
Status: Implemented evidence generator / target evidence required

Run:

```bash
npm run proof:raspberry-worker-evidence
```

The generator writes a sanitized worker evidence file under `runtime_data/raspberry_worker_evidence/`, updates `runtime_data/raspberry_worker_evidence/latest.json`, and prints the environment assignment accepted by the cron worker runtime proof:

```bash
PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE=<generated file> npm run proof:raspberry-cron-worker-runtime
```

In v0.8.115+, downstream cron/app-running proofs also auto-load `runtime_data/raspberry_worker_evidence/latest.json` when `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE` is not exported. Exporting the variable remains supported as an explicit override.

The generator does not fabricate missing worker facts. On Raspberry, the default collection mode runs a proof-owned worker evidence harness that observes invocation, duplicate-skip, cross-worker independence, and stale-lock reclaim for `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker`. Off-target or when `PF_RASPBERRY_WORKER_EVIDENCE_MODE=runtime-files` is set, it reads existing status/lock evidence. If complete evidence is not present, the generator writes an incomplete evidence file and returns `BLOCKED`.

This command does not install cron, reboot the Raspberry, perform power-loss recovery, or prove monitor pixels/production iCloud continuation.


## v0.8.51 status/lock instrumentation

`regular_stage_worker` and `screen_on_off_worker` now have scheduler CLI status/lock instrumentation that writes files under `runtime_data/scheduler/`. The workers are instrumentation-only and do not claim real pipeline or physical screen-control work. `playback_worker` status output also includes evidence-compatible fields.
