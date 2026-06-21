# Operator-safe iCloud session checkpoint proof

`npm run proof:operator-safe-icloud-session-checkpoint` validates the B1.1/B1.2 contract for moving from readiness checks toward real iCloudPD work without leaking secrets.

The proof requires the operator flow to remain ordered:

1. `npm run proof:auth-checkpoint-state`
2. `npm run proof:auth-session-usable-evidence-producer`
3. `npm run proof:real-icloudpd-readiness`
4. `npm run proof:real-icloudpd`

The contract explicitly allows proof artifacts to report key names, configured/missing booleans, status, and validation errors. It forbids Apple IDs, passwords, cookies, tokens, 2FA codes, raw session paths, raw auth evidence paths, raw provider output, and raw `.env` values.

This proof does not perform iCloud login, complete 2FA, inspect raw cookies/session files, download media, or claim the real iCloudPD pipeline is ready. It only proves the operator-safe readiness/session checkpoint boundary is stable before real-provider work.
