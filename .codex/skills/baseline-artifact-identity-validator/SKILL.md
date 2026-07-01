---
name: baseline-artifact-identity-validator
description: Validate live PF_login repo identity and compare repository ZIPs, proof bundles, handoff artifacts, extracted folders, README checkpoint text, and optional manifests without promoting a baseline. Use when Codex is asked to check the newest full Git ZIP, verify baseline identity, inspect artifact drift, compare live repo state to uploaded archives, or explain version, HEAD, and proof identity mismatches safely.
---

# Baseline Artifact Identity Validator

Use this skill to answer "what exactly is this artifact relative to the live repo?" before any baseline promotion, handoff recommendation, or proof claim.
Identity matching is not the same as readiness proof.

## Read First

- `AGENTS.md`
- `README.md`
- `CHANGELOG.md`
- `docs/10_runbooks/proofrunner_packaging_identity_contract.md`
- `docs/10_runbooks/proofrunner_handoff_windows_launcher_contract.md`
- `docs/10_runbooks/real_icloud_evidence_run_package.md` when the artifact is a real iCloud evidence package
- `.codex/skills/proof-bundle-export-audit/SKILL.md` when the artifact is primarily a proof or evidence bundle

## Validation Workflow

1. Establish live repo identity first.
   - Record branch, clean/dirty state, `VERSION`, package version, and HEAD.
   - When relevant, note package-lock version, latest commit age, and whether local proof directories are present or absent.
2. Classify the artifact before validating it.
   - Full Git repo ZIP
   - proof or evidence ZIP
   - handoff bundle
   - merge kit
   - extracted folder
   - documentation claim without a packaged artifact
3. Compare the expected identity fields for that artifact type.
   - archive root name
   - manifest version and package version
   - git commit or branch metadata
   - source platform or runtime mode when the contract expects it
   - proof JSON fields such as `proof_kind`, `proof_status`, `baseline_version`, `git_commit`, and timestamp
4. Check repo prose that presents itself as current.
   - Compare root `README.md` checkpoint or baseline text to live `VERSION` and HEAD.
   - Distinguish root current-facing docs from compatibility or archive docs.
   - Report stale prose as identity drift, not as implementation proof.
5. Report exact mismatches.
   - expected value
   - actual value
   - source file or archive entry
   - whether the issue is identity-only, packaging-only, or potentially proof-affecting
6. Classify the result conservatively.
   - `MATCHED`
   - `MISMATCHED`
   - `MISSING_FIELDS`
   - `AMBIGUOUS`
   - `NOT_ENOUGH_LIVE_PROOF_DATA`
7. Recommend the smallest safe next action.
   - explicit baseline promotion decision
   - stale doc update
   - rerun current-baseline proof
   - reject artifact as a baseline candidate
   - hand off to `proof-bundle-export-audit` for deeper proof-bundle review

## Required Boundaries

- Do not auto-promote any ZIP or extracted folder as the new baseline.
- Do not infer correctness from archive names alone when manifest or Git data disagrees.
- Do not turn identity matches into readiness claims.
- Do not mark missing local proof directories as PASS; use `NOT_ENOUGH_LIVE_PROOF_DATA` or `NOT_RUN`.
- Do not report old current-checkpoint text in compatibility or archive docs as a live-repo bug unless the file is intended to be current-facing.

## Output Contract

Report:

- live repo identity
- artifact type
- compared identity fields
- exact mismatches or missing fields
- whether proof data was available locally
- whether the artifact is suitable for baseline consideration
- readiness and product non-claims
- exact next action
