# Real iCloud filter config proof

Command: `npm run proof:real-icloud-filter-config`

Validates normalized real download filter config/signature.

Status semantics:
- `PASSED` means the provided local/safe evidence validates.
- `BLOCKED` means required opt-in or operator-machine artifact inputs are missing.
- `FAILED` is reserved for malformed/contradictory evidence where safely detectable.

Non-claims:
- No credentials, 2FA codes, cookies, raw session files, raw provider logs, or private media contents are captured by this proof.
- This proof does not by itself claim full Raspberry v1 readiness.
