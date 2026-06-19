# Proofrunner packaging identity contract

Status: active packaging contract after v0.8.228 proof-result analysis found stale extract paths.

## Problem pattern

The v0.8.228 proof uploads correctly reported `VERSION`, `package.json`, and HEAD as v0.8.228 / `08f7ee0`, but the extracted repo folder in logs still used an old `PF_login--v0.8.199--debug-page-keybook-skill-full_git` name. That stale folder name creates operator confusion even when the actual code is current.

## Required packaging behavior

Generated repo ZIPs and `2proofrunner 1repo` handoffs must:

1. Keep `VERSION`, `package.json`, and `package-lock.json` aligned.
2. Use a top-level repo folder containing the current version, for example `PF_login--v0.8.233--proof-summary-docs-registry-hotfix-full_git`.
3. Preserve `.git` history in the repo ZIP.
4. Avoid stale root names such as `v0.8.199` in new handoff packages.
5. Validate the extracted ZIP root before claiming the package is ready.

## Non-claims

This packaging contract does not prove runtime behavior, provider access, Raspberry display output, or v1 readiness. It only prevents stale version identity in generated artifacts.
