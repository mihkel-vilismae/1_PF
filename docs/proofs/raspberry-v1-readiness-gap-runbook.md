# Raspberry v1 readiness gap runbook

`npm run proof:raspberry-v1-readiness` reads the latest JSON artifacts under `runtime_data/proofs/` and evaluates them against the Raspberry v1 release gates. It does not run missing proofs by itself and it must not turn `BLOCKED`, `FAILED`, `MISSING`, or `PLANNED` evidence into a pass.

## Interpreting the gap report

The readiness artifact includes a sanitized `readiness_gap_report` for required gates that are not yet passed. Each gap lists:

- the gate id and title,
- blocking proof kinds,
- the next command or explicit `planned proof command not implemented yet` marker.

A gate is ready only when every required proof kind for that gate has a latest `PASSED` artifact. Planned proof commands are still blockers; they are intentionally not counted as passed.

## Recommended Raspberry order

```bash
npm run proof:raspberry-executable-permissions -- --repair
npm run proof:raspberry-env-preflight -- --create
npm run proof:raspberry-worker-startup-smoke -- --prepare
npm run proof:raspberry-cron-preflight
npm run proof:raspberry-worker-evidence
npm run proof:raspberry-cron-worker-runtime
npm run proof:raspberry-app-running-status
npm run proof:raspberry-app-running-chain
npm run proof:raspberry-app-running-pass
npm run proof:raspberry-v1-readiness
```

Real-provider proofs such as iCloudPD and real geocode remain opt-in and must be run only with operator-approved credentials/configuration. Artifacts should prove status and sanitized facts, not secret values or raw provider output.

## Non-claims

A blocked readiness artifact does not prove v1 readiness. A passed Windows proof does not substitute for Raspberry target evidence. Reboot and physical power-loss recovery are non-v1 blockers unless a future release gate explicitly changes that contract.
