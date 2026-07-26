# General Project Rule — Evidence-Driven System Replacement

When a task replaces, migrates, or materially restructures an existing **working responsibility, subsystem, implementation path, protocol, persistence mechanism, renderer, transport, hardware integration, service, or architectural boundary**, invoke the reusable skill:

`evidence-driven-system-replacement`

Use the skill before implementation to:

- establish the immutable baseline;
- verify actual configuration and runtime behavior;
- separate verified facts from assumptions, unknowns, conflicts, and stale claims;
- model current and proposed responsibilities;
- select clean, responsibility-aligned substitution boundaries;
- define outcome-based behavioral contracts;
- establish parity or explicitly approve intentional behavior changes;
- preserve deterministic rollback or mutually exclusive fallback where safe and practical;
- verify useful output rather than mere process or connection liveness;
- require separate deprecation and removal gates before deleting a working implementation.

The skill is not mandatory for a localized bug fix, formatting change, documentation-only change, purely greenfield feature, dependency update with no material behavior change, or small internal refactor that does not replace a working responsibility or alter responsibility ownership.

Use `ANALYZE_ONLY` when no mode is specified. Implementation requires explicit approval. Default cutover, deprecation, and removal are separate approval stages unless the user explicitly authorizes a combined operation.

For consequential migration contracts, architecture decisions, removal plans, or autonomous implementation prompts, apply `three-pass-critical-review` before final adoption.

Repository-specific rules may extend this rule with exact commands, authorities, feature flags, acceptance criteria, and removal gates, but must not weaken its baseline, evidence, parity, rollback, security, deprecation, or removal requirements.
