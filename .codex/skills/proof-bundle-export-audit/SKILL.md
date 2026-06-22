---
name: proof-bundle-export-audit
description: Create or audit PF_login proof handoff bundles and ZIP exports for completeness, baseline identity, artifact status, freshness, and secret safety. Use when Codex handles proof-results ZIPs, uploaded proof bundles, missing `PROOF_WIN.PS1`, manual proof export, Raspberry/Windows handoff artifacts, real iCloud evidence packages, or bundle redaction review.
---

# Proof Bundle Export Audit

## Boundary

Prefer existing project exporters and contracts over inventing a new package format. Packaging proof artifacts does not upgrade their `proof_status` or prove product readiness.

Never include passwords, 2FA codes, cookies, raw sessions, authorization headers, `.env` secrets, raw provider output, private auth directories, or raw downloaded iCloud media.

## Read First

Inspect the relevant current surfaces:

- `package.json` proof/export commands;
- `docs/10_runbooks/proofrunner_handoff_windows_launcher_contract.md`;
- `docs/10_runbooks/real_icloud_evidence_run_package.md` for real iCloud packages;
- `tools/real-icloud-evidence-zip-contract-lib.mjs` for its required entries;
- existing proofrunner handoff/export scripts and generated manifests.

## Export Workflow

1. Identify the bundle type and intended consumer.
2. Prefer the matching project command or exporter.
3. If the expected launcher is absent, verify repository identity and use the smallest existing manual export path; do not fabricate `PROOF_WIN.PS1`.
4. Include only relevant generated proof JSON, sanitized operator evidence, safe manifests, and version/commit identity required by the contract.
5. Write the archive outside private/runtime secret directories.
6. Verify the archive exists before linking or handing it off.

## Audit Workflow

1. Inventory archive entries without extracting over the repository.
2. Check baseline identity:
   - root/project version;
   - package/component version when applicable;
   - git commit;
   - source platform and runtime mode.
3. Parse proof JSON and report:
   - `proof_kind`;
   - `proof_status`;
   - timestamp;
   - source file;
   - malformed or duplicate-latest artifacts.
4. Check expected entries against the current bundle contract.
5. Scan filenames and text artifacts for secret-like patterns.
6. Confirm absence of:
   - private auth/session directories;
   - cookie files;
   - `.env` or private environment files;
   - raw provider logs/output;
   - raw media.
7. Check whether readiness summaries are newer than their relevant input proofs.

## Safety

- Extract untrusted uploads into a new temporary directory, never over the active repository.
- Treat executable scripts from uploaded bundles as untrusted; audit them before execution.
- Do not claim a bundle is safe solely because a manifest says `secrets_included: false`.
- Report manifest claims separately from observed archive contents.

## Report Format

Provide:

- bundle path and type;
- identity result;
- included proof kinds and statuses;
- missing/extra/malformed entries;
- freshness result;
- secret-safety findings;
- excluded sensitive categories;
- readiness and product non-claims;
- exact next action.
