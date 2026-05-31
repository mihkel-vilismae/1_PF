# Real Download Continuation Proof

## Purpose

This proof checks whether repeated real iCloudPD download runs avoid adding duplicate media content. It calls the existing real download endpoint twice and compares sanitized local file fingerprints before the first run, after the first run, and after the second run.

## Command

```bash
PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION=true npm run proof:real-download-continuation
```

Optional settings:

```bash
PF_API_BASE_URL=http://127.0.0.1:8787
PF_REAL_DOWNLOAD_PROOF_RECENT_COUNT=10
PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR=/absolute/path/to/download-dir
```

If `PF_REAL_DOWNLOAD_PROOF_DOWNLOAD_DIR` is omitted, the proof attempts to read `DOWNLOAD_DIR` from `POST /api/init/verify-env`.

## Safety and boundaries

- The proof is blocked unless `PF_PROOF_ENABLE_REAL_DOWNLOAD_CONTINUATION=true` is set.
- The proof never calls the mock download route `POST /api/runtime/download/run`.
- The proof calls `POST /api/runtime/download/real-run` twice against a running backend.
- The proof writes sanitized JSON under `runtime_data/proofs/`, which is ignored by Git.
- The proof records relative paths and SHA-1 content fingerprints only; absolute local paths are not required in the proof payload.

## Pass criteria

The proof passes when:

1. the live backend routes return success,
2. the second real download run does not add a file whose content fingerprint already existed after the first run, and
3. the proof artifact is written successfully.

Adding new unique media on the second run is allowed, because that can represent continuation to new items. Adding duplicate content on the second run fails the proof.

## Limitations

This proof depends on the operator's local iCloudPD session, backend environment, configured download directory, and current iCloud library state. It proves the observed local run only; it does not prove future provider behavior.
