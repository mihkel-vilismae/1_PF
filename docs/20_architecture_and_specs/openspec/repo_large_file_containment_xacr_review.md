# Repo Large-File Containment XACR Review

Status: multipass review for v0.10.26 repository-governance implementation
Scope: large-file containment rule, OpenSpec, agent guidance, and automated check
Runtime impact: none

## Pass 1 — X: cross-check

The repository already has known large-file hotspots. The most risky implementation pattern is adding new feature bodies to `dashboard/app.ts`, `dashboard/styles.css`, or `server/index.ts` just because those files already control broad application behavior.

The user's V2 operator-menu slice exposed the problem clearly:

- `dashboard/app.ts` owns startup gate glue but should not own the full V2 UI.
- `dashboard/styles.css` owns shared dashboard styling but should not absorb a new feature stylesheet section.
- Existing large prototype/test files should not become dumping grounds for independent feature contracts.

## Pass 2 — A: analyze

A strict “never touch large files” rule would be wrong because large files sometimes own necessary integration points. A better rule is responsibility-based:

- Large files may receive small integration glue.
- New feature bodies should move to new focused files.
- Large shared CSS should receive only shared tokens/utilities, not feature-specific sections.
- Large tests should not become mixed scenario piles.

## Pass 3 — C: criticize

A prose-only rule is easy to forget. A hard automated check that blocks every large-file edit would be too noisy because version bumps, changelog entries, lockfile metadata, and narrow bug fixes are legitimate.

The check should therefore be mechanical and limited: catch large additions to already-large non-allowlisted files. Human review still decides whether smaller edits respect architecture.

## Pass 4 — R: refine

Implement the rule in three layers:

1. `AGENTS.md` for always-visible repo instructions.
2. OpenSpec for the formal policy and acceptance criteria.
3. `npm run check:large-file-containment` for a repeatable guard.

## Pass 5 — X2: regression pass

This rule must not change runtime behavior, backend APIs, Test/Real mode behavior, proof semantics, worker behavior, auth/session handling, database behavior, crontab behavior, playback, or recovery behavior.

The check must not scan runtime/generated/archive folders as ordinary source-code growth, because those areas already have separate policies.

## Pass 6 — refined implementation prompt

Use this prompt for future implementation work:

```text
Before editing an existing PF_login / PhotoFrame file, check whether it is above 700 LOC or 1500 LOC. Files above 1500 LOC are glue-only unless the change is a narrow same-responsibility bug fix. If a new feature body, view, schema, service, action system, stylesheet section, or unrelated test would be added to a large file, create a new focused file instead. Keep large-file edits small, explain exceptions, and run npm run check:large-file-containment before packaging.
```

## Skills / rules to apply

- Repository `AGENTS.md` documentation navigation and ACR skill-check rules: this is a repo-governance change and should be visible to future agents.
- AI Context Default Exclusion Rule: large files should be loaded on demand when needed, not treated as default context.
- Repo Report Timestamp and LOC Rule: future file/stat analyses should report measured LOC and baseline identity.
- Immutable baseline rule: this docs/check change must preserve existing runtime behavior.
