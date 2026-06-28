# V2 proofrunner log ZIP hygiene contract

Date: 2026-06-28
Target: `v0.10.84`

## Problem fixed

During the `v0.10.83` visual proof rerun, a manually created ZIP accidentally included the full prooflauncher run folder. That folder contained `workspace/`, which contained the extracted repository.

This is wrong for proofrunner uploads.

A proofrunner logs ZIP must be small and evidence-only. It must not include the project source tree.

## Required ZIP contents

Allowed/expected content:

```text
prooflauncher.log
run_summary.txt
command_logs/*.log
command_logs/*.exitcode
captured_artifacts/npm_logs/*
captured_artifacts/repo_runtime/proofs/*.json
captured_artifacts/repo_runtime/v2_worker_truth/**/*.jsonl
captured_artifacts/operator_visual_evidence/*
operator_visual_evidence/*
```

## Forbidden ZIP contents

Forbidden content:

```text
workspace/
extracted repository root
node_modules/
.git/
package.json
package-lock.json
server/
dashboard/
tools/
```

The proofrunner can still use a local workspace while executing. The rule only applies to the final upload ZIP.

## Implementation rule

The launcher must stage a separate logs-only folder before packaging. It must not run:

```text
zip -r "$RESULT_ZIP" "$RUN_TS"
```

or the PowerShell equivalent that compresses the whole run directory.

Instead it must copy only the evidence/log folders into a staging directory and package that staging directory.

## Self-check command

`v0.10.84` adds:

```bash
npm run proof:prooflauncher-logs-zip-hygiene-contract
npm run proof:prooflauncher-logs-zip-hygiene
```

The evidence command checks `PF_PROOFLAUNCHER_LOG_ZIP` and blocks if the ZIP contains repository/workspace paths.

## Target state

A target-run prooflauncher ZIP should be uploadable directly to ChatGPT without manual repacking.
