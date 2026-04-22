\# Button Verification Workflow (System Standard)



\## Purpose



This document defines the \*\*canonical workflow\*\* for verifying any UI button across the system.



It ensures:



\* correct UI → backend wiring

\* elimination of hidden mock logic

\* alignment with inspect system (Explain / Reality / Backend status)

\* enforceable test coverage

\* metadata centralization



This workflow is \*\*regression-intolerant\*\* and must be applied consistently.



\---



\## Scope



Applies to any button:



\* View: `A / B / C / D`

\* Section: e.g. `1A`, `B3.2`, `D2`

\* Element: any actionable UI control



\---



\## Workflow Steps



\### Step 1 — UI Trigger



\* Action: press button

\* Verify:



&#x20; \* click handler exists

&#x20; \* event fires

\* Fail if:



&#x20; \* no response

&#x20; \* silently ignored



\---



\### Step 2 — Frontend Wiring



\* Verify:



&#x20; \* correct handler is bound

&#x20; \* correct `data-action` / selector is used

\* Fail if:



&#x20; \* wrong mapping

&#x20; \* missing handler



\---



\### Step 3 — Frontend → Backend Call



\* Verify:



&#x20; \* network request is triggered

\* Check:



&#x20; \* endpoint path

&#x20; \* HTTP method

\* Example:



&#x20; \* `/api/init/verify-env`

\* Fail if:



&#x20; \* no request

&#x20; \* incorrect endpoint



\---



\### Step 4 — Backend Endpoint Existence



\* Verify:



&#x20; \* endpoint exists

&#x20; \* route is registered

\* Fail if:



&#x20; \* 404

&#x20; \* route missing



\---



\### Step 5 — Backend Logic Execution



\* Verify:



&#x20; \* logic runs without crash

&#x20; \* produces a valid response

\* Check:



&#x20; \* logs

&#x20; \* response structure

\* Fail if:



&#x20; \* exception

&#x20; \* invalid or empty output



\---



\### Step 6 — Response Handling (Frontend)



\* Verify:



&#x20; \* response reaches UI

&#x20; \* UI updates:



&#x20;   \* result surface

&#x20;   \* logs

&#x20;   \* status badge

\* Fail if:



&#x20; \* UI not updated

&#x20; \* stale state remains



\---



\### Step 7 — Mock / Reality Validation



\* Verify:



&#x20; \* no unintended mock/stub logic exists



\* Classify:



&#x20; \* Real

&#x20; \* Mock

&#x20; \* Mixed

&#x20; \* Missing



\* Fail if:



&#x20; \* UI claims real but is mock

&#x20; \* backend claimed but missing



\---



\### Step 8 — Inspect System Alignment



\#### 8.1 Validate Inspect Modes



For each button:



\* Explain controls

\* Explain values

\* Show real vs mock

\* Show backend status



Verify:



\* text matches real implementation

\* no contradictions



\---



\#### 8.2 Update Inspect Metadata



\* Fix incorrect labels/descriptions

\* Ensure consistency across:



&#x20; \* button

&#x20; \* section

&#x20; \* logs

&#x20; \* result surfaces



\---



\#### 8.3 Metadata Source Enforcement



\* Verify:



&#x20; \* no inline hardcoded inspect text



\* If found:



&#x20; \* move → `.json` metadata files



\* Rule:



&#x20; \* behavior MUST NOT change during migration



\---



\### Step 9 — Test Coverage



\* Verify:



&#x20; \* endpoint test exists



If missing:



\* create minimal test:



&#x20; \* trigger endpoint

&#x20; \* assert response shape



Optional:



\* UI interaction test



\---



\### Step 10 — Audit Registry Recording



\* Verify:



&#x20; \* every workflow run appends one new entry to `docs/button_verification_results/RUN_LOG.md`

&#x20; \* the run points to the per-button report artifact

\* Preferred mechanism:



&#x20; \* `python scripts/append_button_verification_run.py ...`

\* Fail if:



&#x20; \* the button was audited but no run-log entry was added

&#x20; \* the log entry does not point to the report for that run



\---



\## Final Classification



Each button must be labeled:



\* ✅ Works — all steps pass

\* ⚠️ Partial — some steps fail

\* ❌ Broken — critical failure

\* 🧪 Mock-only — intentional simulation



\---



\## Non-Negotiable Rules



\* No silent mock logic in “real” flows

\* No inline inspect text (must be metadata-driven)

\* No mismatch between UI wording and implementation

\* Every backend endpoint must be testable

\* Every workflow run must append a row to `docs/button_verification_results/RUN_LOG.md`

\* Every UI action must be traceable end-to-end



\---



\## Intended Usage



This workflow is designed to:



\* standardize debugging across all views

\* drive test creation

\* guide backend completion

\* eliminate ambiguity between real vs mock

\* enforce documentation accuracy



\---



\## Expansion Plan



Apply this workflow progressively:



1\. View A (Init)

2\. View B (Test flow, especially B3 pipeline)

3\. View D (runtime preview)

4\. All remaining views



\---



\## Notes



This workflow is intentionally strict.



It is designed for:



\* deterministic system behavior

\* auditability

\* long-term maintainability



Any deviation must be explicitly justified.

\---

\## Reuse And Delegation Layer

For repeated button audits, also use `docs/button_verification_workflow/BUTTON_VERIFICATION_ACCELERATION_LAYER.md`.

That companion layer defines:

\* when to reuse existing button reports before starting a new audit

\* how `RUN_LOG.md` and `INDEX.md` serve different reuse purposes

\* how to split sidecar work across smaller explorer or worker agents when delegation is available

\* which work must remain with the main agent

\* which reusable assets should be maintained so the workflow gets faster over time

\* promotion rules for turning repeated work into inventories, templates, and shared test patterns



