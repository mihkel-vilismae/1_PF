---
name: photo-frame-component-sync-verification
description: Audit static component synchronization in the 12_PF photo-frame repository. Use when Codex needs to verify frontend/backend/CronEmulator/version/docs/route/service contracts are aligned, detect version drift, endpoint drift, UI claim drift, inspect metadata drift, or documentation drift without starting live schedulers.
---

# Photo Frame Component Sync Verification

## Operating Rule

Run this as a static and low-side-effect audit first. Do not start CronEmulator, scheduler hosts, Vite, or backend servers unless the user explicitly asks for runtime communication testing. Use `photo-frame-component-communication-smoke-test` for live reachability.

## Scope

Verify sync across persistent components and contracts:

- frontend version display and `__APP_VERSION__`
- backend `/api/version`
- `VERSION`, `package.json`, `package-lock.json`, and `CHANGELOG.md`
- frontend service endpoint constants
- backend route registration in `server/index.ts`
- dashboard UI claims, badges, and source labels
- inspect metadata and source-of-truth copy
- CronEmulator crontab entries as configured commands, not proof of successful runtime behavior
- current-status, backlog, and placeholder docs

## Classification

- `synced`: sources agree and current code supports the claim.
- `version-drift`: version metadata or visible version surfaces disagree.
- `contract-drift`: frontend endpoint/service expectations do not match backend route contracts.
- `ui-drift`: visible UI text/status claims overstate or contradict backend behavior.
- `doc-drift`: docs/status/backlog no longer match code evidence.
- `unknown`: evidence is missing, stale, or unsafe to check statically.

## Read First

- `VERSION`
- `package.json`
- `package-lock.json`
- `CHANGELOG.md`
- `server/index.ts`
- `dashboard/app.ts`
- `dashboard/services/*Service.ts`
- `dashboard/services/runtimeTruth/*`
- `dashboard/inspect/*`
- `shared/schedulerPlatformCapabilities.ts`
- `tools/CronEmulator/crontab_emulated.txt`
- `docs/categorized/current_implementation_status_docs/*`
- `docs/categorized/task_documentation_still_to_implement/*`
- `placeholder_implementations.md`

Use `source-of-truth` with this skill when deciding whether a claim is code-verified, runtime-state, target-spec, documentation-derived, evidence-history, or unknown.

## Workflow

1. State the component set and claim being checked.
2. Build a static component map: frontend, backend, CronEmulator, scheduler host, database/runtime services, docs.
3. Verify version sources and visible version wiring.
4. Compare frontend service endpoints against backend route registration.
5. Compare UI text/badges/inspect metadata against backend capability/status payloads.
6. Compare implementation status docs and backlog against current code evidence.
7. Classify each mismatch using the classification list.
8. Recommend the smallest sync fix; do not implement unless the user asked for changes.

## Verification Commands

Use focused static checks first:

```powershell
node scripts/version_guard.mjs repo
npx tsx --test tests/inspectMetadataDriftGuard.test.js
npx tsx --test tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js
npx tsx --test tests/viewB.buttonWorkflow.test.js
npm run typecheck
```

Run only commands relevant to the changed or audited surface and report skipped checks.

## Output

Report:

- components checked
- sync table with classification
- exact file references for drift
- safe fixes in priority order
- verification commands and results
- runtime checks deferred to the communication smoke-test skill
