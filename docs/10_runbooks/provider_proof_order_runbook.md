# Provider proof order runbook

This runbook defines the safe order for provider-readiness proofing before real iCloud, real download continuation, or real geocode claims. It is intentionally operator-facing and secret-safe.

## Scope

This runbook is for Raspberry/provider proof preparation only. It does not claim that iCloud login, media download, geocode lookup, product import, playback queueing, address overlay rendering, hardware display, or final v1 readiness has passed.

## Secret boundary

Proof artifacts and uploaded proof reports must not include Apple IDs, passwords, 2FA codes, cookies, API keys, provider tokens, raw `.env` values, or raw provider output. Use proof-owned JSON artifacts and redacted diagnostics only.

## Ordered provider proof calls

Run the following proof calls in this order when preparing a real-provider proof cycle:

| Order | Command | Purpose | Expected without real config |
|---:|---|---|---|
| 1 | `npm run proof:auth-checkpoint-state` | Summarize app-owned auth/session checkpoint state. | `BLOCKED` until app-owned session proof exists. |
| 2 | `npm run proof:real-icloudpd-readiness` | Check local iCloudPD/auth readiness inputs without downloading media. | `BLOCKED` until explicit opt-in/config/checkpoint inputs exist. |
| 3 | `npm run proof:raspberry-icloudpd-preflight` | Check Raspberry target iCloudPD discovery/preflight boundary. | `PASSED` or `BLOCKED` depending target/config. |
| 4 | `npm run proof:real-icloudpd` | Run the opt-in real iCloudPD pipeline proof. | `BLOCKED` until explicit real-provider conditions are met. |
| 5 | `npm run proof:real-download-readiness` | Check real repeated-download readiness without calling backend/download. | `BLOCKED` until explicit download-continuation opt-in exists. |
| 6 | `npm run proof:real-download-continuation` | Run opt-in repeated real-download continuation proof. | `BLOCKED` until live route/download directory is available. |
| 7 | `npm run proof:real-geocode-provider-readiness` | Check local geocode provider readiness inputs without network calls. | `BLOCKED` until opt-in/provider id are configured. |
| 8 | `npm run proof:real-geocode-provider-chain` | Run the opt-in real geocode provider-chain proof. | `BLOCKED` until provider is enabled/configured. |
| 9 | `npm run proof:raspberry-v1-readiness` | Summarize latest v1 gate artifacts after provider proofs. | `BLOCKED` until all required live evidence exists. |
| 10 | `npm run proof:proof-report-blocker-summary` | Group remaining blockers from the uploaded proof artifacts. | `PASSED` if artifacts exist, `BLOCKED` if no proof artifacts exist. |
| 11 | `npm run proof:proof-runner-final-summary` | Confirm readiness summary was generated after observed inputs. | `PASSED` only when readiness is present and not stale. |

## Operator notes

- Do not substitute mock download endpoints for `npm run proof:real-download-continuation`.
- Do not treat `PASSED` readiness preflights as real provider/download proof; readiness preflights only prove local inputs and route plans.
- Run the 2proofrunner handoff when possible because it enforces the repository queue order and collects uploadable logs and proof artifacts.
- After each proof report upload, compare `proof:raspberry-v1-readiness`, `proof:proof-report-blocker-summary`, and `proof:proof-runner-final-summary` before deciding the next implementation slice.
