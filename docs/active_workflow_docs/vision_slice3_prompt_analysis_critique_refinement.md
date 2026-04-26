# Slice 3 Prompt Analysis, Critique, and Refinement

Status: Slice 3 execution prompt record.
Created: 2026-04-26 20:08 EEST.
Scope: documentation-only target architecture, pipeline, auth, scheduler, runtime recovery, and final reconciliation.

## Analysis

Slice 3 must finish the up-to-date vision/specification documentation set without changing production behavior. The post-Slice-2 repo already has the evidence base, current vision, implementation reality, dashboard view roles, unresolved questions, and a deprecated/superseded documentation log. Slice 3 therefore should not repeat broad inventory work. It should convert the remaining target areas into explicit, evidence-bounded specs.

The slice must also respect verification constraints established by the user and Slice 2:

- Do not run auth tests.
- Do not run the full `npm test`, because it includes auth tests.
- Do not rerun a command that has hung twice unless it is inspected/fixed first.
- `npm run task-docs:check` timed out twice in Slice 2, so Slice 3 should record it as skipped rather than rerun it.
- Continue to use suitable repo-local skills where applicable.

The main Slice 3 documentation need is a precise separation between:

- current implementation reality;
- target architecture;
- documented intent;
- implementation gaps;
- unresolved decisions requiring user input.

## Critique of the incoming Slice 3 request

The request is directionally correct, but it needs additional safeguards:

1. It says to run Slice 3, but does not explicitly restate the auth-test exclusion. This must be carried forward.
2. It asks for the final ZIP, but the prompt must explicitly require the ZIP to include `.git` history and all three slice commits.
3. It asks for target specs, but without status labels the docs could accidentally present planned behavior as implemented behavior.
4. It asks for final reconciliation, but does not require a user-facing unresolved question phase. The prompt must require targeted questions after the ZIP.
5. It mentions skills generally, but Slice 3 should record exactly which repo-local skills were inspected and how they were used.

## Refined Slice 3 prompt

```text
You are running Slice 3 of the 3-slice vision/specification documentation reconciliation workflow for the 12_PF / 1_PF photo-frame dashboard project.

STRICT MODE:
- Snapshot-safe.
- Regression-intolerant.
- Documentation-only by default.
- Preserve git history.
- One logical commit for Slice 3.
- Do not squash commits.
- Do not permanently delete documentation files.
- Do not move old docs in this slice unless explicitly required; update the deprecated/superseded docs log instead.
- Do not invent implemented behavior.
- Clearly distinguish IMPLEMENTED, PARTIAL, DOCUMENTED_INTENT, PLANNED, DEPRECATED, UNKNOWN, NEEDS_VERIFICATION, and NEEDS_USER_DECISION.

SOURCE BASELINE:
Use the post-Slice-2 repo ZIP as the immutable baseline for this slice.
Preserve prior Slice 1 and Slice 2 commits.

MANDATORY SKILL USAGE:
Before editing, inspect `.codex/skills/`.
Use any suitable repo-local skills as evidence workflow aids.
Record which skills were used or why no general documentation reconciliation skill existed.

TEST / VERIFICATION CONSTRAINTS:
- Do not run auth tests.
- Do not run full `npm test`, because it includes auth tests.
- Do not rerun `npm run task-docs:check`; it timed out twice in Slice 2 and must be noted as skipped unless inspected/fixed first.
- Prefer safe non-auth tests and static checks only.

SLICE 3 GOAL:
Complete the vision/specification documentation set under `docs/vision_and_implementation/`.

CREATE OR UPDATE:
- `docs/vision_and_implementation/TARGET_ARCHITECTURE_SPEC.md`
- `docs/vision_and_implementation/PIPELINE_AND_WORKERS_SPEC.md`
- `docs/vision_and_implementation/AUTH_AND_2FA_SPEC.md`
- `docs/vision_and_implementation/SCHEDULER_AND_RUNTIME_RECOVERY_SPEC.md`
- `docs/vision_and_implementation/README.md`
- `docs/vision_and_implementation/DOCUMENTATION_AUTHORITY_MAP.md`
- `docs/vision_and_implementation/UNRESOLVED_QUESTIONS.md`
- `docs/vision_and_implementation/DEPRECATED_SUPERSEDED_DOCS_LOG.md`
- `docs/vision_and_implementation/reconciliation/FINAL_VISION_SPEC_RECONCILIATION_REPORT.md`
- `docs/active_workflow_docs/vision_slice3_prompt_analysis_critique_refinement.md`

COVER:
- Target architecture boundaries.
- Frontend/dashboard role.
- Backend API role.
- Database role.
- Worker role.
- Runtime truth model.
- Lock files as active-instance truth.
- Logs as evidence/history/debug trail.
- `conf/runtime-truth.json` as current bridge / not final worker truth unless later decided.
- Stage pipeline: download, index, parse GPS, geocode, queue slideshow, playback select-current.
- Worker model: regular stage worker, playback worker, screen on/off worker.
- Authentication provider boundary and 2FA states.
- Scheduler/cron/cron-emulator expectations.
- Windows development, Fedora scheduler work, Raspberry Pi target runtime.
- Recovery after outage/restart.
- Documentation authority after the 3-slice workflow.

VERSIONING:
If the repo has VERSION/package/changelog policy, bump the patch version and update all relevant version metadata.
Every new changelog entry must include an Estonian timestamp with date and time.

COMMIT:
Make exactly one logical Slice 3 commit with message:
`docs: complete vision and runtime specification set`

FINAL ARTIFACT:
Create a final ZIP containing the full repository with `.git` history and all three slice commits.

FINAL RESPONSE:
Return the ZIP link first, then summarize changed files, preservation, verification, commits, skills used, and targeted questions for the user about unresolved/ambiguous specification decisions.
```
