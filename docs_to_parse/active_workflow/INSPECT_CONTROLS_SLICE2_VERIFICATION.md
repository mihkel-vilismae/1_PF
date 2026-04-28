# Inspect Controls Slice 2 Verification

Updated: 2026-04-26 23:41 Europe/Tallinn.

## Scope

Slice 2 restores immediate, page-aware feedback for the dashboard inspect controls while preserving the existing hover/focus metadata architecture.

## Manual verification matrix

| View | Explain controls | Explain values | Show real vs mock | Show/Hide backend status |
| --- | --- | --- | --- | --- |
| A — Init | Summary panel appears; controls highlight; hover/focus shows control metadata. | Summary panel appears; values highlight; hover/focus shows value-source metadata. | Summary panel appears; real/mock/mixed/unknown highlighting remains honest. | Summary panel appears; button label toggles; backend status classes/tooltips show real/missing/mock/unknown without fake live results. |
| B — Test | Same expected behavior for test and simulation controls. | Same expected behavior for pipeline/playback/simulation values. | Mixed backend/mock sections remain distinguishable. | Real runtime endpoints and frontend-only simulation remain distinguishable. |
| C — Last Run Info | Demo/recovery controls remain explained. | Recovery preview values remain sourced to demo state. | View remains mock/recovery-preview only. | Runtime/recovery backend support remains marked missing/mock where appropriate. |
| D — Running Process | Preview controls remain explained. | Worker/lock/preview values remain sourced to preview state. | View remains preview-only until real runtime telemetry exists. | Live runtime backend support remains missing unless wired later. |
| E — Database Viewer | Verify/connect/catalog/table/pagination/logging controls remain explained. | Verification/catalog/row/logging values expose backend state sources. | View remains backend-backed within repo-local DB viewer scope. | View E routes remain real within documented backend scope. |

## Automated verification added

- `tests/inspectModeSummary.test.js` verifies summary visibility, A-E page-aware rendering, exclusive active-mode detection, and honest backend fallback wording.

## Preserved behavior

- Existing `bindInspectModes.js` hover/focus binding remains the central inspect mechanism.
- Existing metadata files remain the source of truth for element-level explanations.
- Existing topbar button actions remain unchanged.
- Existing real/mock/backend-status state names are preserved.
