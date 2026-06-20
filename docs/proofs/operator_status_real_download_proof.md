# Operator status real download proof

Command: `npm run proof:operator-status-real-download`

Reports real download sections without hiding blocked states.

Status semantics:
- `PASSED` means the provided local/safe evidence validates.
- `BLOCKED` means required opt-in or operator-machine artifact inputs are missing.
- `FAILED` is reserved for malformed/contradictory evidence where safely detectable.

Non-claims:
- No credentials, 2FA codes, cookies, raw session files, raw provider logs, or private media contents are captured by this proof.
- This proof does not by itself claim full Raspberry v1 readiness.
