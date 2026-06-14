# Raspberry iCloudPD discovery/preflight OpenSpec

Status: active planning contract  
Introduced: v0.8.69

## Goal

Define the safe preflight for the real iCloud media source before any production download claim is made.

## Contract

The iCloudPD discovery/preflight proof must report:

- target detection: Raspberry/non-Raspberry and override status;
- whether an `icloudpd` executable is discoverable;
- whether `icloudpd --version` or equivalent version command can run;
- whether required operator configuration variables are present without revealing secret values;
- whether the proof is configured for manual/operator Apple login and 2FA;
- whether a real provider action was attempted.

## PASS/BLOCKED rules

- `PASSED`: only when running on Raspberry, without override, `icloudpd` is discoverable, version can be read, required non-secret config is present, and no secret output is exposed.
- `BLOCKED`: off-target, explicit override, missing `icloudpd`, missing required config, or unconfirmed authentication state.
- `FAILED`: command failures that indicate broken local tooling rather than missing setup.

## Non-claims

- Preflight does not prove real iCloud download.
- Preflight does not automate Apple 2FA.
- Preflight does not prove continuation/idempotency.
- Preflight does not write media DB rows.
