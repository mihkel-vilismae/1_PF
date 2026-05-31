# Deterministic media pipeline proof

This proof verifies local media pipeline contracts without iCloud, network geocoding, or hardware. It runs targeted repository tests for GPS/geocode provider contracts and playback worker selection behavior, then writes a sanitized proof artifact.

Run:

```bash
node tools/run-deterministic-media-pipeline-proof.mjs
```

Output is written under ignored `runtime_data/proofs/deterministic_media_pipeline_<timestamp>.json`.

This proof is intentionally local and deterministic. It does not prove real iCloudPD download success, real geocode provider success, native/fullscreen playback, or Raspberry power-loss recovery.
