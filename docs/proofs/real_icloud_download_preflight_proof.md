# Real iCloud download preflight proof

Status: real-provider preflight only. It is blocked by default.

Command:

```bash
npm run proof:real-icloud-download-preflight
```

## Required opt-in inputs

- `PF_PROOF_ENABLE_REAL_ICLOUD_FILTERED_DOWNLOAD=true`
- `PF_AUTH_SESSION_USABLE_EVIDENCE_FILE=/path/to/safe/auth-session-evidence.json`
- `PF_REAL_ICLOUD_FILTER_JSON='{"mediaType":"photo","limit":5}'` or `PF_REAL_ICLOUD_FILTER_FILE=/path/to/filter.json`
- `PF_REAL_ICLOUD_DOWNLOAD_DIR=/path/to/proof-owned/download-folder`
- `PF_REAL_ICLOUD_DOWNLOAD_LEDGER_FILE=/path/to/proof-owned/ledger.json`

## Proves

- The real download proof has explicit operator opt-in.
- Usable auth-session evidence validates without uploading secrets.
- Download filters normalize into a stable signature.
- The download folder exists.
- The ledger path is safe and JSON-based.
- Inputs are not secret-like provider strings.

## Does not prove

- Real iCloud provider connectivity.
- Real media listing.
- Real file download.
- Continuation/no-loop behavior.

Those are separate opt-in proofs.
