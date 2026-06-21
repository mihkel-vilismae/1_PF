# Real iCloud evidence ZIP contract proof

Command: `npm run proof:real-icloud-evidence-zip-contract`

Validates the uploadable evidence ZIP/package manifest contract and secret-safety requirements.

Status semantics:
- `PASSED` means the configured evidence package/contract validates.
- `BLOCKED` means required operator-machine inputs are not configured yet.
- `FAILED` is reserved for malformed/contradictory evidence where safely detectable.

Non-claims:
- This proof does not perform Apple/iCloud login or download media by itself.
- This proof does not upload credentials, 2FA codes, cookies, raw session files, raw provider logs, or media contents.
