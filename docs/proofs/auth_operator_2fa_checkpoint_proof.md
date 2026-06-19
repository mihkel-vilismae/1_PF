# Auth operator 2FA checkpoint proof

Command: `npm run proof:auth-operator-2fa-checkpoint`

This proof verifies the interactive NEW AUTH login lifecycle emits a secret-safe operator checkpoint when iCloudPD asks for SMS / two-factor authentication input.

## What it proves

- The normal NEW AUTH login flow reaches `pending_2fa` when iCloudPD asks for a trusted-device index or six-digit SMS code.
- The structured event stream includes `operator_2fa_checkpoint` with the marker `AUTH_OPERATOR_CHECKPOINT: WAITING_FOR_OPERATOR_2FA_INPUT`.
- The marker tells the operator to enter 2FA outside artifact capture.
- Passwords, Apple IDs, 2FA codes, provider tokens, cookies, and session paths are not exposed in serialized proof evidence.
- The mocked lifecycle can continue through device-index selection, SMS-code submission, and authenticated state.

## Non-claims

- This proof does not perform real Apple/iCloud login.
- This proof does not automate SMS/2FA entry.
- This proof does not collect credentials or 2FA codes.
- This proof does not prove real iCloud media listing, real download continuation, or Raspberry v1 readiness.

## Intended operator use

During real proof runs, the operator starts the auth proof. When the app emits the checkpoint marker, the operator completes the SMS/2FA step manually. The proof artifacts should record only state transitions, prompt classification, and redacted/sanitized status.
