---
name: evidence-driven-system-replacement
description: Safely analyze and replace, migrate, or materially restructure an existing working subsystem by establishing evidence-backed system truth, mapping current and proposed responsibilities, defining clean substitution boundaries and behavioral contracts, preserving rollback, verifying parity or approved differences, and enforcing separate deprecation and removal gates. Use for protocol, transport, storage, renderer, framework, hardware-integration, processing-path, service, or architectural-boundary replacements; do not force it for local bug fixes or small internal refactors that preserve responsibility ownership.
---

# Evidence-Driven System Replacement

## Purpose

Prevent migration decisions from being based on surface inspection, assumed configuration, stale documentation, guessed runtime behavior, or component names that do not reflect actual responsibilities.

Establish what the working system truly does, model the target as responsibilities and observable outcomes, choose clean substitution seams, verify the new implementation against the existing responsibility contract, and delay removal until explicit gates pass.

## Central Rule

Do not replace a component because its name, folder, technology, or apparent role resembles a proposed component.

First determine:

1. The responsibility the existing component actually fulfills.
2. Its inputs, outputs, side effects, lifecycle, failures, configuration, and observable results.
3. Which proposed component will fulfill that responsibility.
4. Where a stable substitution boundary can be created.
5. How old and new implementations can be verified against the required outcome.
6. What evidence is required before deprecation or removal.

## Invocation

Use this skill when a task:

- replaces an existing working subsystem or implementation path;
- migrates a protocol, transport, database, storage engine, framework, renderer, runtime, device integration, or service;
- moves responsibility between packages, processes, services, devices, or layers;
- introduces a new implementation intended to supersede a working implementation;
- changes responsibility ownership or public architectural boundaries;
- plans eventual removal of a currently working path.

Do not require the full workflow for localized bug fixes, formatting, documentation-only work, small internal refactors with unchanged responsibility ownership, purely greenfield work, or dependency updates with no material behavior or architecture change.

When uncertain, perform a lightweight trigger assessment first.

## Modes

### `ANALYZE_ONLY`

Default. Inspect and report. Establish system/configuration truth and responsibility maps. Do not modify, deprecate, or remove production behavior.

### `PLAN_ONLY`

Complete the analysis and define contracts, seams, tests, migration slices, rollback, and removal gates. Do not modify production behavior.

### `IMPLEMENT_APPROVED`

Use only after explicit implementation authorization. Implement approved slices, preserve the original baseline, verify each slice, and do not remove the legacy implementation unless removal is separately approved.

If no mode is specified, use `ANALYZE_ONLY`.

## Risk Level

Classify before choosing depth:

- `BOUNDED`: one implementation changes behind an already stable contract.
- `SUBSYSTEM`: several components or responsibility boundaries are affected.
- `FOUNDATIONAL`: persistence, security, deployment, irreversible data, broad runtime ownership, or many consumers are affected.

State the level and justification. Scale evidence, reporting, and removal gates accordingly.

## Immutable Baseline

Record when available:

- repository/project identity;
- branch and commit;
- version;
- working-tree status;
- relevant artifacts and runtime configuration;
- start/test commands;
- observable known-working scenarios.

Treat that state as the immutable comparison baseline. Compare every decision and change against the original baseline, not only the latest modified state.

The baseline includes code, configuration, public contracts, user-visible and runtime behavior, data compatibility, operations, failure handling, and integrations.

Preserve existing behavior by default unless an intentional change is documented and approved.

## Evidence Discipline

Label every material conclusion:

- `VERIFIED`
- `INFERRED`
- `UNKNOWN`
- `CONFLICTING`
- `STALE`

Prefer runtime-negotiated or directly observed behavior, then executed tests/evidence, active source/configuration, locked build metadata, current verified documentation, historical documentation, and finally inference.

Never silently promote an inference to a verified fact.

For every important unknown:

- explain why it matters;
- name the decision it may invalidate;
- define the smallest safe verification probe;
- state which stage it blocks.

Do not execute destructive or side-effect-heavy commands merely to inspect behavior.

## Workflow

### Phase 1 — Establish Current-System Truth

Trace the current system end to end. For each relevant component verify responsibility, inputs, outputs, protocol/format, ownership, lifecycle, configuration, consumers, dependencies, side effects, errors, recovery, resources, observable result, and validation.

Locate real responsibility forks such as acquisition, transport, display, processing, transformation, rendering, storage, logging, control, and monitoring.

Do not infer responsibility from names or folders alone.

### Phase 2 — Model the Proposed System

Break the goal into explicit responsibilities. For each identify purpose, required inputs/outputs, observable success, configuration, ownership, lifecycle, dependencies, failures, recovery, timing, concurrency, resource expectations, trust boundaries, and verification.

Treat the target as a hypothesis until platform, dependency, version, hardware, browser/runtime, deployment, network, licensing, security, and operational feasibility are verified where relevant.

### Phase 3 — Map Responsibility Equivalence

For every existing responsibility classify whether the target preserves, reuses, adapts, wraps, replaces, intentionally changes, intentionally removes, or fails to account for it.

For every proposed responsibility identify a full existing equivalent, partial equivalent, no equivalent, or possible duplicate owner.

Expose missing responsibilities, duplicate ownership, lost behavior, hidden side effects, unmapped configuration, combined responsibilities, and misleadingly similar component names.

Do not reproduce accidental legacy coupling merely to make diagrams match.

### Phase 4 — Select Substitution Boundaries

Evaluate multiple candidate seams. Compare responsibility represented, producer/consumer ownership, contracts, adaptation, leakage, conversions, copies, latency, resources, testability, rollback, migration complexity, removal value, and regression risk.

Prefer the smallest seam that creates meaningful substitution and verification.

A good seam permits deterministic selection, comparable outputs and health, independent tests, clean cleanup, rollback, and later removal without redesigning downstream consumers.

### Phase 5 — Define Contracts and Characterization

Create interfaces or adapters only when they provide real substitution, testing, isolation, error normalization, result comparison, or protection from new dependencies on deprecated code.

Define replacement correctness by outcomes, not internal similarity.

Characterize the existing implementation before replacing it. Capture baseline outputs and establish repeatable contract-level tests or manual checks.

### Phase 6 — Migrate Through Controlled Coexistence

Prefer staged migration, but do not require simultaneous operation when implementations compete for exclusive resources.

Use parallel comparison, mutually exclusive feature flags, sequential A/B runs, recorded-input replay, side-effect-free shadowing, or test-harness substitution as appropriate.

Selection must be explicit, observable, deterministic, reversible, and cleanly disposed before switching.

### Phase 7 — Verify, Switch, Deprecate, Remove

Verify normal behavior, failures, recovery, restart, cleanup, configuration, resources, user-visible results, and parity or approved intentional differences.

Switch defaults only after acceptance gates pass. Deprecation and removal are separate approval stages. Remove only after all applicable removal gates pass.

## Non-Negotiable Rules

- Useful output, not mere process or connection liveness, defines health.
- New trust boundaries, exposure, authentication, validation, secrets, and diagnostic logging must be assessed.
- Resource flow must be bounded; avoid unbounded queues, duplicate processing, unnecessary conversion, repeated full-size allocation, stale work, and conflicting exclusive-resource ownership.
- Do not mark a component for removal merely because the target diagram omits it.
- Intentional behavior changes require explicit approval.
- One happy-path demonstration is not parity.
- In `IMPLEMENT_APPROVED`, use logical commits, preserve architecture, avoid unrelated refactors, compare against the original baseline, and do not remove deprecated code without separate approval.

## Required Outputs

Scale depth to risk, but produce all materially applicable artifacts:

1. `BASELINE IDENTITY`
2. `RISK CLASSIFICATION`
3. `SYSTEM TRUTH REPORT`
4. `CONFIGURATION TRUTH MATRIX`
5. `CURRENT RESPONSIBILITY MAP`
6. `PROPOSED RESPONSIBILITY MAP`
7. `RESPONSIBILITY EQUIVALENCE MATRIX`
8. `FALSE-PREMISE RISKS`
9. `MINIMAL VERIFICATION PROBES`
10. `CANDIDATE SUBSTITUTION BOUNDARIES`
11. `SELECTED MIGRATION CONTRACT`
12. `INTERFACE CONTRACTS`
13. `BEHAVIORAL CONTRACTS`
14. `KEEP / ADAPT / DEPRECATE / REMOVE MATRIX`
15. `PARITY TEST MATRIX`
16. `RESOURCE-FLOW ANALYSIS`
17. `SECURITY AND TRUST-BOUNDARY ANALYSIS`
18. `MIGRATION SLICE PLAN`
19. `REMOVAL GATES`
20. `ROLLBACK PLAN`
21. `IMPLEMENTATION READINESS VERDICT`

Use one readiness verdict:

- `READY_FOR_IMPLEMENTATION`
- `READY_WITH_NON_BLOCKING_UNKNOWNS`
- `BLOCKED_BY_CONFIGURATION_UNKNOWN`
- `BLOCKED_BY_RESPONSIBILITY_MISMATCH`
- `BLOCKED_BY_ARCHITECTURE_CONFLICT`
- `BLOCKED_BY_EXTERNAL_FEASIBILITY`
- `BLOCKED_BY_MISSING_RUNTIME_EVIDENCE`
- `BLOCKED_BY_INSUFFICIENT_PARITY_TESTS`
- `BLOCKED_BY_SECURITY_RISK`

## Progressive Disclosure

Read `references/full-workflow.md` when performing a standard or foundational replacement, creating a migration contract, designing parity tests, classifying component lifecycle, or preparing deprecation/removal.

## Repository Extensions

Repository-specific instructions may add authority files, commands, packages, ports, feature flags, acceptance criteria, and removal gates.

They may extend but must not weaken baseline, evidence, parity, rollback, security, deprecation, or removal requirements. Report conflicts instead of silently choosing the less safe rule.

## Related Workflow

Use `three-pass-critical-review` to independently review consequential migration contracts, architecture decisions, removal plans, or autonomous implementation prompts produced by this skill.
