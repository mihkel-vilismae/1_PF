# V2 recovery canonical-strategy Batch 3 — 3+2ACR and post-action XACR

Date: 2026-06-28
Baseline: `PF_login_v0.10.86_batch2_recovery_strategy_proofs_full_git.zip`
Scope: documentation/OpenSpec completion after Batch 1 canonical-state code correction and Batch 2 proof/final-bundle wiring.

## 3+2ACR summary

| Pass | Focus | Finding | Completion before | Completion after |
|---|---|---|---:|---:|
| ACR-1 | OpenSpec recovery schema | Existing `V2_RecoveryStateSchema.md` still described older B11 schema (`schemaVersion = 1`) and did not define canonical-state/strategy ownership. | 4/10 | 10/10 |
| ACR-2 | Architecture spec | Runtime/recovery spec had general durable-state rules but not the engine-neutral state contract. | 6/10 | 9/10 |
| ACR-3 | Implementation status/issues | V2 status and issue register still described recovery as future/open even after v0.10.86 Batch 1/2 proofs. | 5/10 | 9/10 |
| ACR+1 | Proof docs | Proof registry did not clearly group the recovery strategy/canonical-state proof layer. | 6/10 | 9/10 |
| ACR+2 | Release/handoff clarity | Changelog/version did not yet mark the corrected architecture as a finished release checkpoint. | 5/10 | 10/10 |

## Completed design statement

Recovery engines are interchangeable strategies over one canonical recovery-state schema:

```text
Recovery snapshot = project-owned durable state
Recovery engine = selected strategy for recovery decisions
schemaVersion = compatibility key
metadata.createdByEngine = provenance only
```

## OpenSpec completion table

| OpenSpec area | Status | Numeric completeness |
|---|---|---:|
| Canonical recovery state schema | Complete for current slice | 10/10 |
| Engine strategy contract | Complete for current slice | 10/10 |
| API route/recoveryService boundary | Documented and preserved | 9/10 |
| Cross-engine state compatibility rule | Documented and proof-backed | 10/10 |
| v2-stub non-production boundary | Documented | 10/10 |
| Physical power-loss proof boundary | Explicitly deferred | 10/10 |
| Final autonomous bundle recovery-layer wording | Documented/proof-backed | 9/10 |

## Post-action-1 XACR checklist

| Check | Result | Numeric status |
|---|---|---:|
| Docs match Batch 1 code semantics | PASS | 10/10 |
| Docs match Batch 2 proof semantics | PASS | 10/10 |
| OpenSpec README links current recovery contracts | PASS | 10/10 |
| Changelog/version identity coherent | PASS | 10/10 |
| Prooflauncher/proofrunner behavior changed by docs only | NO behavior change | 10/10 |
| Logs-only proof ZIP hygiene rule preserved | PASS | 10/10 |
| Physical power-loss proof not claimed | PASS | 10/10 |

## Remaining non-claims

- No physical unplug/reboot proof is attempted or claimed.
- `v2-stub` is not a production recovery engine.
- Exact video timestamp recovery remains out of scope; same-media restart from beginning is acceptable for the current schema.
- Raspberry target proof must still be run separately with the prooflauncher bundle when target evidence is required.
