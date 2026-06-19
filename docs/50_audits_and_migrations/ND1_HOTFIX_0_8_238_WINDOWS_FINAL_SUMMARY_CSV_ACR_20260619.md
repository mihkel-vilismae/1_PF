# ND1 hotfix v0.8.238 — Windows final-summary CSV parser ACR

## Baseline

- Previous version: `0.8.237`
- Previous HEAD: `0ef1521`
- Evidence input: `PF_login_v0.8.237_win_proof_results_20260620_001614.zip`

## 3xACR analysis

| Pass | Result |
|---|---|
| Analyze | Windows v0.8.237 ran 110 proof scripts; 109 exited zero and `proof:full-test` passed. Only `proof:proof-runner-final-summary` failed. |
| Critique | Final summary parsed quoted Windows CSV rows by naive comma split, keeping quotes around `status` and parsing quoted `exit_code` as `NaN`, so it marked PASS rows as failed. |
| Refine | Add a small CSV parser that handles quoted cells and escaped quotes, while preserving TSV support. Add regression coverage for quoted Windows `proof_summary.csv`. |

## Implemented scope

- Fixed `parseProofSummaryTable` to parse quoted CSV safely.
- Added regression test for quoted Windows proof summary rows.

## Preserved behavior

- TSV parsing remains supported for RaspberryOS.
- Final summary still fails honestly when shell proof rows truly fail.
- It does not ignore real nonzero exits.

## Packaging note

This hotfix also updates the default packaging identity slug to `windows-final-summary-csv-hotfix` so generated archive names describe the current slice instead of the prior Raspberry platform-filter hotfix.
