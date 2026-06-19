# ND-1 Slice 0.8.221 ACR — Prooflauncher timing/history

- Analyze: Long proof runs need operator-visible timing and a reusable timing history.
- Critique: A progress percentage is not enough; launchers should estimate completion from prior evidence.
- Refine: Add repo-owned timing-history helper, proof, tests, and docs contract.
- Non-claim: This does not regenerate the external handoff launchers yet; it defines and proves the timing logic the next handoff launcher should use.
