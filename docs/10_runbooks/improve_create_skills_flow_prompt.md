# Improve/create skills flow prompt

Status: reusable workflow prompt  
Introduced: v0.8.128

## Purpose

Use this prompt when a PF_login / PhotoFrame chat contains reusable workflow, proof, architecture, packaging, handoff, or documentation lessons that should be evaluated as possible skills. It is intentionally a prompt/runbook, not a runtime proof and not project truth by itself.

## Copy-paste prompt

```text
RUN IMPROVE/CREATE SKILLS FLOW for this chat.

Scan the current chat and recent project context for reusable workflow, proof, architecture, documentation, packaging, or handoff skills that should be created or improved.

Use 3x2 ACR:

1. Derive the live repository baseline before trusting the prompt:
   - current branch and clean/dirty state
   - VERSION and package/component versions
   - HEAD
   - current evaluator/proof mapping
   - latest exact proof_kind artifacts by proof_timestamp
   - stale readiness summaries or artifact identity mismatches
2. Analyze candidate skills/workflows.
3. Criticize whether each is reusable, safe, non-duplicative, and scoped correctly.
4. Refine into accepted, rejected, and deferred updates.

For orchestrator prompts, remove or rewrite stale version/HEAD/proof claims, skip already-complete slices, defer unavailable target/operator work, and reorder remaining slices by highest honest readiness impact and executable confidence.

Respect active project baseline and proof-honesty rules.

For each accepted skill, specify:
- name
- scope: global / project / artifact / one-time
- trigger phrase or situation
- exact behavior
- safety constraints
- non-claims
- whether it should be stored in memory

Do not modify code unless explicitly asked.
Do not create duplicate memories.
Do not store sensitive data.
Print a before/after-style table of accepted changes.
Print the verified live baseline and the stale prompt assumptions removed.
```

## Evaluation rules

| Decision | Meaning |
|---|---|
| `ACCEPT` | The chat produced a reusable rule that should be stored or documented. |
| `UPGRADE` | An existing workflow should be refined without duplicating it. |
| `DEFER` | Useful idea, but more evidence or a concrete repo task is needed. |
| `REJECT` | Too specific, unsafe, redundant, or likely to create false proof claims. |

## Safety constraints

- Do not store secrets, tokens, cookies, credentials, Apple IDs, `.env` values, or raw provider output.
- Do not turn a one-off workaround into a global rule unless it is reusable.
- Do not store duplicate memories when an existing canonical memory already covers the behavior.
- Do not let a workflow skill override the active immutable baseline.
- Do not claim runtime proof from a prompt, plan, or assistant summary.
- Do not preserve a copied slice order when live artifacts show that slices are complete, obsolete, stale, or unavailable on the current platform.

## Expected output

The result should include:

1. accepted skill/workflow updates;
2. rejected candidates and why;
3. scope for each accepted item;
4. before/after table;
5. verified live baseline and stale assumptions removed;
6. any memory updates made;
7. any repo-documentation updates deferred for a later explicit implementation slice.

## Non-claims

This prompt does not modify repository code or prove runtime behavior. It only guides a later assistant pass that may identify reusable workflow updates.
