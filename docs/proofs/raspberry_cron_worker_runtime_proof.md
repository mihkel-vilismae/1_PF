# Raspberry cron worker runtime proof

Version introduced: v0.8.45  
Status: Implemented proof runner / target evidence required

Run:

```bash
npm run proof:raspberry-cron-worker-runtime
```

The proof is target-gated and writes sanitized JSON under `runtime_data/proofs/`. It returns `BLOCKED` off-target, when crontab cannot be read, when any of the three managed cron rows are missing, or when no explicit `PF_RASPBERRY_CRON_WORKER_EVIDENCE_FILE` and no latest generated worker-evidence manifest are available. In v0.8.116+, it auto-loads `runtime_data/raspberry_worker_evidence/latest.json` after `npm run proof:raspberry-worker-evidence`; the environment variable remains an explicit override.

In v0.8.121+, the auto-loader accepts the portable `evidence_file` manifest field, the older `evidenceFile` field, repo-relative paths, manifest-relative paths, and explicit environment overrides. It rejects redacted machine-readable references such as `[REDACTED]` with `BLOCKED` instead of silently passing.

A `PASSED` result requires all three worker lanes: `regular_stage_worker` every 10 minutes, `playback_worker` every 1 minute, and `screen_on_off_worker` every 3 minutes. Operator evidence must show invocation, same-worker singleton duplicate-skip behavior, cross-worker independence, and stale-lock reclaim for every lane. Incomplete loaded evidence remains `BLOCKED` and is not treated as a pass.

This proof does not install cron, reboot the Raspberry, perform physical power-loss recovery, prove monitor pixels, prove production iCloud continuation, or prove real provider chains.
