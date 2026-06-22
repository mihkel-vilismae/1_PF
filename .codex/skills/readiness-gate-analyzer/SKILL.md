---
name: readiness-gate-analyzer
description: Analyze PF_login proof and release readiness from current gate mappings and latest proof artifacts. Use when Codex needs to explain v1 readiness, completion percentage, blocking gates, missing or stale `proof_kind` artifacts, why related passing proofs do not close a gate, or the smallest next proof command.
---

# Readiness Gate Analyzer

## Truth Model

Always separate:

1. shell/proofrunner execution health;
2. individual proof artifact truth;
3. readiness gate truth;
4. product or v1 release truth.

Do not infer one layer from another.

## Workflow

1. Read the current evaluator and command mapping.
   - For Raspberry v1, inspect `tools/raspberry-v1-readiness-lib.mjs`.
   - Inspect `package.json` for current command names.
   - Do not rely on a remembered gate list.
2. Collect current artifacts.
   - Scan `runtime_data/proofs/*.json`.
   - Group by exact `proof_kind`.
   - Select the latest artifact by `proof_timestamp`.
   - Preserve unreadable-file errors and identity mismatches.
3. Evaluate each required gate exactly as code does.
   - A required gate passes only when every mapped proof has `proof_status: PASSED`.
   - `BLOCKED`, `FAILED`, `PARTIAL`, `TIMED_OUT`, `UNKNOWN`, `MISSING`, and `PLANNED` remain blocking when the evaluator says so.
   - A semantically related proof does not substitute for an unmapped exact `proof_kind`.
4. Check freshness.
   - Flag a readiness artifact as stale when relevant input proofs are newer.
   - Do not report an old readiness percentage as current after later proof runs.
5. Identify the smallest next action.
   - Prefer the exact mapped command for the first actionable blocking proof.
   - Distinguish operator-input blockers from code defects and target-hardware blockers.
   - Do not rerun already-current passing proofs without a reason.

## Non-Claims

- Shell exit zero does not mean the emitted proof passed.
- A passing helper, preflight, schema, evidence-pack, or readiness-input proof does not close another proof kind.
- Windows evidence does not replace Raspberry-target evidence unless current evaluator code explicitly permits it.
- A passing readiness report proves only the evaluated artifact set and environment at its timestamp.

## Report Format

Provide:

- evaluator and artifact directory checked;
- readiness artifact freshness;
- required gate count, passed count, blocked count, and percentage;
- one row per blocked gate with exact proof kinds and latest statuses;
- stale, missing, unreadable, or identity-mismatched artifacts;
- smallest next command;
- explicit product-readiness non-claim.
