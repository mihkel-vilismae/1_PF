# Proofrunner tiered queues proof

Command: `npm run proof:proofrunner-tiered-queues`

Status: active contract proof. Introduced in v0.10.8.

This proof validates proofrunner queue selection modes that reduce operator proof time:

- `quick`
- `changed`
- `blockers`
- `failed-last`
- `platform`
- `full`

It checks that:

- `full` keeps the complete queue;
- `quick` is smaller than `full`;
- `changed` includes requested changed proofs plus quick safety proofs;
- `blockers` remains smaller than `full` and keeps final readiness summaries last;
- `failed-last` replays previous failed proofs and keeps final summaries last;
- `platform` respects Windows alias filtering for Raspberry/Linux launchers.

## Non-claims

This proof validates queue selection only. It does not execute every selected mode end to end and does not replace target-machine proof results.
