# Raspberry worker startup smoke proof

`npm run proof:raspberry-worker-startup-smoke` verifies that all three Raspberry scheduler worker commands can start cleanly after install/runtime preflights.

## Commands

Check using existing setup:

```bash
npm run proof:raspberry-worker-startup-smoke
```

Fresh Raspberry setup helper mode:

```bash
npm run proof:raspberry-worker-startup-smoke -- --prepare
```

`--prepare` first runs executable permission repair and `.env` creation/check before starting the worker commands.

## Worker lanes

| Worker | Scheduler command | v1.0 meaning |
|---|---|---|
| `regular_stage_worker` | `npm run api -- --scheduler regular-stage-worker` | Must start cleanly now; real product pipeline proof remains a later gate. |
| `playback_worker` | `npm run api -- --scheduler playback-worker` | Must start cleanly with `.env`; native playback/display proof remains separate. |
| `screen_on_off_worker` | `npm run api -- --scheduler screen-on-off-worker` | Must not block the cron runtime; physical screen control is not a v1.0 requirement. |

## PASS criteria

The proof can return `PASSED` only on a non-override Raspberry-like target when executable/env/database preflights pass and all three worker commands exit cleanly.

## BLOCKED criteria

The proof returns `BLOCKED` off-target, when explicit target override is used, when preflights do not pass, or when command startup evidence is incomplete before a target failure can be honestly claimed.

## FAILED criteria

On a real Raspberry target with passing preflights, a worker startup non-zero exit or timeout is a `FAILED` proof.

## Non-claims

This proof does not prove cron timing, crontab installation, regular worker real product pipeline work, native display playback, dashboard status, reboot recovery, or physical power-loss recovery.
