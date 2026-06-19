# Debug Page World-Class OpenSpec

Status: planning contract / world-class UI track.
Introduced: v0.8.201.
Baseline: v0.8.200 Debug page keybook runtime UI.
Related keybook: `docs/40_backlog_and_tasks/debug_page_keybook.json`.
Related plan: `docs/40_backlog_and_tasks/debug_page_world_class_sliceplan.md`.

## 1. Goal

Bring the Debug page to an honest **OpenSpec 85%+** and **implementation 85%+** level without claiming real auth/provider/crontab/worker/database/media/Raspberry/recovery behavior before those behaviors are separately implemented and proven.

The world-class target means the Debug page is not merely present. It must be understandable, visually polished, operator-safe, proof-friendly, and behavior-explicit.

## 2. Required top-right visual toolbar

Next to the existing version display, the Debug page must include a visual toolbar with visible label:

```text
TOGGLE VISUALS
```

The toolbar must expose two proofable controls:

```text
CLICK TO CHANGE COLOR SCHEMA [1,2,3]
CLICK TO IMPROVE LOOK BY MAKING MAJOR VISUAL CHANGES [1,2,3]
```

The implementation may use shorter visible labels if the full strings remain available as accessible labels, titles, or proof text, but the proof contract must be able to find the exact required phrases.

## 3. Visual schemas

The Debug page must define three color schemas:

1. Calm/default proof-safe schema.
2. High-contrast operator schema.
3. Dense/technical evidence schema.

The selected schema must be visible in the DOM through a stable marker such as `data-debug-color-schema="1"`.

## 4. Major visual modes

The Debug page must define three major visual-change modes:

1. Normal stacked cards.
2. Enhanced hierarchy cards with stronger grouping and status ribbons.
3. Dense evidence mode optimized for proof inspection.

The selected mode must be visible in the DOM through a stable marker such as `data-debug-visual-mode="1"`.

## 5. Behavior definition rule

Every Debug page button and major pane must have one explicit behavior status:

- `browser-local`
- `mock-only`
- `disabled-planned-safe`
- `blocked-needs-contract`
- `real-provider-runtime`
- `real-device-runtime`

If behavior is not implemented yet, the UI must say so. A disabled/planned-safe button is acceptable if the docs and proofs say exactly why it is not active.

## 6. Proof input panel

The Debug page must include a proof input/output section that explains:

- what proofrunner command or artifact is needed;
- what operator file/ZIP should be uploaded;
- what proof input must never include, especially passwords, cookies, tokens, raw `.env` values, Apple IDs, exact GPS/address data unless explicitly approved;
- how PASS/BLOCKED/FAILED should be interpreted.

## 7. Element inventory and keybook contract

The Debug page must preserve the v0.8.200 keybook behavior:

- stable `data-ui-element-id` attributes;
- visible Elements / Buttons list;
- `*` inspector marker;
- hover tooltip with stable ID;
- click-to-open metadata modal;
- non-disruptive marker click handling.

## 8. 85% scoring rubric

OpenSpec 85%+ requires:

- top-right visual toolbar specified;
- 3 color schemas specified;
- 3 major visual modes specified;
- behavior status taxonomy specified;
- proof input/output panel specified;
- non-claims specified;
- keybook/element inventory contract referenced.

Implementation 85%+ requires:

- toolbar rendered;
- both visual controls wired to browser-local state;
- three schemas and three visual modes visible in DOM and UI;
- button/pane behavior registry rendered;
- proof input panel rendered;
- keybook-render proof updated;
- docs/OpenSpec/keybook/proof docs aligned.

## 9. Non-claims

This OpenSpec does not prove real iCloud login, provider session use, real crontab mutation, worker spawning, production database/media mutation, native playback, Raspberry display behavior, address overlay behavior, or recovery after power loss.
