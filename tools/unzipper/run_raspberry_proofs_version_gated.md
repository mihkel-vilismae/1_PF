# `run_raspberry_proofs_version_gated.sh`

Version-gated Raspberry proof runner for the PhotoFrame/PF_login repository.

## Purpose

This script runs the Raspberry proof command sequence from a PF_login repository root and writes verbose proof logs into a timestamped proof folder. It then packages those logs into a ZIP under the shared proof-log location.

## Required working directory

Run from the extracted repository root, for example:

```bash
cd /home/mihkel/Download_chrome/Photoframe_proofing/PF_login_v0.8.9
./tools/unzipper/run_raspberry_proofs_version_gated.sh
```

## Version gate

Before any proof command runs, the script compares three version sources:

| Source | Example |
|---|---|
| `VERSION` file | `0.8.9` |
| `package.json` `version` | `0.8.9` |
| Repository folder name | `PF_login_v0.8.9` |

If any version is missing or mismatched, the script stops immediately, writes a `VERSION_CHECK_FAILED_*` proof folder, zips that folder, and opens the proof log location when possible.

This prevents Raspberry proof output from being archived under the wrong version label.

## Proof log output

Successful proof runs are written to:

```text
/home/mihkel/Download_chrome/Photoframe_proofing/proof_logs/v{version}_{datetime}/
/home/mihkel/Download_chrome/Photoframe_proofing/proof_logs/v{version}_{datetime}.zip
```

The proof folder includes:

| File / folder | Meaning |
|---|---|
| `runtime_verbose.log` | Full verbose terminal log for the whole run |
| `summary.txt` | Pass/fail summary with durations |
| `NN_step_name.log` | Per-command logs |
| `repo_proof_artifacts/` | Copied proof/artifact folders when present |

## Commands run

The script runs:

- `npm install`
- `npm run build`
- `npm run typecheck`
- `npm test`
- Raspberry executable permission, environment, tool, and iCloud preflights
- Raspberry generated fixture and cron proofs
- Raspberry app-running/status/chain/target-pack proofs
- Raspberry regular worker product pipeline proof
- Raspberry native image/video playback proofs
- Raspberry address overlay device-display proof
- Raspberry v1 readiness proof

The script continues after individual proof failures so the archive still captures the complete evidence set. It exits non-zero if any command failed.

## Terminal style

The script uses basic ANSI colors for headings, success, warning, and failure messages when running in an interactive terminal. Non-interactive logs remain readable without colors.

## Proof boundary

This script records command evidence and proof artifacts. It does not by itself prove physical display visibility, real iCloud media availability, real GPS/geocode accuracy, or operator-observed playback unless the underlying proof command captures or requires that evidence.
