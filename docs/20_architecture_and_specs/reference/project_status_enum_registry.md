# Project Status Enum Registry

Status: active reference contract  
Introduced: v0.8.134  
Scope: project-wide completeness and proof-honesty reporting.

## Purpose

This registry gives project reports one normalized status vocabulary. It exists so overall completeness reports do not guess whether a row is implemented, specified, scaffolded, blocked, or proven.

## Rules

- Use uppercase enum values in generated project-completeness tables and machine-readable registries.
- Do not convert `SPECIFIED`, `CONTRACTED`, `SCAFFOLDED`, `PLANNED`, or `DOCS_ONLY` into runtime implementation.
- Do not convert `PRE_PASS` into final target proof.
- Do not count `PARTIAL` as a full pass unless the report explicitly uses a half-credit estimate and labels the formula.
- Prefer current OpenSpec, proof runners, and proof artifacts over old snapshots.
- Archive and dated snapshot docs are supporting evidence only unless a current proof or active OpenSpec points to them.

## Enum table

| Enum | Meaning | Counts as implemented? | Counts as proven? | Completeness-report rule |
|---|---|---:|---:|---|
| `PROVEN` | Required behavior has current matching proof/test/target evidence. | yes | yes | May count as complete for the exact proven scope. |
| `PARTIAL` | Some required evidence exists, but at least one required part is incomplete, stale, or needs rerun. | partial | no | Count separately or as explicit half-credit only. |
| `PRE_PASS` | Static/preliminary proof passed, but final release/target reconciliation is not proven. | partial | no | Never present as final release proof. |
| `IMPLEMENTED` | Code/runtime behavior exists, but target proof may still be missing. | yes | no | Count as implementation, not target proof. |
| `IMPLEMENTED_READ` | Read-only behavior exists; mutation/restore/action semantics remain unimplemented. | partial | no | Useful for UI/data-read completeness only. |
| `SPECIFIED` | Behavior is described in OpenSpec/runbook/registry. | no | no | Count as documentation/spec coverage only. |
| `CONTRACTED` | A contract exists and implementation/proof is expected later. | no | no | Count as planned/spec maturity only. |
| `SCAFFOLDED` | Proof/route/helper skeleton exists but target behavior is not proven. | no | no | Must remain distinct from `PROVEN`. |
| `PLANNED` | Future item has a known intent but no implementation/proof. | no | no | Backlog only. |
| `NOT_RUN` | A proof exists or is expected but has not been run in the target context. | no | no | Do not infer pass/fail. |
| `BLOCKED` | Work cannot honestly pass until a dependency is resolved. | no | no | Report blocker and next unblock action. |
| `DECISION_GATED` | Implementation is waiting for an explicit product/architecture decision. | no | no | Do not implement without decision. |
| `DOCS_ONLY` | Documentation/OpenSpec/test coverage exists without runtime behavior. | no | no | Keep separate from runtime completeness. |
| `NOW` | Active near-term work item. | no | no | Prioritization label, not implementation proof. |
| `CLEANUP_ONLY` | Implementation exists, but docs/wording/status cleanup remains. | partial | no | Count only the known implemented sub-scope. |
| `NOT_APPLICABLE` | Proof/status is not relevant to this row. | n/a | n/a | Exclude from percentage denominator unless explicitly included. |

## Proof command state enum

| Enum | Meaning |
|---|---|
| `IMPLEMENTED_COMMAND` | A concrete command exists in `package.json` or tools. |
| `PLANNED_COMMAND` | A proof command is named as future/planned and is not currently runnable. |
| `ARTIFACT_ONLY` | Evidence is expected from an uploaded/generated artifact rather than a command. |
| `DOCS_AUDIT` | Static documentation proof or audit command. |
| `NONE` | No proof command applies to this row. |

## Percentage rule

Reports may print multiple percentages, but each must name the formula:

- strict proof completeness: count only `PROVEN` rows in the numerator;
- implementation completeness: count `PROVEN` and `IMPLEMENTED` rows, with optional labeled partial weights;
- documentation/spec completeness: count `SPECIFIED`, `CONTRACTED`, `DOCS_ONLY`, and `PROVEN` only when the category is explicitly documentation/spec coverage.

Do not mix these formulas in one unlabeled percentage.
