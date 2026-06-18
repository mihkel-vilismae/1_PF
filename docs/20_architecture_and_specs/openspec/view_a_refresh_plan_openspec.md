# View A refresh/preload plan OpenSpec

Version introduced: 0.8.153

## Purpose

Entering View A may refresh safe dashboard status cards. The refresh plan must be explicit and mode-aware so Test Mode cannot silently perform provider login/session actions.

## Contract

- Base refresh actions are `verify-env`, `check-db`, and `check-cron`.
- Real Mode may additionally refresh `new-auth-check-login` as a status read.
- Test Mode must not include NEW AUTH/provider login actions.
- The plan is safe refresh only and must not mutate production media/database/provider state.

## Non-claims

This contract does not prove real provider login, iCloud access, Raspberry behavior, or production pipeline work.
