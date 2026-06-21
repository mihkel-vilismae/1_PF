# Real iCloud evidence run package

This is the operator-facing evidence package contract for the narrowed v1 path.

Required inputs:
- `PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD=true`
- `PF_AUTH_SESSION_USABLE_EVIDENCE_FILE`
- `PF_REAL_ICLOUD_FILTER_FILE` or `PF_REAL_ICLOUD_FILTER_JSON`
- `PF_REAL_ICLOUD_DOWNLOAD_DIR`
- `PF_REAL_ICLOUD_DOWNLOAD_LEDGER_FILE`
- `PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE`
- `PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE`

The run package is PASSED only when auth, filter, download dir, both manifests, no-loop, redaction, and partial-file safety pass.

## v0.10.12 evidence pack helper

Before manually assembling uploadable real iCloud evidence, operators may run:

```bash
npm run proof:real-icloud-media-source-evidence-pack
```

This writes redacted templates and `latest.env` under `runtime_data/operator_evidence/real_icloud_media_source_evidence_pack/`.
The helper is BLOCKED-safe when real evidence is missing and does not claim Apple authentication, real download, GPS/geocode, worker product output, or display visibility.
