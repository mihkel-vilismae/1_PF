# Repo report timestamp and LOC protocol

Status: repo-local AI/Codex reporting contract  
Scope: repository/file/stat/context-analysis answers  
Runtime impact: none

## Purpose

Repo/file-analysis answers should be easy to audit later. When an AI assistant or Codex agent reports repository statistics, file-size findings, context-exclusion savings, or broad analysis results, the answer should include a small timing and context-read wrapper.

This makes it clear:

- when the analysis began,
- when the analysis ended,
- how long it took,
- which baseline/HEAD was used,
- how many lines were actually scanned/read when that can be measured.

## Required report wrapper

For repo/file/stat/context answers, print this shape unless the user explicitly asks for a tiny answer:

```text
START: YYYY-MM-DD HH:mm:ss EEST
Baseline: <artifact/repo/version if known>
HEAD: <git short sha if known>
LOC scanned/read: <measured count, estimate, or not measured>

<body>

END: YYYY-MM-DD HH:mm:ss EEST
Duration: <wall-clock difference from START to END>
```

## LOC scanned/read rules

Use honest wording:

| Case | Required wording |
|---|---|
| Tool/script counted exact file LOC | `LOC scanned/read: <number> measured from <source>` |
| Only selected snippets were inspected | `LOC scanned/read: ~<number> inspected snippets, not full repo` |
| Full repo text scan was performed | `LOC scanned/read: <number> tracked text LOC scanned` |
| No meaningful file scan happened | `LOC scanned/read: not measured / not applicable` |

Do not claim hidden model token usage as exact LOC. LOC should be based on files, tool output, script output, or visibly inspected snippets.

## Timestamp rules

- Use Estonian local time for this project unless the user asks otherwise.
- Include the timezone label, normally `EEST` during summer and `EET` during winter.
- Use concrete date and time, not only relative time.
- The end timestamp and duration belong at the end of the answer.

## Interaction with `.ai-context-ignore`

Before broad repo analysis, read `.ai-context-ignore` and avoid default-loading excluded paths. If excluded paths are loaded on demand, mention why they were loaded.

Example:

```text
Loaded on demand: package-lock.json, because this task changed version metadata.
```

## When to use this protocol

Use it for:

- largest-file/LOC reports,
- folder-size/file-count reports,
- repo topology/status reports,
- AI-context/default-exclusion reports,
- proof-result summaries that involve scanned files,
- large-file shrink/split analysis,
- before/after baseline comparisons.

Do not force it into casual chat or tiny yes/no answers unless the user asks.

## Codex prompt

Give this to Codex when asking it to follow the same reporting style:

```text
For repository/file/stat/context-analysis answers, include a report wrapper. At the top print START with exact local timestamp and timezone, then Baseline, HEAD, and LOC scanned/read when measurable. At the end print END with exact local timestamp and Duration. Be honest about LOC: count files or inspected snippets when possible; otherwise write "not measured". Before broad repo analysis, respect .ai-context-ignore and load excluded files only on demand when the task directly requires them. Do not claim hidden token usage as exact LOC. Keep runtime behavior unchanged unless explicitly asked to implement code changes.
```
