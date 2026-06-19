# Prooflauncher GUI selection OpenSpec

Status: active UX/proof contract for generated prooflaunchers.

## Requirement

Generated prooflaunchers must provide an operator-facing selection menu with two choices after baseline verification and before proof execution:

1. Run all proofs.
2. Run only minimum proofs/tests needed.

The selected mode must be recorded in proof evidence identity data and command summaries.

## Minimum mode

Minimum mode must be generated from repo-owned queue helpers, not from hardcoded launcher-only lists. It must include full-test stability, launcher contract, queue proof, registry/docs/OpenSpec checks, v1 readiness, blocker summary, and final proofrunner summary.

## Proofs

`proof:prooflauncher-gui-selection` must prove both happy paths:

- `all` mode has a larger queue than minimum mode.
- `minimum` mode has no missing required minimum proofs.
- Final summary proofs remain last in both modes.

## Timing

Launchers should show elapsed time, ETA, time remaining, per-stage durations, and a final timing table using historical duration data when available.

## Non-claims

This OpenSpec does not claim actual provider, hardware, product-pipeline, display, or final v1 success.
