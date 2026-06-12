# Raspberry worker evidence generator

Version introduced: v0.8.49  
Status: Implemented evidence generator / target evidence required

Run:

```bash
npm run proof:raspberry-worker-evidence
```

The generator writes a sanitized worker evidence file under `runtime_data/raspberry_worker_evidence/` and prints the environment assignment needed by the cron worker runtime proof:

```bash
PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE=<generated file> npm run proof:raspberry-cron-worker-runtime
```

The generator does not fabricate missing worker facts. It reads status/lock evidence for `regular_stage_worker`, `playback_worker`, and `screen_on_off_worker`. If regular or screen worker evidence is not present yet, the generator writes an incomplete evidence file and returns `BLOCKED`.

This command does not install cron, reboot the Raspberry, perform power-loss recovery, or prove monitor pixels/production iCloud continuation.
