# Repo Large-File Containment OpenSpec

Status: repository-governance contract
Version introduced: `0.10.26`
Scope: implementation hygiene, review policy, and automated containment check
Runtime impact: none

## Purpose

PF_login / PhotoFrame has several legitimate large files that are already difficult to review safely. New feature work must not keep expanding these files when a focused module, view, service, schema file, stylesheet, or test file can own the new behavior.

This OpenSpec defines when large files may be touched and when a new file is required.

## Baseline large-file examples

The motivating hotspots in the v0.10.25 baseline include:

| File | Approximate LOC at rule creation | Rule interpretation |
|---|---:|---|
| `server/index.ts` | `4324` | backend entrypoint/orchestration only; no unrelated feature bodies |
| `dashboard/styles.css` | `2961` | shared style shell only; avoid feature-specific CSS additions |
| `dashboard/app.ts` | `2083` | dashboard startup/routing glue only |
| `server/auth/newAuthService.ts` | `1341` | auth-domain changes only |
| `tests/viewB.buttonWorkflow.test.js` | `1076` | do not append unrelated feature tests |
| `dashboard/views/initView.ts` | `751` | same-view responsibility only |
| `dashboard/services/runtimeTruth.ts` | `603` | runtime-truth responsibility only |

Line counts are guidance, not proof that a file is wrong. The rule targets future growth and review safety.

## Rule

### Files above 1500 LOC

Files above `1500` physical lines are **glue-only** unless the change is a tightly scoped bug fix inside existing behavior.

Allowed changes:

- imports
- route or view registration
- one small render branch
- narrow adapter glue
- tightly scoped bug fix within the file's existing responsibility

Disallowed changes:

- new feature renderer
- new page/view body
- new data schema
- new action system
- new large CSS section
- new unrelated test scenario
- new backend feature body unrelated to the entrypoint's existing orchestration role

If a change would add roughly more than `50` to `75` lines to a file above `1500` LOC, create a new file and keep the large file as integration glue.

### Files above 700 LOC

Files above `700` physical lines may receive same-responsibility maintenance, but new independent feature behavior should move to a focused file.

Examples:

- A new dashboard view should get its own file under `dashboard/views/`.
- A new static UI schema should get its own file under `dashboard/data/` or equivalent.
- A new proof/check should get its own `tools/check-*.mjs` or `tests/*.test.*` file.

### CSS files

Feature-specific CSS should not be added to a shared stylesheet above `1000` LOC.

Preferred pattern:

```text
shared stylesheet
  small shared tokens/utilities only

feature stylesheet
  feature-specific layout, cards, buttons, and page styles
```

For the V2 operator menu, this means preferring a dedicated stylesheet such as `dashboard/styles.v2.css` instead of adding a large section to `dashboard/styles.css`.

### Tests

Do not keep growing large mixed workflow tests for independent new features.

Preferred pattern:

```text
existing test
  update only when its existing contract changes

new focused test
  verifies the new feature contract directly
```

## Required implementation behavior

Future implementation prompts and code changes should apply this decision path before editing an existing large file:

1. Measure or inspect the target file size.
2. Decide whether the change is glue, same-responsibility maintenance, or new feature body.
3. If the file is above `1500` LOC and the change is not glue or a narrow bug fix, create a new file.
4. If the file is above `700` LOC and the change is independent feature behavior, create a new file.
5. Keep integration changes in large files small and reviewable.
6. Add focused tests/checks for the new feature instead of extending unrelated large tests.

## Automated check

`npm run check:large-file-containment` runs `tools/check-large-file-containment.mjs`.

The check compares the current change range, by default `HEAD~1..HEAD`, and fails when a non-allowlisted file above `1500` LOC receives more than `75` added lines. It also warns/fails for larger additions to files above `700` LOC using the configured soft threshold.

The check is intentionally mechanical. It cannot fully judge architecture. A passing check does not mean the design is good; a failing check means the change needs either a split, a smaller glue change, or an explicitly justified rule update.

Environment overrides:

```text
PF_LARGE_FILE_BASE_REF=<base ref>
PF_LARGE_FILE_HEAD_REF=<head ref>
```

## Allowlisted large files

Some files are large by nature and are allowed to receive small append/metadata updates:

- `CHANGELOG.md`
- `package-lock.json`

Generated, runtime, and archive areas are also excluded from this check because they follow separate policies:

- `runtime_data/`
- `generated_test_data/`
- `docs/90_archive/`

This allowlist does not permit feature logic to be hidden in those files.

## Acceptance criteria

A future implementation is compliant when:

- New feature bodies are added to focused new modules rather than large catch-all files.
- Large files above `1500` LOC receive only small glue, narrow fixes, or same-responsibility maintenance.
- Large shared CSS files do not receive large feature-specific style blocks.
- New independent feature tests are focused and not appended to unrelated large tests.
- `npm run check:large-file-containment` passes for the change set.
- Any exception is documented in the implementation summary with the file, reason, line count, and risk.
