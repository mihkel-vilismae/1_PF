# V2 proof-passed baseline — v0.10.83

Date: 2026-06-28 03:28 EEST

This document freezes `v0.10.83` as the latest proof-passed V2 baseline for the current proof contract.

## Source evidence

Latest accepted proof evidence ZIP:

```text
20260628_031600_SLIM_LOGS_ONLY.zip
```

SHA-256:

```text
625b04bd731614d8b6b00eaf31630bcf5ad477544c34ffb4c1c2f1eb298347a2
```

The ZIP was intentionally repacked as logs/evidence only. It does not contain the extracted repository workspace.

## Final proof result

The original `v0.10.83` run passed backend proof layers and correctly blocked on visual evidence. After operator photo/video evidence and confirmation were added, the exact rerun passed the visual and final bundle proofs.

| Proof layer | Final status | Evidence notes |
|---|---:|---|
| Target machine install/readiness | PASSED | `v2_real_machine_readiness` proof present |
| Managed short-wrapper crontab install | PASSED | `v2_install_real_crontab` proof present |
| Real cron runtime proof | PASSED | `v2_real_cron_runtime`, 16 checks passed |
| Cron worker evidence | PASSED | worker truth files present |
| Playback display truth | PASSED | `media_started`, `media_finished`, `queue_advanced` proven |
| Autonomous contract | PASSED | `v2_autonomous_proof_contract` proof present |
| Visual physical evidence | PASSED | `v2_visual_physical_evidence`, 11 checks passed |
| Final autonomous bundle | PASSED | `v2_final_autonomous_bundle`, 20 checks passed |

## Operator visual evidence

Operator visual evidence in the accepted ZIP includes:

```text
gps_valid_03.jpg
gps_valid_video_02_tartu.mp4
operator_visual_confirmation.json
```

Operator confirmation:

```text
screenShowsMedia = true
overlayVisible = true
mediaAdvances = true
screenOnOffObserved = false
```

`screenOnOffObserved = false` is an explicit boundary. The current `v0.10.83` proof proves media/overlay visual evidence plus backend screen-worker truth, but it does not claim physical screen on/off behavior was visually confirmed.

## Important proof boundary

`v0.10.83` proves the current V2 proof contract:

```text
backend cron runtime chain + playback truth + operator visual evidence + final bundle
```

It does not yet prove the future production-cron contract where long-term production schedules are separated from the seconds-based proof loop. That remains a later slice.

## Next baseline goal

`v0.10.84` should preserve this proof-passed baseline and make proofrunner packaging clean and repeatable by ensuring logs ZIPs never include:

```text
workspace/
extracted repository
node_modules/
.git/
```
