# V2 real cron short-wrapper XACR repair — 2026-06-28

## Context

The `v0.10.81` seconds-based cron runtime proof failed before cron could run. The managed crontab block contained a single very long command with the repository path, `PATH`, proof environment variables, output redirection, and the proof-loop call all inline. The target crontab rejected it with `command too long`.

## XACR decision

The correct repair is:

```text
crontab = one short managed line
wrapper script = all long repo/PATH/env/logging/proof-loop logic
runtime proof = verify wrapper ran after the wait marker
final bundle = accept cron-runtime proof instead of requiring worker-once fallback proofs
```

## Implemented solution

`proof:v2-install-real-crontab` now creates a generated executable wrapper script at:

```text
$HOME/.photoframe_v2/cron/proof_loop.sh
```

The managed crontab block now uses one short command:

```text
# BEGIN PHOTOFRAME_V2_MANAGED_CRON
* * * * * /bin/bash '$HOME/.photoframe_v2/cron/proof_loop.sh'
# END PHOTOFRAME_V2_MANAGED_CRON
```

The wrapper script contains the long logic:

```text
repo root
PATH
PF_V2_CRON_PROOF_SECONDS
PF_V2_CRON_PROOF_INTERVAL_SECONDS
PF_V2_CRON_PROOF_SOURCE
wrapper log path
proof-loop entry log path
bash tools/v2-cron-proof-loop.sh
```

## Runtime proof repair

`proof:v2-real-cron-runtime` now checks:

```text
cron wrapper log exists
wrapper wrote WRAPPER_START after wait marker
a cron proof-loop log exists
worker truth files exist
post-marker worker truth events exist
events identify source=cron-proof-loop/cron/scheduler
playback media_started/media_finished/queue_advanced exist after marker
```

## Final bundle repair

`proof:v2-final-autonomous-bundle` now accepts `v2_real_cron_runtime=PASSED` as stronger evidence than the worker-once proof artifacts. Worker-once proofs remain registered and usable as fallback evidence, but they are no longer mandatory when cron-runtime proof passes.

## Acceptance

`v0.10.82` is successful when the target prooflauncher can install the managed crontab, wait for the short wrapper to fire, record post-marker worker truth, and produce a final autonomous bundle without requiring worker-once artifacts.
