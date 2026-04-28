# Button Verification Acceleration Layer

This companion document extends the canonical workflow with reusable patterns that make repeated button audits faster, cheaper, and more consistent over time.

## Step 0 - Reuse Existing Evidence First

Before starting a new button audit:

- check `docs/button_verification_results/INDEX.md` for an existing report
- check `docs/button_verification_results/RUN_LOG.md` for prior runs of the same control
- reuse existing endpoint tests before writing new ones
- reuse existing action-runner tests before reaching for browser automation
- reuse inspect metadata anchors before searching the full repo again
- update an existing report when behavior changed instead of creating duplicate reports

## Delegation Pattern

Keep the main agent on the critical path and delegate only bounded sidecar work.

### Standard trigger rule

Make subagents a standard optional part of the workflow when at least one of these is true:

- the current task is a batch of repeated button audits
- there are `2+` independent read-only discovery tasks
- there is one isolated patch task that can be owned by a separate worker without touching the main agent's files

Do not default to subagents for every single audit. For one small button with no discovery bottleneck, the main agent should usually stay single-threaded.

### Good low-cost delegated subtasks

- locate the rendered control, `data-action`, and inspect metadata files
- locate the service module, endpoint, and backend route registration
- find existing tests that already cover the button or endpoint
- draft or patch a minimal isolated test file when the write scope is clearly separate
- draft the first pass of a per-button report from raw evidence

### Tasks that should stay with the main agent

- final classification of `Works`, `Partial`, `Broken`, or `Mock-only`
- live endpoint execution when the audit depends on the result right now
- decisions about contradictions between UI wording, docs, and code
- integration of test changes and final report wording

## Suggested Agent Split

Use this only when the active environment supports delegated agents and the user asked for or benefits from delegation.

### Explorer pass

Best for a smaller, cheaper explorer agent.

Recommended skill use:

- use `$button-workflow-verification`
- for View A specific actions, also use `$view-a-init-reconciliation` when current-truth docs or View A contradictions matter

Ownership:

- read-only file discovery
- exact file references
- existing test discovery
- inspect metadata discovery

Expected output:

- rendered control file
- shared click-binding file
- action-dispatch file
- service module and endpoint
- backend route file
- existing tests and doc references

### Contract pass

Best for a smaller explorer agent.

Recommended skill use:

- use `$button-workflow-verification`
- for View A actions, include `$view-a-init-reconciliation` when route truth and doc alignment are part of the question

Ownership:

- backend route existence
- request method and path
- response-shape references
- reachability clues from tests or runtime scripts

Expected output:

- endpoint registration evidence
- handler function location
- response contract summary
- known failure modes already covered by tests

### Test patch pass

Best for a smaller worker agent when the write scope is isolated.

Recommended skill use:

- use `$button-workflow-verification`

Ownership:

- one new test file or one clearly bounded existing test file

Expected output:

- minimal test addition
- exact file changed
- no unrelated refactors

### Main agent pass

Ownership:

- live run
- contradiction judgment
- final classification
- report integration
- follow-up prioritization

Recommended skill use:

- use `$button-workflow-verification`
- add a view-specific skill only when the audited button clearly belongs to that narrower domain

## Recommended Model Tiering

When smaller model options are available in the active Codex environment, they are usually enough for:

- file discovery
- action-to-endpoint tracing
- inspect metadata lookup
- existing test discovery
- report skeleton drafting

Reserve the stronger main agent for:

- ambiguous or contradictory findings
- integration decisions
- live-result interpretation
- cross-layer bug diagnosis
- final writeup

In the current Codex environment, good candidates for those smaller delegated passes are mini explorer or mini worker configurations such as `gpt-5.4-mini` or `gpt-5.1-codex-mini` when available.

Use those smaller tiers for discovery and isolated drafting, not for the final truth call.

## Compounding Reuse Assets

These are the artifacts that make the workflow faster after many repetitions.

### 1. Audit index

Maintain `docs/button_verification_results/INDEX.md`.

Why it helps:

- prevents duplicate audits
- gives quick view-level coverage status
- shows which buttons already have tests
- highlights recurring failure patterns

### 1b. Append-only run log

Maintain `docs/button_verification_results/RUN_LOG.md`.

Why it helps:

- preserves every workflow run, including re-runs
- shows full verification history instead of only the latest state
- gives one place to scan all audited buttons
- supports later analysis of recurring regressions

### 2. Action inventory

Maintain a reusable map of:

- visible button label
- `data-action`
- view and section code
- service function
- endpoint
- backend handler
- inspect metadata entry
- tests

Why it helps:

- turns future audits into lookups instead of fresh searches

### 3. Test pattern library

Promote repeated test shapes into reusable patterns when the same structure appears three or more times.

Examples:

- init action-runner test
- runtime stage action-runner test
- inspect metadata stability test
- backend contract smoke test

### 4. Failure taxonomy

Track recurring failure types such as:

- missing route
- wrong endpoint mapping
- UI result surface not updated
- inspect copy drift
- route exists but backend process is unreachable

Why it helps:

- makes triage quicker
- improves consistency in final classification

## Promotion Rules

Promote repeated work into reusable assets when thresholds are met.

- after `3` buttons with the same test shape, extract a shared helper or template
- after `5` buttons in the same view, create a view-specific action inventory
- after `3` recurring failures of the same kind, add a failure playbook entry
- after repeated report formatting work, update the report template rather than rewriting prose
- after every completed audit, append one row to `RUN_LOG.md` before closing the task

## Guardrails

- do not delegate urgent blocking work that the main agent immediately needs
- do not let multiple workers edit the same file unless the user explicitly wants that coordination cost
- do not let a low-cost agent make the final truth classification without review
- do not duplicate the same read-only discovery across agents
- do not claim efficiency gains unless the reusable artifact was actually written down and kept current
