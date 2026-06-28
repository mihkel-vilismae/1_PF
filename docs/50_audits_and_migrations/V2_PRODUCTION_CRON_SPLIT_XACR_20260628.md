# V2 Production Cron Split XACR — 2026-06-28

Version: 0.10.85

## XACR decision

v0.10.84 proved the proofrunner and proof cron runtime chain:

```text
prooflauncher -> proof crontab -> short wrapper -> seconds proof loop -> worker truth -> visual evidence -> final bundle
```

The next product milestone is to separate proof cron from production cron. The proof loop stays available for fast proofing, while production cron is represented by a separate managed block and worker-specific wrapper.

## Implemented slices

| Slice | Implementation | Status |
|---|---|---:|
| Cron modes | `PF_V2_CRON_MODE=proof|production` recognized by production install proof | done |
| Production block | Added `# BEGIN/END PHOTOFRAME_V2_PRODUCTION_CRON` managed block | done |
| Production wrapper | Generated `$HOME/.photoframe_v2/cron/production_worker.sh` with long PATH/repo/env logic outside crontab | done |
| Production runtime proof | Added post-marker proof for source=`production-cron` events | done |
| Final bundle split | Final bundle reports proof cron and production cron separately | done |
| Proofrunner | Launcher runs required proofs only and includes production cron runtime proof | done |

## New scripts

```text
proof:v2-install-production-crontab
proof:v2-install-production-crontab-contract
proof:v2-production-cron-runtime
proof:v2-production-cron-runtime-contract
proof:v2-production-cron-cleanup
```

## Proofrunner order

```text
npm install --verbose --registry=https://registry.npmjs.org/
npm run proof:v2-real-machine-readiness
npm run proof:v2-install-real-crontab
npm run proof:v2-real-cron-runtime
PF_V2_CRON_MODE=production npm run proof:v2-install-production-crontab
npm run proof:v2-production-cron-runtime
npm run proof:v2-real-cron-evidence
npm run proof:v2-real-playback-display
npm run proof:v2-autonomous-contract
npm run proof:v2-visual-physical-evidence
npm run proof:v2-final-autonomous-bundle
```

The launcher still does not run full `npm test`.

## Important boundary

This version separates the crontab proof layers:

```text
proofCronRuntime: v2_real_cron_runtime
productionCronRuntime: v2_production_cron_runtime
```

The production runtime proof uses worker-specific production wrappers and `source=production-cron` truth events. It is stronger than the proof-loop path for product direction, but it is still a proofable production-cron evidence layer, not yet a long-duration burn-in of the final photo frame.

## Next expected milestone

After v0.10.85 passes on target, the next product slice should prove the real media/iCloud pipeline under the production cron path and then perform a longer autonomous burn-in run.
