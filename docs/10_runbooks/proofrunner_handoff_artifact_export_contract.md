# Proofrunner handoff artifact export contract

Status: active handoff-launcher contract after the v0.8.228 Windows/Raspberry proof-result analysis.

## Problem pattern

A proofrunner can execute every command and still produce a misleading final report when shell-level proof failures are not connected to `proof:proof-runner-final-summary`. A proofrunner can also lose the most useful failure diagnostics if failed proof JSON artifacts are not included in the uploaded ZIP.

## Required launcher behavior

Every generated `2proofrunner 1repo` handoff launcher must:

1. Keep running the queue after individual proof failures so later summary/export commands still run.
2. Write `proof_summary.csv` or `proof_summary.tsv` with `name`, `status`, `exit_code`, and `log_file`.
3. Set `PF_PROOF_SUMMARY_PATH` or `PF_PROOF_SUMMARY_FILE` before running `npm run proof:proof-runner-final-summary`.
4. Write `repo_identity.json` with `proof_scripts_failed_exit_nonzero` and `proof_scripts_passed_exit_zero`.
5. Package `logs/`, `repo_identity.json`, `logs/proof_timing_history.jsonl`, and all available `runtime_data/proofs/*.json` artifacts even when one proof command failed.

## Non-claims

This contract does not make a failed proof pass. It only ensures failed proof diagnostics survive handoff upload and that final summary status cannot hide shell-level failures.
