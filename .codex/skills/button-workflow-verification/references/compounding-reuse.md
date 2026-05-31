# Compounding Reuse Strategy

This file describes what to keep updating so repeated button audits get faster over time.

## Keep These Artifacts Current

## Conditional Delegation Policy

Use subagents as a reusable acceleration pattern, not a mandatory ritual.

Promote delegation into the normal workflow when:

- audits are being run in batches
- the same discovery shape repeats
- one explorer can gather evidence while the main agent handles live execution

Keep the audit single-agent when:

- the button is small and direct
- the main blocker is a live endpoint result
- the coordination cost would exceed the search cost

### Audit index

File, only when the task explicitly asks for a durable index or the repository already has one:

- canonical docs location chosen with `pf-doc-governance-writer`

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

File, only when the task explicitly asks for a durable run log or the repository already has one:

- canonical docs location chosen with `pf-doc-governance-writer`

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

- append one new row for every completed audit only when a run-log document exists or the user explicitly asked to create one

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
