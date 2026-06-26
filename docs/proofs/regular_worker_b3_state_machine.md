# Regular worker B3 stage-state-machine proof note

v0.10.20 turns `regular_stage_worker` from instrumentation-only evidence into product-capable scheduler work by attaching the same backend actions used by the B-test View manual Run buttons.

| Worker stage | B-test View action | Backend route |
| --- | --- | --- |
| `download` | B3.1 Download | `POST /api/runtime/download/run` |
| `index` | B3.2 Index | `POST /api/runtime/index/run` |
| `gps` | B3.3 Parse GPS | `POST /api/runtime/gps/run` |
| `geocode` | B3.4 Geocode | `POST /api/runtime/geocode/run` |
| `queue_prepare` | B3.5 Enqueue playback | `POST /api/runtime/queue/prepare` |

The worker keeps durable state in `runtime_data/scheduler/regular-stage-worker-state.json`. It chooses the next stage from `lastCompletedStage`; after `queue_prepare`, the next stage wraps back to `download`.

A product-capable run writes `runtime_data/scheduler/regular-stage-worker-status.json` with `implementationStatus=b3_stage_state_machine_v1` and `productWork.claimed=true` once a queue-prepare product cycle has been observed. This is the runtime authority consumed by `proof:regular-worker-product-evidence-producer`.

If no explicit `PF_REGULAR_WORKER_PRODUCT_MANIFEST_FILE` is configured, the producer may derive a sanitized readiness-approved manifest from the latest PASSED `real_download_continuation` proof. It does not copy raw media, cookies, credentials, raw provider payloads, or private runtime files into product evidence.
