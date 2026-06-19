# ND-1 hotfix ACR: docs, registry, proof summary, and handoff packaging

Status: implemented in v0.8.229 through v0.8.234.

Baseline snapshot: v0.8.228 / HEAD `08f7ee0`.

## Analyze

The v0.8.228 Windows and RaspberryOS proof uploads showed that the PowerShell safe-log-name hotfix worked, but the run was not fully green. Both proof summaries had one shell-level failure: `proof:full-test`. The RaspberryOS proof artifact exposed the two stale failures:

1. `tests/docsNpmScriptReferences.test.js` — proof README missed new proof scripts added by the ND-1 bridge and the v0.8.228 proofrunner hotfix.
2. `tests/overallProjectCompletenessRegistry.test.js` — Debug page registry count expected 20 rows while the registry now has 25 rows after the world-class local proof track.

A separate proof-honesty issue was also visible: `proof_runner_final_summary` reported `PASSED` even when `proof_summary` contained a failed proof command.

## Critique

The failures were not provider, UI, or Raspberry hardware implementation failures. They were stale governance/docs/test expectations plus proofrunner handoff visibility gaps. Rerunning v0.8.228 proofs without code changes would reproduce the same two failures and could still hide shell-level failure status behind a green final summary.

## Refine

The safe fix order was:

| Version | Slice | Purpose |
|---|---|---|
| v0.8.229 | Proof README/script references | List all current proof scripts so docs and package scripts stay aligned. |
| v0.8.230 | Debug registry count reconciliation | Keep 25 Debug rows and explicitly allow proven non-runtime local proof-track rows without runtime overclaiming. |
| v0.8.231 | Final summary shell-failure honesty | Include shell proof-summary rows so failed commands make final summary `FAILED`. |
| v0.8.232 | Handoff artifact export contract | Require `PF_PROOF_SUMMARY_PATH` and failed-artifact packaging in generated launchers. |
| v0.8.233 | Packaging identity contract | Prevent stale v0.8.199 root names in new repo/handoff packages. |
| v0.8.234 | Documentation ACR cleanup | Tie the runbooks and audit record together. |

## Implemented boundaries

Preserved:

- Existing proof scripts and runtime behavior.
- Debug page runtime/local proof claims and non-claims.
- Raspberry v1 readiness gate semantics.
- Honest `BLOCKED` provider/device semantics.

Changed:

- Docs now list the proof scripts added by the ND-1 bridge.
- The Debug registry test now reflects 25 rows and distinguishes runtime implementation claims from local proof-track planning/completion rows.
- Final summary can now become `FAILED` when shell-level proof summary rows contain nonzero exits.
- Handoff launcher contracts now require summary-path handoff and failed proof artifact export.
- Packaging identity contract rejects stale archive roots such as `v0.8.199` for new packages.

## Risks / tradeoffs

- `proof:proof-runner-final-summary` may now exit nonzero when a prior proof command failed. That is intentional proof honesty, but it can add one more failed row in proofrunner summaries.
- The handoff artifact-export and packaging-identity proofs are static/local contracts. They do not replace real Windows/Raspberry proofrunner uploads.
- Real provider and Raspberry device blockers remain separate from this docs/tooling hotfix.

## Next proof expectation

After this hotfix, the immediate stale `proof:full-test` failures should be resolved. Remaining proof output should be interpreted as:

- hard failures: fix before claiming a green baseline,
- `BLOCKED`: missing real provider/device/operator evidence,
- Raspberry v1 readiness: still dependent on real iCloud media, real geocode, regular worker product pipeline, and address overlay device display.
