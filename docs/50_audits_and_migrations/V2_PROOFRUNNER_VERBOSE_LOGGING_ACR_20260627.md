# V2 proofrunner verbose logging ACR — 2026-06-27

## Problem

The proofrunner bundle was started from the wrapper folder correctly, but `npm install` failed because the repository lockfile still contained container-internal OpenAI artifact URLs such as `packages.applied-caas-gateway1.internal.api.openai.org`. A target Raspberry/Linux machine cannot reach those URLs.

The first launcher also wrote a single timestamped log file, but the operator needs a full run folder, real-time verbose logs, per-command logs, npm debug log capture, and a final ZIP that can be copied back to ChatGPT.

## ACR decision

The safe fix is two-layered:

1. Sanitize repository npm registry metadata so target machines use the public npm registry.
2. Ship a verbose prooflauncher that creates a timestamped run directory, streams output in real time, saves per-command logs, and always packages the run logs even if a command fails.

## Implemented repository changes

- Added `.npmrc` with `registry=https://registry.npmjs.org/` and retry settings.
- Replaced container-internal `package-lock.json` resolved URLs with public npm registry URLs.
- Bumped repository identity to `0.10.79`.

## Launcher requirements for the generated proofrunner bundle

The external prooflauncher must:

- create `proofrunner_runs/<timestamp>/`;
- write `prooflauncher.log` in real time;
- write one log per command in `command_logs/`;
- capture environment/package/git/npm information before execution;
- copy npm debug logs into the run folder when npm fails;
- package the run folder as `<timestamp>_proofrunner_logs.zip`;
- try to open the run folder with `xdg-open`/platform equivalent after completion;
- exit non-zero if any required command failed, after packaging logs.

## Status

This is a packaging/proofrunner quality fix. It does not claim a successful target-machine proof. The target machine must still run the new proofrunner bundle and return the generated logs ZIP.
