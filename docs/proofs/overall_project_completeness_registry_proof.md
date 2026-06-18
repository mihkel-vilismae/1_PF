# Overall Project Completeness Registry Proof

Status: active static proof contract  
Introduced: v0.8.137

## Purpose

`npm run proof:overall-project-completeness-registry` validates the machine-readable overall project goal registry used by completeness reports.

## What it proves

- The registry has active Raspberry v1, Debug page, and active backlog categories.
- Every registry status uses the normalized status enum.
- Planned proof commands are separated from implemented commands.
- Source paths referenced by registry rows exist in the repo.
- Debug page runtime/UI goals do not claim implementation before code/proof exists.

## What it does not prove

- It does not run live Raspberry proof commands.
- It does not prove runtime Debug page UI behavior.
- It does not prove hardware behavior.
- It does not replace `npm run proof:raspberry-v1-readiness`.
