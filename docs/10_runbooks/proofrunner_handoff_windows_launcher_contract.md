# Proofrunner handoff Windows launcher contract

Status: active handoff-launcher contract after the v0.8.196 Windows proofrunner baseline-verification failure.

## Problem pattern

A Windows handoff launcher must not read package metadata from the launcher folder when the repo has already been extracted elsewhere. It must not call methods such as `.Trim()` on possibly-null external command output.

The failed pattern was equivalent to this:

```powershell
$PkgValue = (& node -e "console.log(require('./package.json').version)" 2>$null).Trim()
```

That can fail because `require('./package.json')` is scoped to the current PowerShell directory, not necessarily the extracted repo root, and because a failed external command may produce `$null` output.

## Required Windows behavior

The Windows proofrunner must:

1. Extract the repo ZIP into a run-specific directory.
2. Find the extracted repo root by locating `package.json`.
3. Read `VERSION` from `$RepoRoot\VERSION`.
4. Read package version from `$RepoRoot\package.json` with PowerShell JSON parsing, or use a repo-root-scoped command.
5. Read Git HEAD with `git -C $RepoRoot rev-parse --short HEAD`.
6. Check every baseline value for null/blank before comparing.
7. Fail with an actionable launcher error instead of a raw PowerShell null-method exception.

## Required validation before release

For every future `2proofrunner 1repo` handoff containing both Windows and Raspberry launchers, handoff validation must include:

| Launcher | Required validation |
|---|---|
| `PROOF_RASPBERRYOS.SH` | `bash -n`, expected version/head/repo basename markers |
| `PROOF_WIN.PS1` | expected version/head/repo basename markers, null-safe package read, repo-root-scoped package read, actionable baseline failure messages |

Bash-only validation is not sufficient for a Windows+Raspberry handoff.

## Operator note

Windows may show a security warning for downloaded PowerShell scripts. If the operator trusts the ZIP source, they may run:

```powershell
Unblock-File .\PROOF_WIN.PS1
```

This only removes the Windows downloaded-file warning. It does not bypass proof checks, baseline verification, or script trust decisions.

## Non-claims

This contract does not prove real iCloud login, provider download, Raspberry hardware behavior, product pipeline completion, address overlay device display, or final v1 readiness. It only defines launcher robustness and validation requirements.


## Safe proof log filenames

Windows proofrunner launchers must not use the invalid regex pattern `-replace '[:/\]','_'` when turning proof names into log filenames. The backslash makes that .NET regex character class invalid.

Prefer literal replacement instead:

```powershell
$safe = $proof.Replace(':','_').Replace('/','_').Replace('\','_')
```

This prevents repeated `InvalidOperation: The regular expression pattern [:/\] is not valid` errors while the proof queue continues.


## Work directory path escaping

Generated PowerShell launchers must not use a double-quoted string containing `\run_` for the work directory. In Python-generated launcher text this can become a carriage return (`\r`) and produce paths like `_pf_2proofrunner_work un_...`. Use nested `Join-Path` calls instead:

```powershell
$WorkRoot = Join-Path $RootDir '_pf_2proofrunner_work'
$WorkDir = Join-Path $WorkRoot "run_${RunId}_win"
```


## Bash heredoc Node queue output escaping

Generated Raspberry/Linux launchers must avoid `join('\\n')` inside the embedded Node queue-discovery heredoc. Use `String.fromCharCode(10)` instead so Python or other launcher-generation code cannot turn `\n` into a real newline inside a JavaScript string literal.


## Stale generated identity guard

Every generated proofrunner handoff must carry the current repo identity in both launchers and in `README_PROOFRUNNER.md`:

- current `VERSION` value;
- current short Git HEAD;
- repo ZIP filename;
- repo ZIP SHA-256.

Generated handoffs must fail validation if stale launcher identities such as `0.10.84` or `0.10.86` appear in the active generated launcher text. Historical changelog references may remain in normal docs, but not in the generated handoff surface that the operator runs.

## Queue helper import resolution

Generated launchers must not write `discover-proof-queue.mjs` into the handoff/run folder and then import `./tools/proof-runner-queue-lib.mjs`. Node ESM resolves relative imports from the helper file location, so that pattern can fail even if the launcher has changed the process working directory to the extracted repo root.

Accepted patterns:

- Bash/Linux/Raspberry: run the queue helper as repo-root stdin/module text from inside `cd "$repo_root"` / `cd "$REPO_ROOT"`.
- PowerShell/Windows: write the temporary `discover-proof-queue.mjs` at `$RepoRoot` before invoking `node`, then remove it after queue discovery.
- Advanced generators may also use an absolute repo-root file URL/import for `tools/proof-runner-queue-lib.mjs`.

Queue discovery failure or an empty proof queue must remain a nonzero launcher failure. Generated launchers must not package a misleading zero-proof success ZIP.
