# Repo File/Folder Structure Analysis Report

Workflow: `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF`  
Part: `2 — analyzing repo file/folder structure`  
Input ZIP: `12_PF_20260426_165736_0.3.23.zip`  
Generated: `2026-04-26 Europe/Tallinn`

## Prompt analysis

User goal:
Run part two of `DOCUMENTATION_ANALYSIS_OVERHAUL_AND_RECONCILIATION_LIKE_1PF` using an `analyzing repo file/folder structure` skill against the uploaded repo ZIP.

Required output:
- analyze repo file/folder structure
- include LOC
- identify unusual file structures
- identify usual/expected placements
- generate a report
- keep this as analysis/reporting only, with no repo mutation

## Critical refinement

The phrase “usual file placements” is ambiguous, so this run uses two comparison baselines:
1. common Node/Vite/Express-style repository conventions
2. the user’s established project defaults: root README/HOW_TO_RUN/start scripts, docs governance, logs, versioning, and git-history discipline

This report should not prescribe refactors yet. It should classify structure and risk so later documentation reconciliation can decide what to consolidate, move, or document.


## Refined prompt used

Run the `analyzing repo file/folder structure` skill on the uploaded repository ZIP.

Treat the ZIP as read-only input. Do not modify the repo.

Generate a Markdown report containing:
1. workflow name and step
2. scope and exclusions
3. repo-level metrics: total files, total LOC, total size
4. top-level folder table with file counts, LOC, size, and dominant file types
5. file-type LOC table
6. directory-depth / subtree table
7. largest files by LOC
8. unusual file/folder structures
9. expected/usual placement observations
10. regression-risk hotspots
11. recommended next analysis steps

Use surface-level inspection only:
- filenames
- folder names
- extensions
- LOC
- size
- obvious structure
- no code behavior claims unless directly supported by placement/size/path evidence


---

# Skill used: Analyzing Repo File/Folder Structure

## Skill purpose

Create a surface-level structural inventory of a repository without changing it.

## Skill method

1. Extract uploaded repo ZIP into a temporary analysis folder.
2. Exclude `.git`, dependency folders, caches, and generated build folders from analysis.
3. Count files, bytes, and LOC for text-like files.
4. Group files by top-level folder and extension.
5. Identify high-risk structure patterns:
   - very large files
   - unexpectedly thin handoff docs
   - archived docs competing with current docs
   - generated fixtures committed to repo
   - missing conventional project entrypoints
   - mixed developer tooling/runtime code/docs placement
6. Produce a Markdown report for later documentation reconciliation.

## Scope and exclusions

Excluded from counting:
- `.git/`
- `node_modules/`
- Python/JS cache folders
- common build output folders

Included:
- source files
- tests
- docs
- repo-local skills
- generated test data fixtures
- scripts
- config files

---

# Repo-level metrics

| Metric | Value |
|---|---:|
| Files counted | 227 |
| Total counted LOC | 35,771 |
| Total counted size | 4806.5 KB |
| Documentation files from part one | 82 |
| Documentation LOC from part one | 12,786 |
| Package version | 0.3.23 |
| Package type | module |

Package scripts detected:

```json
{
  "api": "node server/index.js",
  "dev": "vite",
  "test": "node --test",
  "build": "vite build",
  "preview": "vite preview",
  "task-docs:toc": "node scripts/generate-task-docs-toc.mjs",
  "task-docs:check": "node scripts/generate-task-docs-toc.mjs --check",
  "validate:view-e": "node scripts/validate-view-e.mjs"
}
```

---

# Top-level folder structure

| Location | Files | LOC | Size KB | Dominant types |
| --- | --- | --- | --- | --- |
| docs | 62 | 9,501 | 362.6 | .md:62 |
| dashboard | 34 | 7,385 | 260.3 | .js:31, .html:1, .css:1, .json:1 |
| server | 19 | 5,774 | 190.9 | .js:17, .py:1, .ps1:1 |
| tests | 29 | 5,540 | 199.1 | .js:29 |
| [root] | 11 | 2,006 | 102.6 | .md:4, [no ext]:2, .json:2, .env:1 |
| task_docs | 9 | 1,959 | 80.0 | .md:9 |
| tools | 3 | 1,819 | 62.9 | .jsx:1, .html:1, .bat:1 |
| scripts | 6 | 586 | 28.0 | .mjs:3, .py:1, .ps1:1, .sh:1 |
| .codex | 7 | 520 | 16.9 | .md:6, .yaml:1 |
| generated_test_data | 42 | 474 | 3496.6 | .jpg:37, [no ext]:3, .md:1, .json:1 |
| shared | 1 | 162 | 5.3 | .js:1 |
| conf | 1 | 38 | 1.2 | .json:1 |
| .githooks | 2 | 6 | 0.1 | [no ext]:2 |
| logs | 1 | 1 | 0.0 | [no ext]:1 |

---

# File type LOC summary

| Type | Files | LOC | Size KB |
| --- | --- | --- | --- |
| .js | 79 | 15,538 | 550.9 |
| .md | 82 | 12,786 | 526.2 |
| .json | 5 | 1,888 | 59.0 |
| .css | 1 | 1,423 | 34.1 |
| .py | 2 | 1,381 | 49.8 |
| .jsx | 1 | 1,075 | 39.1 |
| .html | 2 | 697 | 23.1 |
| .mjs | 3 | 474 | 23.8 |
| .sql | 1 | 198 | 6.5 |
| .ps1 | 2 | 158 | 4.8 |
| .bat | 1 | 61 | 1.5 |
| [no ext] | 8 | 45 | 0.6 |
| .env | 1 | 36 | 0.9 |
| .sh | 1 | 6 | 0.2 |
| .yaml | 1 | 4 | 0.2 |
| .jpg | 37 | 1 | 3485.9 |

---

# Directory/subtree LOC summary

| Directory | Direct files | Descendant files | Direct LOC | Descendant LOC |
| --- | --- | --- | --- | --- |
| docs | 8 | 62 | 3,425 | 9,501 |
| dashboard | 3 | 34 | 1,891 | 7,385 |
| server | 2 | 19 | 2,087 | 5,774 |
| tests | 29 | 29 | 5,540 | 5,540 |
| docs/OLD_DOCS | 31 | 31 | 4,380 | 4,380 |
| dashboard/services | 9 | 17 | 1,137 | 2,931 |
| [root] | 11 | 11 | 2,006 | 2,006 |
| task_docs | 9 | 9 | 1,959 | 1,959 |
| dashboard/inspect | 8 | 8 | 1,843 | 1,843 |
| tools | 3 | 3 | 1,819 | 1,819 |
| dashboard/services/runtimeTruth | 8 | 8 | 1,794 | 1,794 |
| server/auth | 7 | 13 | 1,127 | 1,678 |
| server/scripts | 2 | 2 | 1,433 | 1,433 |
| docs/button_verification_workflow | 2 | 2 | 873 | 873 |
| docs/button_verification_results | 21 | 21 | 823 | 823 |
| dashboard/views | 5 | 5 | 696 | 696 |
| scripts | 6 | 6 | 586 | 586 |
| server/auth/providers | 6 | 6 | 551 | 551 |
| .codex/skills | 0 | 7 | 0 | 520 |
| .codex | 0 | 7 | 0 | 520 |
| generated_test_data | 5 | 42 | 473 | 474 |
| .codex/skills/button-workflow-verification | 1 | 6 | 118 | 456 |
| server/database | 1 | 1 | 420 | 420 |
| .codex/skills/button-workflow-verification/references | 4 | 4 | 334 | 334 |
| shared | 1 | 1 | 162 | 162 |

---

# Largest files by LOC

| Rank | Path | LOC | Size KB | Surface observation |
| --- | --- | --- | --- | --- |
| 1 | server/index.js | 1,869 | 61.4 | large/high-change-risk file |
| 2 | docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md | 1,428 | 44.6 | large/high-change-risk file |
| 3 | dashboard/styles.css | 1,423 | 34.1 | large/high-change-risk file |
| 4 | server/scripts/sqlite_admin.py | 1,280 | 46.0 | large/high-change-risk file |
| 5 | tools/all_views_separate_influenced_elements_tables.jsx | 1,075 | 39.1 | large/high-change-risk file |
| 6 | docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md | 1,023 | 27.6 | large/high-change-risk file |
| 7 | package-lock.json | 930 | 28.7 | large file |
| 8 | tools/jsx_browser_viewer.html | 683 | 22.3 | large file |
| 9 | server/auth/authService.js | 672 | 22.2 | large file |
| 10 | docs/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md | 636 | 7.6 | large file |
| 11 | tests/waveD.e2e.test.js | 612 | 21.3 | large file |
| 12 | docs/buttons_and_implementation_overview.md | 570 | 16.0 | large file |
| 13 | tests/viewB.buttonWorkflow.test.js | 551 | 18.7 | large file |
| 14 | tests/waveA.step2.test.js | 503 | 14.5 | large file |
| 15 | dashboard/services/runtimeTruth/runtimeTruthDemoActions.js | 476 | 16.2 | large file |
| 16 | dashboard/inspect/guideCopy.json | 469 | 19.5 | large file |
| 17 | dashboard/app.js | 454 | 14.9 | large file |
| 18 | docs/AI_AUTHENTICATION_2FA_HANDOFF.md | 446 | 15.2 | large file |
| 19 | task_docs/2026-04-20_view-e-database-viewer.md | 445 | 15.7 | large file |
| 20 | generated_test_data/manifest.json | 432 | 9.0 | large file |

---

# Unusual / important structure findings

| Finding | Location | Evidence | Risk / interpretation |
| --- | --- | --- | --- |
| Docs are the largest logical area | docs/ | 62 files, 9,501 LOC | Expected for this workflow, but `docs/OLD_DOCS/` alone has 31 files / 4,380 LOC, so current vs archived authority is not fully obvious from structure alone. |
| Frontend is split but not under `src/` | dashboard/ | 34 files, 7,385 LOC | Acceptable for a custom dashboard, but unusual compared with common Vite projects where UI source usually lives in `src/`. This is not wrong, but onboarding docs must explain it. |
| Backend has a large central entrypoint | server/index.js | 1,869 LOC | High concentration of backend behavior in one file. This is a maintainability and regression-risk hotspot. |
| SQLite bridge is large but intentionally centralized | server/scripts/sqlite_admin.py | 1,280 LOC | Large single Python DB bridge may be intentional. It should be documented as an architecture boundary so future agents do not bypass it. |
| Tests are flat | tests/ | 29 files, 5,540 LOC | Flat tests are easy to run, but as test count grows, grouping by feature/stage may improve navigation. |
| CSS is very large and centralized | dashboard/styles.css | 1,423 LOC | One huge stylesheet is a UI regression risk. Not necessarily urgent, but it needs conventions or section comments. |
| Generated test media is committed | generated_test_data/ | 42 files, ~3.4 MB | This is acceptable if deliberate, but media fixtures should be documented so future cleanup agents do not delete them. |
| Root run docs are too thin | HOW_TO_RUN.md | 3 LOC / 104 bytes | Unusual for a runnable repo. Strong candidate for HOW_TO_RUN regeneration. |
| No default start script visible | root/start_scripts/ | not present | Your newer default project structure expects start scripts. This repo currently relies on npm scripts and a tool BAT, not root start scripts. |
| Schema is at repo root | schema.sql | 198 LOC | Usable, but many repos would place this under `server/database/`, `db/`, or `migrations/`. If kept at root, docs should clearly mark it canonical. |
| Tooling folder contains large viewer assets | tools/ | 3 files, 1,819 LOC | The folder contains large JSX/HTML helper artifacts. This is okay, but should be documented as developer-only tooling. |
| Repo-local skills exist | .codex/skills/ | 7 files, 520 LOC | Good. This matches the custom workflow approach, but skill naming/discovery should be indexed in docs. |

---

# Usual placement comparison

| Area | What is present | Usual / expected placement | Assessment |
|---|---|---|---|
| Main README | `README.md` at root | Root | Good |
| Changelog | `CHANGELOG.md` at root | Root | Good |
| Version marker | `VERSION` at root | Root or package metadata | Good |
| Run guide | `HOW_TO_RUN.md` at root | Root | Present but too thin |
| Start scripts | No root `start_win.cmd`, no `start_gui.cmd`, no `start_scripts/` found | Your newer standard expects root start scripts | Gap vs current project default |
| Backend entrypoint | `server/index.js` | `server/` or `src/server/` | Fine, but large |
| Frontend source | `dashboard/` | Common Vite default is `src/`; custom apps may use `dashboard/` | Fine if documented |
| Database schema | `schema.sql` at root | Often `db/`, `server/database/`, or `migrations/` | Acceptable if explicitly documented as canonical |
| DB bridge | `server/scripts/sqlite_admin.py` | `server/scripts/` or `server/database/` | Acceptable; architecture boundary should be documented |
| Tests | Flat `tests/*.js` | `tests/` is normal; subfolders are common at larger scale | Fine now, may need grouping later |
| Current docs | `docs/*.md` | `docs/` | Good |
| Archived docs | `docs/OLD_DOCS/*.md` | Archive folder is okay | Needs authority/retirement rules |
| Repo-local skills | `.codex/skills/` | `.codex/skills/` | Good for Codex-style local skills |
| Logs | `logs/.gitkeep` only | Root `logs/` with named log files per your newer default | Partial vs newer standard |
| Generated fixtures | `generated_test_data/` with images | Acceptable if fixtures are intentional | Should be documented and protected from cleanup |

---

# Regression-risk hotspots from structure alone

| Hotspot | Evidence | Why it matters |
|---|---|---|
| `server/index.js` | 1,869 LOC | Large central entrypoint increases chance of accidental regressions during backend edits |
| `dashboard/styles.css` | 1,423 LOC | Large stylesheet can cause broad visual regressions |
| `server/scripts/sqlite_admin.py` | 1,280 LOC | Central DB bridge is important; changes need tests and clear contract |
| `docs/OLD_DOCS/` | 31 files / 4,380 LOC | Archived docs may conflict with current docs unless clearly marked deprecated |
| `placeholder_implementations.md` | Root-level large markdown file, 54.5 KB | The name suggests provisional/placeholder material but it lives at root and is large |
| `HOW_TO_RUN.md` | 104 bytes | Handoff/run instructions are underdeveloped |
| `tools/` | 1,819 LOC | Developer tools are significant enough to document |
| `generated_test_data/` | 42 files / ~3.4 MB | Fixture media should be deliberately retained or moved to external fixture policy |

---

# Recommended next steps

| Step | Recommended action | Why |
|---:|---|---|
| 1 | Run **HOW_TO_RUN Auto-Regenerator Agent** | `HOW_TO_RUN.md` is present but too small to be useful |
| 2 | Run **Browser Repo Verifier & Doc Curator** against `docs/` and `docs/OLD_DOCS/` | The repo has many docs and a large archive folder |
| 3 | Generate a `docs/STRUCTURE_MAP.md` | The custom layout needs a clear map for future agents |
| 4 | Generate a `docs/DOC_AUTHORITY_INDEX.md` | Needed to clarify current vs old documentation authority |
| 5 | Decide whether `placeholder_implementations.md` is current, archived, or should be split | It is a large root doc with unclear authority |
| 6 | Add or document start scripts if this repo should follow the newer default project structure | Current scripts are npm-based only |
| 7 | Add fixture policy for `generated_test_data/` | Prevent future cleanup agents from deleting useful fixtures |
| 8 | Mark structural hotspots before implementation work | `server/index.js`, `sqlite_admin.py`, and `dashboard/styles.css` should be snapshot-sensitive |

---

# Full file inventory

| Path | Type | LOC | Size KB |
| --- | --- | --- | --- |
| .codex/skills/button-workflow-verification/SKILL.md | .md | 118 | 6.0 |
| .codex/skills/button-workflow-verification/agents/openai.yaml | .yaml | 4 | 0.2 |
| .codex/skills/button-workflow-verification/references/agent-patterns.md | .md | 126 | 3.0 |
| .codex/skills/button-workflow-verification/references/compounding-reuse.md | .md | 109 | 2.1 |
| .codex/skills/button-workflow-verification/references/repo-evidence-map.md | .md | 44 | 1.9 |
| .codex/skills/button-workflow-verification/references/report-template.md | .md | 55 | 1.2 |
| .codex/skills/view-a-init-reconciliation/SKILL.md | .md | 64 | 2.5 |
| .githooks/commit-msg | [no ext] | 3 | 0.1 |
| .githooks/pre-commit | [no ext] | 3 | 0.1 |
| .gitignore | [no ext] | 37 | 0.4 |
| CHANGELOG.md | .md | 204 | 5.7 |
| HOW_TO_RUN.md | .md | 9 | 0.1 |
| README.md | .md | 183 | 5.0 |
| VERSION | [no ext] | 1 | 0.0 |
| conf/runtime-truth.json | .json | 38 | 1.2 |
| dashboard/app.js | .js | 454 | 14.9 |
| dashboard/index.html | .html | 14 | 0.8 |
| dashboard/inspect/backendStatusMetadata.js | .js | 360 | 18.7 |
| dashboard/inspect/bindInspectModes.js | .js | 233 | 6.1 |
| dashboard/inspect/controlMetadata.js | .js | 276 | 9.9 |
| dashboard/inspect/guideCopy.js | .js | 14 | 0.9 |
| dashboard/inspect/guideCopy.json | .json | 469 | 19.5 |
| dashboard/inspect/guideUtils.js | .js | 47 | 1.2 |
| dashboard/inspect/realityMetadata.js | .js | 289 | 13.8 |
| dashboard/inspect/tooltipController.js | .js | 155 | 4.5 |
| dashboard/services/apiClient.js | .js | 215 | 4.8 |
| dashboard/services/authPreflightService.js | .js | 53 | 1.7 |
| dashboard/services/databaseViewerService.js | .js | 49 | 1.7 |
| dashboard/services/initService.js | .js | 75 | 2.5 |
| dashboard/services/renderers.js | .js | 325 | 10.6 |
| dashboard/services/runtimeExecutionService.js | .js | 43 | 1.5 |
| dashboard/services/runtimeTruth.js | .js | 281 | 8.5 |
| dashboard/services/runtimeTruth/runtimeTruthActionUtils.js | .js | 148 | 4.7 |
| dashboard/services/runtimeTruth/runtimeTruthAuthActions.js | .js | 151 | 9.0 |
| dashboard/services/runtimeTruth/runtimeTruthBehavior.js | .js | 158 | 6.9 |
| dashboard/services/runtimeTruth/runtimeTruthDatabaseActions.js | .js | 424 | 14.2 |
| dashboard/services/runtimeTruth/runtimeTruthDemoActions.js | .js | 476 | 16.2 |
| dashboard/services/runtimeTruth/runtimeTruthGuards.js | .js | 118 | 2.4 |
| dashboard/services/runtimeTruth/runtimeTruthPersistence.js | .js | 112 | 3.5 |
| dashboard/services/runtimeTruth/runtimeTruthState.js | .js | 207 | 7.9 |
| dashboard/services/runtimeTruthPersistenceService.js | .js | 23 | 0.7 |
| dashboard/services/transitTerminal.js | .js | 73 | 2.6 |
| dashboard/shared/constants.js | .js | 24 | 0.7 |
| dashboard/styles.css | .css | 1,423 | 34.1 |
| dashboard/views/databaseViewerView.js | .js | 280 | 12.1 |
| dashboard/views/initView.js | .js | 147 | 7.6 |
| dashboard/views/lastRunView.js | .js | 40 | 3.0 |
| dashboard/views/runningProcessView.js | .js | 75 | 4.2 |
| dashboard/views/testView.js | .js | 154 | 9.2 |
| docs/AI_AUTHENTICATION_2FA_HANDOFF.md | .md | 446 | 15.2 |
| docs/AUTH_ICLOUDPD_MANUAL_VERIFICATION.md | .md | 127 | 5.7 |
| docs/AUTH_ICLOUDPD_SESSION_VERIFICATION.md | .md | 170 | 6.9 |
| docs/CANONICAL_SCHEMA_PROPOSAL.md | .md | 287 | 9.7 |
| docs/IMPLEMENTATION_STATUS_AUDIT.md | .md | 227 | 18.9 |
| docs/OLD_DOCS/00_TABLE_OF_CONTENTS.md | .md | 126 | 6.7 |
| docs/OLD_DOCS/01_SYSTEM_OVERVIEW.md | .md | 85 | 3.3 |
| docs/OLD_DOCS/02_SYSTEM_INVARIANTS.md | .md | 45 | 2.2 |
| docs/OLD_DOCS/03_ARCHITECTURE.md | .md | 78 | 2.2 |
| docs/OLD_DOCS/04_SINGLE_SOURCE_OF_TRUTH.md | .md | 99 | 3.2 |
| docs/OLD_DOCS/05_STATE_MACHINE.md | .md | 91 | 2.9 |
| docs/OLD_DOCS/06_DATABASE_SCHEMA.md | .md | 140 | 3.5 |
| docs/OLD_DOCS/07_PIPELINE_STAGES.md | .md | 64 | 2.0 |
| docs/OLD_DOCS/08_WORKERS_AND_OWNERSHIP.md | .md | 73 | 2.1 |
| docs/OLD_DOCS/09_CRON_AND_WATCHDOG.md | .md | 61 | 2.8 |
| docs/OLD_DOCS/10_CONCURRENCY_AND_LOCKING.md | .md | 84 | 3.0 |
| docs/OLD_DOCS/11_LOGGING_AND_EVENT_MODEL.md | .md | 75 | 1.8 |
| docs/OLD_DOCS/12_STATE_AND_RECOVERY.md | .md | 76 | 3.4 |
| docs/OLD_DOCS/13_FRONTEND_BACKEND_CONTRACT.md | .md | 1,023 | 27.6 |
| docs/OLD_DOCS/14_VERSIONING_AND_CHANGELOG_RULES.md | .md | 50 | 1.4 |
| docs/OLD_DOCS/15_CURRENT_IMPLEMENTATION_STATUS.md | .md | 331 | 11.8 |
| docs/OLD_DOCS/16_DOCUMENTATION_RECONCILIATION_REPORT.md | .md | 147 | 5.3 |
| docs/OLD_DOCS/17_REPO_ANALYSIS_AND_DOC_UPDATE_PROMPT.md | .md | 59 | 2.2 |
| docs/OLD_DOCS/18_CANONICAL_BACKEND_CONTRACT_SET.md | .md | 90 | 7.0 |
| docs/OLD_DOCS/19_BACKEND_RUNTIME_CONTRACT.md | .md | 255 | 8.5 |
| docs/OLD_DOCS/20_STATE_AND_TRUTH_CONTRACT.md | .md | 197 | 7.5 |
| docs/OLD_DOCS/21_EXECUTION_AND_RECOVERY_CONTRACT.md | .md | 269 | 8.5 |
| docs/OLD_DOCS/22_ACCEPTANCE_AND_VALIDATION_CONTRACT.md | .md | 124 | 4.6 |
| docs/OLD_DOCS/23_VIEW_A_INIT_RECONCILIATION_PROMPT.md | .md | 121 | 5.2 |
| docs/OLD_DOCS/DASHBOARD_OVERVIEW.md | .md | 84 | 5.4 |
| docs/OLD_DOCS/VIEW_A_INIT.md | .md | 67 | 3.9 |
| docs/OLD_DOCS/VIEW_B_TEST.md | .md | 82 | 3.6 |
| docs/OLD_DOCS/VIEW_C_LAST_RUN_INFO.md | .md | 41 | 1.9 |
| docs/OLD_DOCS/VIEW_D_RUNNING_PROCESS.md | .md | 64 | 2.8 |
| docs/OLD_DOCS/VIEW_E_DATABASE_VIEWER.md | .md | 83 | 4.5 |
| docs/OLD_DOCS/issues_errors_discrepancies.md | .md | 196 | 9.0 |
| docs/VERSIONING_AND_CHANGELOG_POLICY.md | .md | 170 | 4.3 |
| docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md | .md | 1,428 | 44.6 |
| docs/button_verification_results/AUTHORITATIVE_MISSING_FUNCTIONALITY.md | .md | 23 | 5.2 |
| docs/button_verification_results/INDEX.md | .md | 26 | 7.3 |
| docs/button_verification_results/RUN_LOG.md | .md | 42 | 11.0 |
| docs/button_verification_results/VIEW_A_1A_VERIFY_ENV.md | .md | 51 | 3.4 |
| docs/button_verification_results/VIEW_A_2A_CHECK_DB.md | .md | 45 | 2.7 |
| docs/button_verification_results/VIEW_A_2A_DELETE_DB.md | .md | 45 | 2.8 |
| docs/button_verification_results/VIEW_A_2A_INSPECT_DB.md | .md | 45 | 2.7 |
| docs/button_verification_results/VIEW_A_2A_RECREATE_DB.md | .md | 45 | 2.8 |
| docs/button_verification_results/VIEW_A_3A_CHECK_SCHEDULER.md | .md | 51 | 3.4 |
| docs/button_verification_results/VIEW_A_3A_INSTALL_SCHEDULER.md | .md | 51 | 3.6 |
| docs/button_verification_results/VIEW_A_3A_PRINT_SCHEDULER.md | .md | 51 | 3.3 |
| docs/button_verification_results/VIEW_B_B1_LOGIN_FLOW.md | .md | 48 | 2.7 |
| docs/button_verification_results/VIEW_B_B2_DOWNLOAD_TEST_ACTION.md | .md | 37 | 2.0 |
| docs/button_verification_results/VIEW_B_B3_1_DOWNLOAD_STAGE.md | .md | 33 | 1.7 |
| docs/button_verification_results/VIEW_B_B3_2_INDEX_STAGE.md | .md | 31 | 1.5 |
| docs/button_verification_results/VIEW_B_B3_3_PARSE_GPS_STAGE.md | .md | 33 | 1.7 |
| docs/button_verification_results/VIEW_B_B3_4_GEOCODE_STAGE.md | .md | 34 | 1.8 |
| docs/button_verification_results/VIEW_B_B3_5_ENQUEUE_PLAYBACK_STAGE.md | .md | 31 | 1.7 |
| docs/button_verification_results/VIEW_B_B3_AUTO_RUN_ALL_STAGES.md | .md | 33 | 1.9 |
| docs/button_verification_results/VIEW_B_B4_PLAYBACK_SELECTION.md | .md | 37 | 2.0 |
| docs/button_verification_results/VIEW_B_B5_SCREEN_SIMULATION_CONTROLS.md | .md | 31 | 1.9 |
| docs/button_verification_workflow/BUTTON_VERIFICATION_ACCELERATION_LAYER.md | .md | 237 | 6.9 |
| docs/button_verification_workflow/BUTTON_VERIFICATION_WORKFLOW.md | .md | 636 | 7.6 |
| docs/buttons_and_implementation_overview.md | .md | 570 | 16.0 |
| example.env | .env | 36 | 0.9 |
| generated_test_data/README.md | .md | 41 | 1.6 |
| generated_test_data/corrupted/corrupted_random_01.jpg | .jpg |  | 0.5 |
| generated_test_data/corrupted/corrupted_truncated_02.jpg | .jpg | 1 | 0.0 |
| generated_test_data/duplicates/duplicate_copy_01.jpg | .jpg |  | 94.6 |
| generated_test_data/duplicates/duplicate_copy_02.jpg | .jpg |  | 102.3 |
| generated_test_data/gps_same_location/same_gps_01.jpg | .jpg |  | 111.3 |
| generated_test_data/gps_same_location/same_gps_02.jpg | .jpg |  | 86.8 |
| generated_test_data/gps_same_location/same_gps_03.jpg | .jpg |  | 104.1 |
| generated_test_data/gps_same_location/same_gps_04.jpg | .jpg |  | 103.0 |
| generated_test_data/gps_valid/gps_valid_01.jpg | .jpg |  | 94.6 |
| generated_test_data/gps_valid/gps_valid_02.jpg | .jpg |  | 102.3 |
| generated_test_data/gps_valid/gps_valid_03.jpg | .jpg |  | 88.6 |
| generated_test_data/gps_valid/gps_valid_04.jpg | .jpg |  | 115.4 |
| generated_test_data/gps_valid/gps_valid_05.jpg | .jpg |  | 100.3 |
| generated_test_data/gps_valid/gps_valid_06.jpg | .jpg |  | 101.7 |
| generated_test_data/gps_valid/gps_valid_07.jpg | .jpg |  | 110.0 |
| generated_test_data/gps_valid/gps_valid_08.jpg | .jpg |  | 113.3 |
| generated_test_data/gps_valid/gps_valid_09.jpg | .jpg |  | 102.1 |
| generated_test_data/gps_valid/gps_valid_10.jpg | .jpg |  | 96.5 |
| generated_test_data/heic | [no ext] | 0 | 0.0 |
| generated_test_data/invalid_gps/invalid_gps_01.jpg | .jpg |  | 113.1 |
| generated_test_data/invalid_gps/invalid_gps_02.jpg | .jpg |  | 94.1 |
| generated_test_data/manifest.json | .json | 432 | 9.0 |
| generated_test_data/mixed_batch/corrupted_random_01.jpg | .jpg |  | 0.5 |
| generated_test_data/mixed_batch/duplicate_copy_01.jpg | .jpg |  | 94.6 |
| generated_test_data/mixed_batch/gps_valid_01.jpg | .jpg |  | 94.6 |
| generated_test_data/mixed_batch/invalid_gps_01.jpg | .jpg |  | 113.1 |
| generated_test_data/mixed_batch/no_gps_01.jpg | .jpg |  | 96.4 |
| generated_test_data/mixed_batch/rotated_01.jpg | .jpg |  | 100.5 |
| generated_test_data/mixed_batch/same_gps_01.jpg | .jpg |  | 111.3 |
| generated_test_data/no_gps/no_gps_01.jpg | .jpg |  | 96.4 |
| generated_test_data/no_gps/no_gps_02.jpg | .jpg |  | 107.1 |
| generated_test_data/no_gps/no_gps_03.jpg | .jpg |  | 101.1 |
| generated_test_data/no_gps/no_gps_04.jpg | .jpg |  | 110.2 |
| generated_test_data/no_gps/no_gps_05.jpg | .jpg |  | 101.7 |
| generated_test_data/no_gps/no_gps_06.jpg | .jpg |  | 107.2 |
| generated_test_data/no_gps/no_gps_07.jpg | .jpg |  | 108.9 |
| generated_test_data/no_gps/no_gps_08.jpg | .jpg |  | 106.3 |
| generated_test_data/rotated/rotated_01.jpg | .jpg |  | 100.5 |
| generated_test_data/rotated/rotated_02.jpg | .jpg |  | 101.1 |
| generated_test_data/videos_no_gps | [no ext] | 0 | 0.0 |
| generated_test_data/videos_with_gps | [no ext] | 0 | 0.0 |
| logs/.gitkeep | [no ext] | 1 | 0.0 |
| package-lock.json | .json | 930 | 28.7 |
| package.json | .json | 19 | 0.5 |
| placeholder_implementations.md | .md | 373 | 54.5 |
| schema.sql | .sql | 198 | 6.5 |
| scripts/append_button_verification_run.py | .py | 101 | 3.8 |
| scripts/generate-task-docs-toc.mjs | .mjs | 297 | 8.2 |
| scripts/install-githooks.ps1 | .ps1 | 5 | 0.2 |
| scripts/install-githooks.sh | .sh | 6 | 0.2 |
| scripts/validate-view-e.mjs | .mjs | 137 | 5.0 |
| scripts/version_guard.mjs | .mjs | 40 | 10.6 |
| server/auth/authLogSanitizer.js | .js | 49 | 1.0 |
| server/auth/authPersistence.js | .js | 72 | 2.4 |
| server/auth/authRoutes.js | .js | 157 | 4.5 |
| server/auth/authRuntimeTruth.js | .js | 11 | 0.3 |
| server/auth/authService.js | .js | 672 | 22.2 |
| server/auth/authSessionService.js | .js | 111 | 3.6 |
| server/auth/authState.js | .js | 55 | 1.6 |
| server/auth/providers/icloudAuthProvider.js | .js | 1 | 0.1 |
| server/auth/providers/icloudpdProcessRunner.js | .js | 169 | 5.5 |
| server/auth/providers/icloudpdProvider.js | .js | 277 | 11.1 |
| server/auth/providers/icloudpdSanitizer.js | .js | 39 | 1.1 |
| server/auth/providers/mockDisabledProvider.js | .js | 14 | 0.4 |
| server/auth/providers/providerRegistry.js | .js | 51 | 1.4 |
| server/database/databaseService.js | .js | 420 | 13.5 |
| server/index.js | .js | 1,869 | 61.4 |
| server/logging/projectLogger.js | .js | 156 | 3.9 |
| server/scheduler_host.js | .js | 218 | 6.2 |
| server/scripts/sqlite_admin.py | .py | 1,280 | 46.0 |
| server/scripts/windows_task_scheduler.ps1 | .ps1 | 153 | 4.6 |
| shared/schedulerPlatformCapabilities.js | .js | 162 | 5.3 |
| task_docs/2026-04-20_dashboard-transit-terminal.md | .md | 64 | 2.9 |
| task_docs/2026-04-20_explain-controls-inspect-mode.md | .md | 232 | 9.6 |
| task_docs/2026-04-20_explain-values-source-mode.md | .md | 224 | 9.3 |
| task_docs/2026-04-20_runtime-backend-foundation.md | .md | 374 | 15.6 |
| task_docs/2026-04-20_show-backend-status-mode.md | .md | 276 | 11.5 |
| task_docs/2026-04-20_show-real-vs-mock-mode.md | .md | 258 | 10.3 |
| task_docs/2026-04-20_view-e-database-viewer.md | .md | 445 | 15.7 |
| task_docs/README.md | .md | 44 | 1.5 |
| task_docs/_TABLE_OF_CONTENTS.md | .md | 42 | 3.6 |
| tests/authApi.step1.test.js | .js | 243 | 9.0 |
| tests/authFrontendControls.test.js | .js | 53 | 2.3 |
| tests/authHardening.test.js | .js | 45 | 2.1 |
| tests/authIcloudpdProvider.test.js | .js | 234 | 11.3 |
| tests/authLogout.test.js | .js | 51 | 2.5 |
| tests/authPersistence.test.js | .js | 65 | 2.6 |
| tests/authProviderRegistry.test.js | .js | 37 | 1.4 |
| tests/authRuntimeTruth.test.js | .js | 17 | 1.1 |
| tests/authService.test.js | .js | 233 | 8.5 |
| tests/authSessionService.test.js | .js | 275 | 9.6 |
| tests/authState.test.js | .js | 66 | 2.3 |
| tests/authTwoFactor.test.js | .js | 0 | 0.0 |
| tests/initApi.step1.test.js | .js | 360 | 13.5 |
| tests/inspectMetadata.test.js | .js | 245 | 7.6 |
| tests/playbackLoop.test.js | .js | 162 | 5.1 |
| tests/projectLogger.test.js | .js | 39 | 1.5 |
| tests/runtimeExecutionService.test.js | .js | 11 | 0.7 |
| tests/runtimeTruthHelpers.test.js | .js | 77 | 3.3 |
| tests/transitGateway.test.js | .js | 105 | 3.2 |
| tests/viewA.2A.databaseButtons.buttonWorkflow.test.js | .js | 281 | 9.7 |
| tests/viewA.3A.schedulerButtons.buttonWorkflow.test.js | .js | 175 | 6.0 |
| tests/viewA.verifyEnv.buttonWorkflow.test.js | .js | 116 | 3.5 |
| tests/viewB.buttonWorkflow.test.js | .js | 551 | 18.7 |
| tests/viewSourceBadges.test.js | .js | 24 | 1.1 |
| tests/waveA.step2.test.js | .js | 503 | 14.5 |
| tests/waveB.step3.test.js | .js | 404 | 12.6 |
| tests/waveC.step4.test.js | .js | 302 | 13.1 |
| tests/waveD.e2e.test.js | .js | 612 | 21.3 |
| tests/waveE.step5.test.js | .js | 254 | 10.9 |
| tools/all_views_separate_influenced_elements_tables.jsx | .jsx | 1,075 | 39.1 |
| tools/jsx_browser_viewer.html | .html | 683 | 22.3 |
| tools/run_jsx_viewer.bat | .bat | 61 | 1.5 |
| vite.config.js | .js | 16 | 0.3 |
