# Agent Patterns For Repeated Button Audits

Use this reference only when the user explicitly asked for delegation, subagents, or a multi-agent workflow.

## Core Rule

Keep the main agent responsible for the critical path:

- final classification
- live run interpretation
- contradiction resolution
- integration of code or doc changes

Delegate only bounded sidecar work.

Make delegation standard only when it clearly reduces latency:

- repeated audit batch
- `2+` independent discovery subtasks
- one isolated worker-owned patch

Do not default to subagents for every button.

## Pattern A - File Locator Explorer

Recommended use:

- explorer role
- smaller model tier when available
- use `$button-workflow-verification`
- for View A actions, add `$view-a-init-reconciliation` when doc alignment or View A truth is part of the task

Ask it to find:

- rendered control file
- `data-action`
- shared click binding
- action dispatch entry
- inspect metadata entry
- existing tests

Expected output:

- exact file paths
- exact action key
- exact endpoint reference
- no code changes

## Pattern B - Contract Explorer

Recommended use:

- explorer role
- smaller model tier when available
- use `$button-workflow-verification`
- for View A actions, add `$view-a-init-reconciliation` when current-truth routing matters

Ask it to find:

- service function
- HTTP method and path
- backend route registration
- handler function
- existing response contract tests

Expected output:

- route evidence
- handler location
- test references
- no classification claims beyond raw evidence

## Pattern C - Minimal Test Worker

Recommended use:

- worker role
- smaller model tier when available
- use `$button-workflow-verification`

Safe ownership:

- one new isolated test file
- or one clearly bounded existing test file

Expected output:

- minimal patch only
- file changed list
- no unrelated cleanup

## Pattern D - Report Skeleton Worker

Recommended use:

- worker role
- smaller model tier when available
- use `$button-workflow-verification`

Ask it to produce:

- report skeleton using the standard template
- evidence slots filled from already collected artifacts

Keep with main agent:

- final wording
- contradictions
- classification

## Prompting Hints

Good delegated prompts are concrete and narrow.

Examples:

- "Find the rendered file, `data-action`, service call, backend route, and existing tests for the `1A Verify .env` button. Read-only only."
- "Own `tests/viewA.verifyEnv.buttonWorkflow.test.js` only. Add the smallest missing frontend-side action test. Do not touch unrelated files."
- "Draft the per-button report from these artifacts only. Do not decide the final classification if evidence conflicts."

## Anti-Patterns

- Do not delegate the first urgent live diagnostic if the main agent is blocked on it.
- Do not ask two agents to discover the same file path.
- Do not let a report-drafting agent invent evidence that the main agent has not seen.
- Do not let a low-cost worker edit the same file another worker owns.
