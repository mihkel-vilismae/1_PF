---
name: real-icloud-proof-ladder
description: Guide PF_login real iCloud/iCloudPD proof work from safe authentication evidence through bounded real download, continuation, pipeline, and readiness artifacts. Use when Codex works on real iCloud proof, iCloudPD media-source evidence, sanitized auth artifacts, real download evidence, continuation/no-duplicate proof, `real_icloudpd_pipeline`, or the `real_icloud_media_source` v1 gate.
---

# Real iCloud Proof Ladder

## Boundary

Use `icloudpd-login` for interactive authentication guidance and `new-auth-login-monitor` for read-only live auth observation. Use this skill after or around those flows to select and interpret the next proof stage.

Never request, print, inspect, package, or store Apple passwords, 2FA codes, cookie values, raw session contents, authorization headers, raw provider output, or raw downloaded media.

## Read First

Read the current versions of:

- `package.json` for available proof commands;
- `tools/raspberry-v1-readiness-lib.mjs` for exact gate-to-`proof_kind` mapping;
- `docs/proofs/real_icloudpd_pipeline_proof.md`;
- `docs/proofs/real_download_continuation_proof.md`;
- `docs/proofs/real_icloud_media_source_evidence_pack_proof.md`;
- `docs/10_runbooks/real_icloud_evidence_run_package.md`.

Prefer current code and generated proof JSON over chat summaries or older audit docs.

## Workflow

1. Establish the evidence boundary.
   - Record current `VERSION`, package version, HEAD, runtime mode, and proof directory.
   - Inspect cookie/session files by name, length, and timestamp only.
   - Treat login success as auth evidence, not media-source or product readiness.
2. Inspect existing artifacts before running anything.
   - Group `runtime_data/proofs/*.json` by `proof_kind`.
   - Keep the latest artifact by `proof_timestamp`.
   - Record `proof_status`, source file, runtime mode, baseline version, and commit.
3. Select the smallest missing stage.
   - Authentication/session usability.
   - Redacted media-source evidence pack.
   - Bounded real download evidence.
   - Continuation/no-duplicate evidence.
   - Full `real_icloudpd_pipeline`.
   - Readiness re-evaluation.
4. Run only the required opt-in proof.
   - Use the command currently mapped in `package.json`.
   - Preserve real/mock separation; real proofs must not call mock download routes.
   - Do not rerun the full ladder when a later exact artifact is the only blocker.
5. Interpret proof truth.
   - Shell exit zero means the runner behaved as designed; it may still emit `BLOCKED`.
   - Only `proof_status: PASSED` proves the observed proof kind.
   - A helper/evidence-pack proof does not replace `real_icloudpd_pipeline` unless current readiness code explicitly maps it.
6. Re-run readiness only after the relevant artifact is newer than the prior readiness report.

## Canonical Ordering

Use this as a dependency guide, not as a claim that every step must be rerun:

1. Authenticate locally.
2. Produce sanitized auth/session evidence.
3. Produce bounded real download evidence.
4. Prove continuation/no duplicate content.
5. Run `proof:real-icloudpd` when `real_icloudpd_pipeline` is required.
6. Re-run the current readiness command.

The media-source evidence-pack helper may prepare safe templates and handoff variables, but it does not itself log in, download media, or close a readiness gate.

## Report

Separate:

- verified authentication/session evidence;
- latest proof artifacts and statuses;
- exact missing `proof_kind`;
- next command and required opt-in;
- secrets or operator actions that must remain local;
- non-claims for GPS/geocode, worker product output, playback, display, and overall v1 readiness.
