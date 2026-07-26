# Three-Pass Critical Review — Detailed Checklists and Templates

## Adversarial Critic Checklist

### Correctness

- Does the proposal solve the stated problem?
- Are required outcomes, inputs, outputs, and failure behavior complete?
- Are there contradictions, missing responsibilities, or unhandled states?

### Evidence

- Which decisions rely on assumptions?
- Are configuration, versions, paths, ports, capabilities, or runtime behavior guessed?
- Is proposed behavior mistaken for implemented behavior?
- What evidence or verification probe is missing?

### Existing-System Understanding

- Are current responsibilities correctly identified?
- Could hidden consumers, side effects, or operating procedures exist?
- Are all required current outcomes preserved?
- Are names being mistaken for responsibilities?

### Architecture

- Are responsibility boundaries clean?
- Are established layers bypassed?
- Is ownership duplicated?
- Are there competing sources of truth?
- Does each abstraction provide real substitution or testing value?
- Is accidental legacy coupling reproduced?
- Does the design make future removal harder?

### Regression

- What working behavior can break?
- What silent changes can occur?
- Are intentional changes explicit and approved?
- Are compatibility and rollback protected?

### Migration and Rollback

- Can implementations coexist safely?
- Do they compete for exclusive resources?
- Is selection deterministic, observable, and reversible?
- Is cleanup complete before switching?
- Are deprecation and removal separate?
- Are removal gates sufficient?

### Verification

- Do tests verify useful responsibility-level output?
- Are parity, errors, restart, cleanup, and recovery covered?
- Could the system be technically alive but produce no useful result?
- Are acceptance criteria measurable?

### Resources

- Are there duplicate encodes, decodes, conversions, allocations, calls, or queues?
- Can work accumulate without bounds?
- Is stale work discarded?
- Are CPU, GPU, memory, bandwidth, storage, latency, and thermal effects considered?
- Is optimization premature or insufficient?

### Security and Operations

- Is a trust boundary created or weakened?
- Are authentication, authorization, validation, exposure, secrets, logging, deployment, monitoring, and support ownership addressed?

### Scope and Maintainability

- Is the proposal too broad or too narrow?
- Does it include unrelated refactoring?
- Could a smaller vertical slice prove feasibility?
- Are configuration and ownership centralized appropriately?
- Are interfaces stable and testable?

## False-Premise Finding Template

| Field | Content |
|---|---|
| Assumption | Claim used by the proposal |
| Status | Verified, inferred, unknown, conflicting, stale |
| Why suspect | Evidence gap or conflicting signal |
| Consequence | Decision or behavior invalidated if false |
| Minimal probe | Smallest safe verification |
| Blocking stage | Analysis, implementation, cutover, deprecation, removal |

## Critic Finding Template

For every blocking or major finding record:

- identifier;
- severity;
- affected requirement;
- evidence;
- failure scenario;
- consequence;
- required correction;
- smallest safer alternative;
- verification needed.

## Deciding Reviewer Disposition Table

| Finding | Disposition | Reason | Required action | Blocking stage |
|---|---|---|---|---|

Allowed dispositions:

- `ACCEPTED`
- `PARTIALLY_ACCEPTED`
- `REJECTED`
- `DEFERRED_PENDING_EVIDENCE`

## Deep Review Additions

For `DEEP` review also produce:

### Evidence Matrix

Map every load-bearing proposal claim to evidence and confidence.

### Alternatives Analysis

Compare at least the proposed path, the smallest safer alternative, and maintaining the status quo temporarily.

### Failure-Mode Analysis

Identify initiation condition, detection, blast radius, recovery, rollback, and prevention.

### Security/Trust Analysis

Identify new boundaries, credentials, exposure, validation, authorization, logging, and abuse cases.

### Resource Analysis

Estimate or measure compute, memory, bandwidth, storage, latency, queueing, and operational burden.

### Migration/Removal Gates

State entry and exit gates for implementation, cutover, deprecation, and removal.

### Unresolved-Risk Register

For each unresolved item state owner, verification, blocked stage, and acceptable temporary mitigation.

## Final Artifact Requirement

The deciding reviewer must output one corrected, self-contained artifact.

It must include accepted corrections directly. It must not say only “apply the critic's changes” or require the reader to merge earlier passes manually.
