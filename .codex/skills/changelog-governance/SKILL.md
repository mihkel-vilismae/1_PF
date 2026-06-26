---
name: changelog-governance
description: Safely audit, repair, trim, split, archive, or update repository changelogs and version-history workflows in PF_login. Use when Codex works on CHANGELOG.md size, duplicate history, DATE_NOT_RECORDED entries, changelog ordering, changelog format, version_guard.mjs, version metadata hooks, changelog tests, or docs/index references to the root changelog.
---

# Changelog Governance

Use this skill to keep `CHANGELOG.md` useful without breaking version metadata, commit hooks, tests, or documentation navigation.

## Core Rule

Treat root `CHANGELOG.md` as a live workflow input, not just prose. Do not move, split, rewrite, or rename it until you have checked the version guard, git hooks, tests, and docs that expect it at the root.

## Required First Checks

Run or inspect these before recommending or making changes:

- `git status --short`
- `Get-Content CHANGELOG.md | Measure-Object -Line`
- `rg -n "CHANGELOG\.md|CHANGELOG|changelog" . -g "!node_modules" -g "!dist" -g "!generated_test_data"`
- `Get-Content scripts/version_guard.mjs`
- `Get-Content .githooks/commit-msg`
- `Get-Content tests/rootDocsQuickstartPolicy.test.js`

If the task is a documentation move, split, archive, or navigation change, also use the repo documentation-governance rules and read the required docs listed in `AGENTS.md`.

## Analysis Checklist

Report these facts separately from recommendations:

- Current line count and number of version headings.
- Latest entry format and whether `scripts/version_guard.mjs` can parse it.
- Duplicate version headings.
- Stray top-level headings, especially more than one `# Changelog` / `# CHANGELOG`.
- Count of `DATE_NOT_RECORDED` markers.
- Whether old history is large because of a few long entries or many small entries.
- Tests or hooks that would break if old history moved.
- Docs that describe `CHANGELOG.md` as a root entry point.

## Safe Change Options

Prefer the smallest option that addresses the real problem:

1. **Guard repair only:** If `version_guard.mjs` cannot parse the current root changelog format, fix the guard and focused tests before any split.
2. **Root cleanup only:** Remove obvious structural defects such as duplicate H1 headings only when tests still pass and historical content remains intact.
3. **Archive split:** Keep root `CHANGELOG.md` canonical for current forward history, move older merged/provenance history to `docs/90_archive/`, leave a clear root pointer, and update docs indexes/freshness metadata in the same slice.
4. **Full reformat:** Only do this when explicitly requested. It has high regression risk because old entries may be provenance rather than clean release history.

Avoid deleting historical entries unless the user explicitly asks. Prefer moving provenance to archive over trimming it away.

## Verification

For analysis-only work, run read-only checks and state what was not changed.

For edits, run at least:

- `node scripts/version_guard.mjs repo`
- `node --test tests/rootDocsQuickstartPolicy.test.js`
- `git diff --check`

If docs were moved or references changed, also run the repository's relevant docs/link checks or a targeted Markdown link check for every changed Markdown file.

## Output

Include:

- Current-state summary with verified facts.
- Recommendation: keep, repair, cleanup, split/archive, or full reformat.
- Regression risks, especially guard/hook/test/doc-index impact.
- Exact files that would change if implementation is requested.
- Commands run and results.
