# Debug Page Runtime Keybook UI — 3+2 XACR Research Handoff

Date: 2026-06-19
Baseline: v0.8.199, HEAD `ed8db7f`
Target version: v0.8.200

## Purpose

Analyze and implement the Debug page as a proof-safe operator/developer surface where every major pane/card and button has a stable unique PhotoFrame UI element ID, and where the repo-local Debug Page Keybook is visible in the runtime UI.

## Multipass XACR pass 1 — page shape

| XACR step | Finding |
|---|---|
| Examine | The Debug page already renders state, playback, media, crontab, scheduler mock, and worker panes. |
| Assess | It lacked Help, Stack/Status, a visible element/button list, and Debug-page Auth/Session planning surface. |
| Critique | Without top-level Help/Stack sections, operator context appears after controls and can be misunderstood. |
| Refine | Render Help, Stack/Status, Elements/Buttons list, and Auth/Session before legacy controls. |

## Multipass XACR pass 2 — element inventory

| XACR step | Finding |
|---|---|
| Examine | v0.8.199 had a repo-local keybook, but many IDs were seeded/planned rather than present in rendered HTML. |
| Assess | The runtime page needs stable `data-ui-element-id` attributes for proof-friendly targeting. |
| Critique | Feature-specific markers like `data-debug-action` are useful, but they are not a global PhotoFrame ID system. |
| Refine | Add global `data-ui-element-id` attributes and render a keybook-backed Elements/Buttons list. |

## Multipass XACR pass 3 — inspect marker behavior

| XACR step | Finding |
|---|---|
| Examine | User requested a visible asterisk marker in element corners/views. |
| Assess | A `*` marker is useful if it is non-disruptive and separated from the underlying button/pane behavior. |
| Critique | Markers must not trigger the underlying action or mutate production state. |
| Refine | Hover shows stable ID through `title`; click opens a local metadata dialog and calls `event.stopPropagation()`. |

## +1 implementation decision

Implemented the runtime Debug page UI shell for these items while preserving proof-honesty boundaries:

- Help pane
- Stack / Status pane
- Elements / Buttons list pane
- Auth / Session planned-safe pane
- Stable `data-ui-element-id` attributes for panes/buttons
- `*` inspect markers for panes/buttons
- Local metadata modal for selected element ID
- Keybook JSON/Markdown updated from seed to runtime IDs

## +2 verification decision

Validation should prove source/docs/test consistency, not real backend/provider/hardware behavior. Real auth/session provider controls remain disabled/planned-safe in this slice.

## Debug page divs / major rendered panes after this slice

| Order | Element ID | Heading | Marker |
|---:|---|---|---|
| 1 | `pf.debug.page` | Debug Menu | `data-debug-page-route="/debug"` |
| 2 | `pf.debug.help.pane` | Help | `data-debug-pane="help"` |
| 3 | `pf.debug.stack_status.pane` | Stack / Status | `data-debug-pane="stack-status"` |
| 4 | `pf.debug.elements_list.pane` | Elements / Buttons list | `data-debug-pane="elements-list"` |
| 5 | `pf.debug.auth_session.pane` | Auth / Session | `data-debug-pane="auth-session"` |
| 6 | `pf.debug.state.pane` | Store and restore state | `data-debug-pane="state"` |
| 7 | `pf.debug.playback_test.pane` | Test playback | `data-debug-pane="test-playback"` |
| 8 | `pf.debug.media_test.pane` | Add images / process testing | `data-debug-pane="add-images"` |
| 9 | `pf.debug.crontab.pane` | Crontab Setup | `data-debug-pane="crontab"` |
| 10 | `pf.debug.scheduler_host_mock.pane` | Scheduler Host Mock Status | `data-debug-pane="scheduler-host-mock"` |
| 11 | `pf.debug.worker_regular.pane` | Regular Worker Debug Pane | `data-debug-worker-pane="regular"` |
| 12 | `pf.debug.worker_playback.pane` | Playback Worker Debug Pane | `data-debug-worker-pane="playback"` |
| 13 | `pf.debug.worker_screen.pane` | On/off Worker Debug Pane | `data-debug-worker-pane="screen"` |

## Non-claims

This slice does not prove or perform real iCloud login, provider session inspection, crontab mutation, worker spawning, production media/database mutation, native playback, Raspberry display, address overlay, or recovery/power-loss behavior.
