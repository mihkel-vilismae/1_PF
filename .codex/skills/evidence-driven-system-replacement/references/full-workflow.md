# Evidence-Driven System Replacement — Detailed Reference

## Configuration Truth Matrix

For every material setting distinguish:

- proposed value;
- documented value;
- default value;
- configured value;
- environment override;
- runtime-negotiated value;
- directly observed value;
- actual authority.

Record name, category, current value, source, consumers, override mechanism, confidence, conflict status, and blocking stage.

Typical settings include ports, bind addresses, IDs, paths, API/protocol versions, resolution, frame rate, codec, model, acceleration backend, timeouts, retries, buffers, feature flags, package versions, platform capabilities, credentials, and trust settings.

## Current-System Trace Template

For every component or boundary record:

| Field | Required finding |
|---|---|
| Responsibility | Observable job currently fulfilled |
| Producer/consumer | Upstream and downstream owners |
| Input/output | Format, schema, units, coordinate space, encoding |
| Protocol/API | Call, event, stream, file, network, or device contract |
| Configuration | Requested, configured, overridden, negotiated, observed |
| Lifecycle | Start, stop, restart, reconnect, cancellation, cleanup |
| Error/recovery | Failure states, retries, fallback, operator action |
| Resources | CPU, GPU, memory, bandwidth, storage, locks, queues |
| Evidence | Paths, symbols, tests, logs, traces, observations |
| Confidence | Verified, inferred, unknown, conflicting, stale |

## Responsibility Equivalence Matrix

For every current responsibility record:

- current component(s);
- current consumers;
- observable result;
- target component(s);
- target treatment: preserve, reuse, adapt, wrap, replace, change, remove, missing;
- required contract;
- intentional differences;
- regression risk;
- evidence and confidence.

For every target responsibility verify that an owner exists and that ownership is not duplicated unintentionally.

## Candidate Seam Evaluation

For each candidate substitution boundary evaluate:

- responsibility represented;
- old/new producer and consumer;
- data and state contract;
- timing and ordering;
- lifecycle and cleanup;
- errors and health;
- configuration leakage;
- protocol or transport leakage;
- conversions and copies;
- latency and resource cost;
- testability;
- comparison method;
- rollback;
- migration complexity;
- future removal value;
- regression risk.

Reject seams that merely rename code, combine unrelated responsibilities, create competing sources of truth, or force both implementations' details downstream.

## Interface Contract Template

Define:

- responsibility;
- preconditions;
- inputs and outputs;
- ownership;
- lifecycle and state model;
- timing and concurrency;
- cancellation and cleanup;
- errors and recovery;
- configuration authority;
- observability;
- resource limits;
- old implementation;
- new implementation;
- contract tests;
- migration phase.

## Behavioral Difference Classification

Use:

- `PARITY_REQUIRED`
- `INTENTIONAL_CHANGE_PROPOSED`
- `INTENTIONAL_CHANGE_APPROVED`
- `REGRESSION`
- `UNKNOWN_DIFFERENCE`

For every non-parity result state the affected consumer/user, reason, approval status, compatibility impact, and verification.

## Characterization and Parity Matrix

Cover:

- normal operation;
- boundary values;
- invalid input;
- unavailable dependency;
- restart/reconnect;
- cancellation and cleanup;
- configuration changes;
- resource pressure;
- timing and ordering;
- user-visible output;
- integration behavior;
- known failure cases;
- long-running stability where relevant.

Use the same contract-level test against both implementations where practical. When simultaneous execution is unsafe, use sequential A/B runs, recorded inputs, or a test harness.

## Resource-Flow Checklist

Map:

- acquisition;
- encoding and decoding;
- serialization and deserialization;
- format conversion;
- full-data copies;
- buffer allocation and reuse;
- queue ownership and limits;
- backpressure;
- stale-work policy;
- retries;
- CPU/GPU/memory;
- network/storage;
- latency;
- thermal effects;
- exclusive-resource ownership.

Prefer latest-work-only or bounded queues when downstream processing can lag. Do not let a slow replacement block an independent display, control, or safety path unless the contract requires it.

## Observability Checklist

Expose where relevant:

- active implementation;
- effective and negotiated configuration;
- current state;
- input and output freshness;
- last successful input/output;
- last error;
- processing latency and throughput;
- skipped or dropped work;
- queue depth;
- retries and restarts;
- session or generation identity;
- dependency health.

A connection or process that is alive but produces no required output is not healthy.

## Security and Trust Checklist

Review:

- data crossing new boundaries;
- authentication and authorization;
- bind address and network exposure;
- encryption;
- credentials and secrets;
- input validation;
- replay/impersonation;
- diagnostic/log exposure;
- sensitive payload redaction;
- resource-abuse and denial-of-service risk;
- operational ownership.

## Component Lifecycle Matrix

Classify each relevant component:

- `KEEP_UNCHANGED`
- `KEEP_AND_REUSE`
- `KEEP_WITH_ADAPTER`
- `REFACTOR_TO_INTERFACE`
- `TEMPORARY_FALLBACK`
- `DEPRECATION_CANDIDATE`
- `DEPRECATED_AFTER_PARITY`
- `REMOVE_ONLY_AFTER_GATE`
- `UNKNOWN_PENDING_EVIDENCE`

Record responsibility, consumers, evidence, target role, required change, dependencies, risk, selection behavior, rollback, and removal gate.

## Migration Stage Gates

### 1. Baseline and Evidence

Exit only when current behavior, configuration authority, critical unknowns, and safe probes are documented.

### 2. Responsibility Modeling

Exit only when every current and proposed material responsibility has an owner and treatment.

### 3. Migration Contract

Exit only when the seam, contracts, tests, observability, rollback, and removal gates are explicit.

### 4. Characterization

Exit only when the old path still works and required baseline results can be repeated.

### 5. Minimal Vertical Slice

Exit only when the new path produces the required end-to-end result behind the selected seam without deleting the old path.

### 6. Contract Verification

Exit only when required parity tests and approved differences pass, including failure and cleanup behavior.

### 7. Controlled Default Switch

Exit only when the new default is observable, rollback is deterministic, and no unintended dual ownership exists.

### 8. Deprecation

Exit only when new dependencies on the old path are prevented and remaining consumers/removal gates are documented.

### 9. Removal

Remove only in a separately approved change after all applicable removal gates pass.

## Removal Gate Checklist

1. Actual responsibility verified.
2. Consumers verified.
3. Replacement responsibility verified.
4. Behavioral contract passed.
5. Intentional differences approved.
6. No required production consumer remains.
7. Configuration and operations migrated.
8. Required observability exists.
9. Repeatable validation passes.
10. Lifecycle and cleanup pass.
11. Reliability criteria pass.
12. Security implications accepted.
13. Rollback documented and available.
14. Removal explicitly approved.

Do not remove shared utilities based only on names or apparent legacy association.
