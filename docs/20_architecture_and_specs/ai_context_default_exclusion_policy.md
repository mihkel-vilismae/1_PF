# AI Context Default Exclusion Policy

Status: repository-local AI context governance policy  
Project: PF_login / PhotoFrame  
Scope: AI-assisted repo analysis and handoff context selection  
Runtime impact: none

## Purpose

PF_login contains several large files that are important to keep in the repository but are usually low-value or noisy for broad AI parsing. This policy defines which paths should be excluded from default AI context and when they should be loaded on demand.

The policy is intentionally separate from `.gitignore`. It does not delete, untrack, or hide files from Git. It only guides AI agents and repo-local tools when choosing default context.

## Default rule

Before broad repo analysis, read `.ai-context-ignore` and avoid loading those paths by default.

Use narrow search, line-range reads, summaries, or targeted sections first. Load an excluded file fully only when the user's task directly touches that file's domain.

## Default exclusions and on-demand triggers

| Path / pattern | Default behavior | Load on demand when the task involves... |
|---|---|---|
| `package-lock.json` | Exclude from broad AI context | dependency resolution, npm install issues, package-lock/version-lock diffs, reproducible install debugging |
| `CHANGELOG.md` | Exclude full-file reads; inspect latest or matching sections first | changelog edits, release notes, version history, duplicate version cleanup, changelog archive/split planning |
| `generated_test_data/**` | Exclude | generated fixture validation, media fixture debugging, proof fixture regeneration |
| `runtime_data/**` | Exclude | current proof evidence, runtime status inspection, worker/debug proof artifacts |
| `docs/90_archive/patches/**` | Exclude | patch archaeology, rollback planning, old diff comparison |
| `*.patch` | Exclude | applying, reviewing, or generating patch files |
| `docs/40_backlog_and_tasks/debug_page_keybook.json` | Exclude | Debug page keybook or registry-specific work |
| `docs/40_backlog_and_tasks/overall_project_goal_registry.json` | Exclude | project goal registry analysis or maintenance |
| `node_modules/**` | Exclude | dependency source debugging where vendored files are explicitly needed |
| `dist/**`, `build/**`, `coverage/**`, `.cache/**`, `.vite/**` | Exclude | build artifact, coverage, cache, or generated frontend-output debugging |

## Must-not-exclude defaults

The policy must not exclude these active source/spec/test areas by default:

```text
server/**
dashboard/**
tests/**
docs/20_architecture_and_specs/openspec/**
```

These paths are high-value implementation/specification context and must remain available for normal analysis.

## Safe workflow

1. Start with source, tests, OpenSpec, and focused docs.
2. Search excluded files only by keyword when needed.
3. Read small line ranges from excluded files before loading the whole file.
4. Load a full excluded file only when the task explicitly requires it.
5. Never delete, untrack, split, or rewrite an excluded file merely because it is excluded from default AI context.

## Changelog special case

`CHANGELOG.md` is canonical release history and is wired into repository workflow. Do not split or rewrite it as a casual parseability cleanup.

Before changing changelog structure, verify:

```text
scripts/version_guard.mjs
.githooks/commit-msg
tests/rootDocsQuickstartPolicy.test.js
docs/table_of_contents.md
docs/DOC_INDEX.md
docs/DOC_FRESHNESS_MATRIX.md
```

## Package lock special case

`package-lock.json` is intentionally tracked and must remain available for dependency reproducibility. Excluding it from default AI context does not mean excluding it from commits, version bumps, release artifacts, or dependency audits.

## Proof and runtime data special case

`runtime_data/**` is noisy in broad analysis but may be proof authority during proof/debug tasks. When a user asks about proof evidence, latest worker status, Raspberry readiness, or runtime outputs, load the relevant runtime files on demand.

## Validation

Run:

```bash
npm run check:ai-context-policy
```

The check verifies that the manifest exists, required default exclusions are present, and active source/spec/test folders are not accidentally excluded.
