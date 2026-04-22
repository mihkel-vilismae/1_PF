# Compounding Reuse Strategy

This file describes what to keep updating so repeated button audits get faster over time.

## Keep These Artifacts Current

### Audit index

File:

- `docs/button_verification_results/INDEX.md`

Store:

- button or section
- action key
- current classification
- last verification date
- report link
- backend test link
- frontend test link
- brief caveat

### Append-only run log

File:

- `docs/button_verification_results/RUN_LOG.md`

Store:

- run date
- view
- section
- control
- action key
- classification
- report link
- backend test
- frontend test
- short summary

Rule:

- append one new row for every completed audit, even when the same button is re-audited

### Action inventory

Store:

- visible label
- `data-action`
- view and section
- service function
- endpoint
- backend handler
- inspect metadata key
- tests

Create a view-specific inventory after enough buttons accumulate.

### Test patterns

Promote repeated shapes into standard patterns:

- init action-runner test
- runtime action-runner test
- metadata stability test
- backend endpoint contract test

### Failure taxonomy

Track recurring categories:

- transport missing
- route missing
- handler broken
- response not rendered
- inspect drift
- mock mislabeled as real

## When To Promote Work

- after `3` repeated test shapes
- after `5` audited buttons in the same view
- after `3` repeated failures in the same category
- after `2` times re-explaining the same repo-specific path mapping

## What Not To Promote

- one-off quirks for a single button
- temporary runtime failures caused by a dead local process
- long narrative writeups that belong in a per-button report instead of a reusable asset
