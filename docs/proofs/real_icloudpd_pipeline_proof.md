# Real iCloudPD pipeline proof

This proof is for the real iCloud-connected pipeline only.

Route chain:

```text
GET /api/auth/new/status
POST /api/runtime/download/real-run
POST /api/runtime/index/run
POST /api/runtime/gps/run
POST /api/runtime/geocode/run
POST /api/runtime/queue/prepare
POST /api/runtime/playback/select-current
```

The proof runner is blocked by default. Start the backend in Real Mode with a verified NEW AUTH/iCloudPD session, then run:

```bash
PF_PROOF_ENABLE_REAL_ICLOUDPD=true PF_API_BASE_URL=http://127.0.0.1:8787 node tools/run-real-icloudpd-pipeline-proof.mjs
```

Output is written under ignored `runtime_data/proofs/real_icloudpd_pipeline_<timestamp>.json`.

The proof must use `/api/runtime/download/real-run`, not mock download. Missing session, missing provider, or failed route must be `BLOCKED` or `FAILED`, not success.
