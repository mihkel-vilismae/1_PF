# Real iCloud evidence ZIP contract

The uploadable evidence package should contain safe metadata only.

Required entries:
- `auth_session_usable_evidence.json`
- `filter.json`
- `download_ledger.json`
- `batch1_manifest.json`
- `batch2_manifest.json`
- `last_run_stats.json`

The evidence package must not contain Apple ID, password, 2FA codes, cookies, raw session files, raw provider output, or private media contents.
