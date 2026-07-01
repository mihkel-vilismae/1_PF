# Terminal Demo start_stage_modal docs proof

Proof command:

```bash
npm run proof:terminal-demo-start-stage-modal-docs
```

The proof statically guards the operator documentation and launcher copy for the real-demo `start_stage_modal` feature.

It checks that:

- `terminal/demo/README.md` documents `S` opening `start_stage_modal`.
- The modal key table includes `1` disabled Download and enabled keys `2`-`5`.
- The docs describe independent per-stage `batch_size` values with default `1` and allowed values `1` and `3`.
- The OpenSpec records the shared `regular-stage-worker` command contract and `noCron=true`.
- `RUN_TERMINAL_DEMO_REAL.CMD` and `terminal/demo/windows_runner_real.cmd` visibly mention the modal and the disabled Download row.
- Package scripts register all start-stage-modal proofs.

This proof is docs/launcher-only. It does not run workers, install cron, start Download, alter the DB schema, or claim production Raspberry readiness.
