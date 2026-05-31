# GPS fallback proof

This proof verifies deterministic local GPS fallback parsing for the media pipeline. It runs the backend Python GPS provider chain against temporary local fixture files and confirms that JSON sidecar, XMP sidecar, text sidecar, filename-token, and path-token providers can each produce coordinates.

Run:

```bash
node tools/run-gps-fallback-proof.mjs
```

Output is written under ignored `runtime_data/proofs/gps_fallback_<timestamp>.json`.

This proof does not contact iCloud, geocoding providers, network services, or hardware. It does not prove that every real-world photo metadata format is supported; it proves the repository's deterministic fallback providers and their default chain behavior.
