# Repo Report Wrapper

Use this skill when answering PF_login / PhotoFrame repository, file-size, LOC, context-load, topology, proof-summary, or baseline-comparison questions.

## Required output wrapper

Start repository/stat reports with:

```text
START: YYYY-MM-DD HH:mm:ss EEST
Baseline: <version/artifact if known>
HEAD: <short git sha if known>
LOC scanned/read: <measured count, estimate, or not measured>
```

End with:

```text
END: YYYY-MM-DD HH:mm:ss EEST
Duration: <elapsed wall-clock time>
```

## LOC honesty rules

- Report exact LOC only when counted from files or command output.
- If only snippets were inspected, say approximate snippets and do not pretend it was a full repo scan.
- If no file scan happened, say `LOC scanned/read: not measured / not applicable`.
- Do not report hidden model token usage as exact LOC.

## Context rules

- Read `.ai-context-ignore` before broad repo scans.
- Do not default-load excluded files such as `package-lock.json`, full `CHANGELOG.md`, generated fixtures, runtime data, archive patches, registry JSONs, or build/cache outputs.
- Load excluded files on demand only when the task directly touches their domain.

## Preferred report fields

For file/stat reports, include these when practical:

```text
baseline
HEAD
checked timestamp
LOC scanned/read
files scanned/read
excluded LOC
remaining LOC
percentage reduction
largest contributors
```

## Non-goals

This skill is output/report governance only. It does not change app runtime behavior, tests, source architecture, Git tracking, or `.gitignore`.
