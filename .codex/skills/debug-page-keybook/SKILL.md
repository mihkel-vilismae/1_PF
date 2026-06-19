---
name: debug-page-keybook
description: Locate and verify PF_login Debug page panes, buttons, stable UI element IDs, connected frontend actions, state/model files, docs/OpenSpec/runbooks, tests, proof commands, reality levels, and non-claims. Use before implementing or analyzing Debug page changes, element IDs, elist/buttons list, asterisk marker behavior, Help/Stack panes, auth/session controls, snapshot controls, or Debug page proof coverage.
---

# Debug Page Keybook

## Purpose

Use this skill as the Debug page map. It prevents guessing where a Debug page element, action, document, test, or proof lives.

This skill is a lookup workflow, not the source of truth by itself. Prefer repo-local keybook and inventory files over memory.

## Read First

1. `docs/40_backlog_and_tasks/debug_page_keybook.md`
2. `docs/40_backlog_and_tasks/debug_page_keybook.json`
3. `docs/40_backlog_and_tasks/debug_page_goal_registry.md`
4. `docs/10_runbooks/debug_page_runbook.md`
5. `docs/20_architecture_and_specs/openspec/debug_page_openspec.md`
6. `dashboard/views/debugView.ts`
7. `dashboard/services/debugPageModel.ts`
8. `tests/debugPageRuntime.test.js`
9. `tests/debugPageDocs.test.js`
10. `tests/debugPageKeybook.test.js`

## Workflow

1. Identify the requested Debug page surface.
   - Page, pane, button, action, model helper, proof, doc, OpenSpec, or non-claim.
2. Look it up in `debug_page_keybook.json`.
3. Verify the referenced files still exist.
4. For UI elements, verify the current marker/action exists in `dashboard/views/debugView.ts` or the model file.
5. Classify the reality level.
   - `real-ui/browser-local-safe`
   - `browser-local/planned-safe`
   - `mock-only`
   - `real-provider/runtime`
   - `planned/future`
6. State non-claims explicitly.
7. Run or reference `npm run proof:debug-page-keybook` when the keybook or Debug page structure changes.

## Project Rules

- Do not infer real backend, provider, crontab, worker, database, media, Raspberry, or recovery behavior from a Debug UI element alone.
- Keep stable IDs globally unique across PhotoFrame when `data-ui-element-id` is introduced.
- The keybook may seed intended element IDs before the HTML attribute exists, but must record whether the ID is implemented or planned.
- Use `*` as the intended Debug/inspect corner marker for visible element ID lookup when implemented.
- Clicking the marker must not trigger the underlying element action.
- Prefer adding/updating the repo-local JSON/Markdown keybook rather than storing detailed element facts in ChatGPT memory.

## Output Format

When answering Debug page location questions, include:

- Element or action name
- Stable ID, if known
- UI source file
- model/state file, if any
- docs/OpenSpec/runbook
- tests/proof command
- reality level
- non-claim
- confidence and missing links

## v0.8.200 Runtime ID Update

The Debug page now renders Help, Stack/Status, Elements/Buttons list, and Auth/Session planning panes before the legacy controls. Implemented entries should have `implemented_id: true` in `debug_page_keybook.json` and a corresponding stable `data-ui-element-id` in `dashboard/views/debugView.ts`. The `*` marker is a runtime inspect affordance: hover shows the ID tooltip, click opens a local metadata modal, and marker clicks must call `event.stopPropagation()` so underlying actions are not triggered.
