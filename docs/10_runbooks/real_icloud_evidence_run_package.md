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
