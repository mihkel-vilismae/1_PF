# Real iCloud filtered download operator runbook

Required safe inputs:
- `PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD=true`
- `PF_AUTH_SESSION_USABLE_EVIDENCE_FILE`
- `PF_REAL_ICLOUD_FILTER_FILE` or `PF_REAL_ICLOUD_FILTER_JSON`
- `PF_REAL_ICLOUD_DOWNLOAD_DIR`
- `PF_REAL_ICLOUD_DOWNLOAD_LEDGER_FILE`
- `PF_REAL_ICLOUD_BATCH1_MANIFEST_FILE`
- `PF_REAL_ICLOUD_BATCH2_MANIFEST_FILE`

Secrets must not be uploaded. Do not upload Apple ID, password, 2FA code, cookies, raw session files, raw provider logs, or private media contents.

Operator flow: complete manual 2FA, produce redacted auth evidence, run batch 1 and batch 2 with the same normalized filter, then run no-loop proof.
