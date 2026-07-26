---
name: three-pass-critical-review
description: "Review consequential prompts, plans, architecture decisions, migration strategies, policies, skills, project rules, and implementation proposals through three isolated passes: Proposal Author, Adversarial Critic, and Deciding Reviewer. Use when independent challenge and a final authoritative judgment are needed, especially for high-risk, irreversible, security-sensitive, regression-prone, or autonomous implementation decisions."
---

# Three-Pass Critical Review

## Purpose

Produce, challenge, and judge an important artifact through three isolated roles:

1. `PROPOSAL_AUTHOR`
2. `ADVERSARIAL_CRITIC`
3. `DECIDING_REVIEWER`

Prevent the original framing, assumptions, omissions, or preferred solution from silently carrying through the whole review.

The final result must be one authoritative corrected artifact, not three similar summaries or a majority vote.

## Invocation

Use this workflow for:

- reusable skills and project rules;
- repository workflows and AI instructions;
- architecture and migration proposals;
- implementation and release plans;
- security-sensitive or hard-to-reverse decisions;
- replacement of working systems;
- protocol, database, storage, or deployment migrations;
- major refactors;
- prompts that direct autonomous implementation;
- decisions with significant regression, safety, cost, or operational risk.

It is optional for small wording fixes, simple facts, low-risk localized bugs, formatting-only changes, obvious reversible changes, and casual brainstorming.

Before starting, state the review target, requested outcome, review depth, material evaluation criteria, and specialist critic focus if any.

## Review Depth

### `LIGHT`

For bounded, reversible, low-risk decisions. Use a concise proposal, focused critique, and final judgment.

### `STANDARD`

Default. Review architecture, assumptions, requirements, verification, migration, rollback, maintainability, and operational risk.

### `DEEP`

For foundational, irreversible, security-sensitive, safety-sensitive, expensive, or broad decisions. Also require an evidence matrix, alternatives, failure modes, trust boundaries, resource analysis, migration/removal gates, and unresolved-risk register.

If no depth is specified, use `STANDARD`.

## Isolation Rules

Each pass has a distinct mandate and output. All passes may disagree and must label assumptions and uncertainty.

Where independent agents or execution contexts exist, run them separately.

Where only one context exists:

1. freeze the proposal after Pass 1;
2. prohibit proposal edits during Pass 2;
3. record criticism separately;
4. give Pass 3 the original requirements, frozen proposal, and critic report;
5. prohibit silent retroactive edits.

The critic is not a co-author. The deciding reviewer is not a vote counter. The decision is based on evidence, requirements, risk, and tradeoffs.

## Pass 1 — Proposal Author

### Mandate

Act as the strongest reasonable advocate for solving the stated problem.

Create the best coherent proposal supported by requirements and evidence. Do not weaken it merely to make criticism easier.

### Responsibilities

- restate objectives;
- identify constraints and verified facts;
- label assumptions and unknowns;
- propose a coherent path;
- explain responsibility and ownership;
- preserve required behavior;
- identify intentional changes;
- address verification, rollback, lifecycle, architecture, and resources where relevant;
- avoid unnecessary complexity;
- state exclusions.

### Required Output

- `PROPOSAL SUMMARY`
- `OBJECTIVES`
- `CONSTRAINTS`
- `VERIFIED FACTS`
- `ASSUMPTIONS`
- `PROPOSED DESIGN`
- `RESPONSIBILITY AND OWNERSHIP`
- `PRESERVED BEHAVIOR`
- `INTENTIONAL CHANGES`
- `VERIFICATION`
- `ROLLBACK`
- `RISKS AND TRADEOFFS`
- `EXCLUSIONS`
- `AUTHOR CONFIDENCE`: `HIGH`, `MEDIUM`, or `LOW`, with explanation.

Freeze the complete Pass 1 output before Pass 2.

## Pass 2 — Adversarial Critic

### Mandate

Act as an independent, technically capable, skeptical reviewer.

Try to disprove the frozen proposal's correctness, completeness, necessity, feasibility, safety, architectural fitness, migration quality, and testability.

Do not merely improve wording or rewrite the final proposal.

Assume the author may have misunderstood the current system, trusted stale documentation, missed hidden consumers, underestimated rollback, or chosen attractive but dangerous simplifications.

### Required Review Areas

Review correctness, evidence, existing-system understanding, architecture, regression risk, migration/rollback, verification, resources, security/operations, scope, and maintainability.

Use `references/review-templates.md` for the detailed adversarial checklist.

### Required Output

- `CRITICAL VERDICT`: `SOUND`, `SOUND_WITH_CORRECTIONS`, `MAJOR_REVISION_REQUIRED`, or `REJECT`.
- `BLOCKING FINDINGS`
- `MAJOR FINDINGS`
- `MINOR FINDINGS`
- `FALSE-PREMISE RISKS`, each with assumption, why it may be false, consequence, and minimal verification probe.
- `REGRESSION RISKS`
- `ARCHITECTURE RISKS`
- `VERIFICATION GAPS`
- `RESOURCE RISKS`
- `SECURITY AND OPERATIONAL RISKS`
- `SMALLEST SAFER ALTERNATIVE`
- `REQUIRED CORRECTIONS`
- `CRITIC CONFIDENCE`: `HIGH`, `MEDIUM`, or `LOW`, with explanation.

Do not produce the final rewritten artifact in Pass 2.

## Pass 3 — Deciding Reviewer

### Mandate

Act as the final independent decision-maker.

Evaluate the original requirements, frozen proposal, critic report, available evidence, risks, and tradeoffs.

Do not automatically side with either pass, average incompatible proposals, count findings as votes, accept unsupported criticism, or hide unresolved blockers.

### Decision Criteria

Evaluate correctness, requirement coverage, evidence quality, preservation of working behavior, architecture, responsibility alignment, substitution/rollback, testability, operations, security, bounded resources, simplicity, migration safety, future removability, and cost relative to benefit.

### Finding Disposition

For every blocking and major critic finding classify:

- `ACCEPTED`
- `PARTIALLY_ACCEPTED`
- `REJECTED`
- `DEFERRED_PENDING_EVIDENCE`

Explain the reason, required action, and blocking stage.

A rejected finding requires evidence or reasoning. A deferred finding requires a verification probe and an explicit statement of what it blocks.

### Allowed Decisions

The reviewer may approve, approve with corrections, replace parts, select the critic's safer alternative, combine compatible elements, reject both and define a new path, or block pending evidence.

### Required Output

- `FINAL VERDICT`: `APPROVED`, `APPROVED_WITH_CORRECTIONS`, `REVISE_AND_REVIEW_AGAIN`, `BLOCKED_PENDING_EVIDENCE`, or `REJECTED`.
- `FINDING DISPOSITION TABLE`
- `CORRECT PATH`
- `PRESERVED ELEMENTS`
- `CORRECTED ELEMENTS`
- `REJECTED CRITICISMS`
- `UNRESOLVED ITEMS`
- `IMPLEMENTATION OR ADOPTION GATES`
- `VERIFICATION REQUIREMENTS`
- `ROLLBACK AND REMOVAL CONDITIONS`, where applicable.
- `FINAL AUTHORITATIVE ARTIFACT`
- `DECISION CONFIDENCE`: `HIGH`, `MEDIUM`, or `LOW`, with explanation.

The final artifact must be self-contained. The reader must not reconstruct corrections from earlier passes.

## Optional Specialist Critic

The default is one general adversarial critic.

For material domain risk, assign a specialty such as security, performance, database migration, embedded systems, networking, UX, accessibility, reliability, or release engineering.

State the specialty before Pass 2. The specialist must still review cross-domain regressions.

Do not add multiple critics unless the decision's risk justifies additional independent review.

## Evidence and Uncertainty

All roles distinguish verified facts, assumptions, inferences, unknowns, and conflicting evidence.

The final reviewer must not resolve factual disputes by opinion.

When a disputed fact materially changes the decision:

- define the smallest verification probe;
- state what result supports each path;
- block only the stages that depend on that fact.

## Anti-Patterns

Do not allow:

- three near-identical summaries;
- the critic merely polishing the proposal;
- the author pre-writing both sides;
- the reviewer accepting every criticism without judgment;
- majority voting without evidence;
- silent modification of the frozen proposal;
- false consensus while blockers remain;
- stylistic preference presented as a blocker;
- a different implementation treated as automatically wrong;
- unapproved behavioral change treated as parity;
- detail mistaken for correctness;
- maximal generalization preferred over a simpler adequate solution;
- excessive complexity added for every hypothetical concern;
- omission of the final corrected artifact;
- uncertainty hidden behind confident language.

## Relationship to Other Workflows

This workflow reviews artifacts and decisions. It does not replace domain workflows.

For example:

- `evidence-driven-system-replacement` establishes system truth and a migration contract;
- `three-pass-critical-review` reviews whether that analysis, contract, plan, or implementation prompt is sound.

When reviewing another skill's output, preserve its required structure, critique compliance, do not weaken safety constraints, and produce a corrected compatible artifact.

## Invocation Examples

- `Run three-pass-critical-review on this.`
- `Review this using proposal author, adversarial critic, and deciding reviewer.`
- `Run a three-agent isolated review.`
- `Apply the review workflow before finalizing this plan.`
