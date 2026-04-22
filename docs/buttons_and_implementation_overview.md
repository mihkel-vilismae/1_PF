# Buttons and Implementation Overview

## Status and intended authority

This document is a **fairly authoritative, evidence-first working reference** for:

- dashboard button behavior
- inspect-mode attachments
- real vs mock classification
- backend-status classification
- value/source explanation coverage
- known wording vs implementation conflicts

It is intentionally narrower than the broader architecture docs and more implementation-specific than the general audit docs.

High-level authority note:

- `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md` is the top-level authoritative behavior/intention document.
- This file is a lower-level implementation/evidence map and must not override that authoritative spec.

Use it together with:

- `docs/VOICE_AI_AUTHORITATIVE_SPEC_MERGED_2026-04-22.md`
- `docs/IMPLEMENTATION_STATUS_AUDIT.md`
- `README.md` documentation reading order
- the inspect metadata files under `dashboard/inspect/`
- the rendered view files under `dashboard/views/`

## Update rule for future changes

This file is meant to be **updated incrementally** as the user reviews items and the repo changes.

When a related behavior changes:

1. **keep the previous statement in place**
2. **strike through the outdated text** instead of deleting it
3. add the new statement directly below it
4. include the date and the code evidence if practical

Example pattern:

- ~~B3.3 is still mock-only in inspect metadata.~~
- **2026-04-22 update:** B3.3 now points at a real backend route in both rendered copy and inspect metadata (`dashboard/views/testView.js`, `dashboard/inspect/backendStatusMetadata.js`).

This preserves decision history without losing implementation context.

---

## Scope of this document

This document is based on the repository snapshot used in this chat and focuses on the following views and inspect modes:

### Views covered

- **A — Init**
- **B — Test**
- **C — Last Run Info**
- **D — Running Process**

### Inspect modes covered

- **Show real vs mock**
- **Show backend status**
- **Explain values**

This document does **not** attempt to fully restate unrelated architecture plans, old product intent, or future target-state behavior unless needed to explain a mismatch.

---

## Primary evidence basis

Primary files inspected for this mapping:

- `dashboard/app.js`
- `dashboard/views/initView.js`
- `dashboard/views/testView.js`
- `dashboard/views/lastRunView.js`
- `dashboard/views/runningProcessView.js`
- `dashboard/inspect/bindInspectModes.js`
- `dashboard/inspect/controlMetadata.js`
- `dashboard/inspect/realityMetadata.js`
- `dashboard/inspect/backendStatusMetadata.js`
- `dashboard/inspect/guideCopy.js`
- `dashboard/inspect/guideCopy.json`
- `dashboard/inspect/guideUtils.js`
- `dashboard/services/renderers.js`
- `dashboard/shared/constants.js`
- `dashboard/services/runtimeTruth/runtimeTruthState.js`
- `conf/runtime-truth.json`

Secondary evidence used only where needed for value resolution or wording context.

---

## Repo-grounded overview

### How inspect attachment works

The inspect system is selector-driven and split across three main metadata paths:

- **Explain values** → `dashboard/inspect/controlMetadata.js`
- **Show real vs mock** → `dashboard/inspect/realityMetadata.js`
- **Show backend status** → `dashboard/inspect/backendStatusMetadata.js`

The binding layer lives in:

- `dashboard/inspect/bindInspectModes.js`

The rendered UI surfaces come from the view files and shared render helpers.

### High-level implementation truth from this snapshot

- **View A** has strong real backend wiring for its init actions.
- **View B** is mixed: some actions are real, some are still mock or metadata-inconsistent.
- **View C** is still mock/placeholder driven.
- **View D** is still a frontend runtime preview rather than a real runtime view.

### Strongest metadata coverage

The strongest intentional inspect coverage appears on:

- action buttons
- status badges
- result surfaces
- notices
- hero pills
- worker rows
- log entries
- explicit definition rows in D2/D3

### Weakest metadata coverage

The weakest or most generic coverage appears on:

- B4 definition rows
- B5 displayed values
- some section-level badges that conflict with action-level truth
- surfaces where generic fallback logic is used instead of a dedicated metadata branch

---

## Cross-view implementation findings

### 1. Selector-level truth is more reliable than marketing-style wording

The inspect metadata frequently gives a more accurate implementation reading than the surrounding product-like view copy.

This is especially important in:

- View B
- View D

### 2. Section-level truth and action-level truth can disagree

A card can contain:

- a **real** action button
- but a **mock** or **missing** section badge

That means developers should not treat section badges as the sole source of truth when deciding implementation state.

### 3. Some values have strong provenance; others fall back to generic rendered-state explanations

This is most visible in:

- B4 definition rows
- B5 value rows

The action may be explicitly classified, while the displayed value remains only weakly explained.

---

## View A — Init

### Current implementation position

View A is the cleanest of the four views covered here.

Its inspect metadata and rendered intent are mostly aligned:

- section status badges are real-backed
- action buttons are real-backed
- backend-status labels are real-backed
- result surfaces are treated as real backend result panels

### Important covered element families

- hero pills
- A-card status badges
- action buttons such as verify env / database actions / scheduler actions
- result surfaces
- log entries

### Representative examples

#### A / hero pill / backend contract wired

- **Show real vs mock label:** `Real: Backend contract wired`
- **Show backend status label:** `Real: Backend contract wired`

Meaning: this hero wording is explicitly treated as live backend-backed wording.

#### A / 1A / Run button (`verify-env`)

- **Show real vs mock label:** `Real: Run`
- **Show real vs mock description:** `Calls the live /api/init/verify-env backend endpoint.`
- **Show backend status label:** `Real: Run`

#### A / 2A / database buttons

Buttons such as:

- check DB
- inspect DB
- delete DB
- recreate DB

are all classified as real backend actions.

#### A / 3A / scheduler buttons

Buttons such as:

- install scheduler
- check scheduler
- print scheduler

are all classified as real backend actions in this snapshot.

### View A count summary from this chat

- Explain values: approximately **7** explicit initial-render attachments
- Show real vs mock: approximately **14**
- Show backend status: approximately **14**
- fallback-only attachments surfaced in the analysis: **0**

### View A practical takeaway

If a developer wants the safest reference point for how inspect metadata is supposed to look when it is well-formed, View A is the best example in this snapshot.

---

## View B — Test

### Current implementation position

View B is the most conflict-heavy view in this snapshot.

It contains all of the following at once:

- real action-level metadata for some buttons
- mock or missing section-level classifications on the same cards
- rendered product wording that sometimes claims real backend behavior
- inspect metadata that still marks the same stage as mock or missing

### Practical reading rule for View B

When View B is inconsistent, trust order should be:

1. action-specific metadata branch
2. route-level implementation evidence
3. section-level metadata
4. broad view copy / hero wording

### B1

B1 is consistently treated as mock / missing.

Representative values:

- **Show real vs mock:** `Mock: Run`
- **Show backend status:** `Missing: Run`

### B2

B2 is a good example of section-level vs action-level contradiction.

#### What conflicts

- section badge says mock/missing
- button metadata says real
- log metadata for the action also says real

#### Representative values

- **Status badge / real vs mock:** `Mock: B2 status badge`
- **Status badge / backend status:** `Missing: B2 status badge`
- **Run button / real vs mock:** `Real: Run`
- **Run button / backend status:** `Real: Run`

### B3 overall

The B3 umbrella area is broadly classified mock/missing at section level, even though several individual stages inside it have real action metadata.

#### B3.1

Conflict pattern:

- section/status surface reads mock
- button metadata reads real

#### B3.2

Same conflict pattern as B3.1.

#### B3.3

This is one of the strongest conflicts in the snapshot.

- rendered copy says it calls `POST /api/runtime/gps/run`
- inspect reality metadata says mock
- inspect backend-status metadata says missing

Representative values:

- **Show real vs mock:** `Mock: Run`
- **Show backend status:** `Missing: Run`

#### B3.4

Same pattern as B3.3.

- rendered copy claims real geocode route wiring
- inspect metadata still says mock/missing

#### B3.5

B3.5 is action-level real.

### B4

B4 is mixed in a very specific way:

- the **Run** action is real-backed
- the **preview surface itself** is mock / missing
- several displayed values use weaker fallback provenance

Representative values:

- **Preview frame / real vs mock:** `Mock: Playback preview surface`
- **Preview frame / backend status:** `Missing: Playback preview surface`
- **Run button / backend status:** `Real: Run`

### B5

B5 shows a metadata coverage gap.

What exists:

- backend-status metadata for some displayed values
- mock log classification

What is weak or missing:

- no strong explicit reality branch for some displayed values
- some controls are not attached by the requested modes at all

Representative issue:

- **Current screen state row / Show backend status:** mock
- **Current screen state row / Show real vs mock:** falls back to unknown

### View B count summary from this chat

- Explain values: approximately **10** explicitly surfaced rows, with more repeated similar rows available
- Show real vs mock: approximately **16**
- Show backend status: approximately **18**
- fallback-only attachments: visibly present in **B4** and **B5**

### View B practical takeaway

View B should be treated as the main cleanup target for future metadata alignment work.

It already contains useful implementation progress, but the card-level story is not yet coherent.

---

## View C — Last Run Info

### Current implementation position

View C is still clearly placeholder/mock-oriented in this snapshot.

Its initial render is sparse because the underlying `lastRunData` is empty.

### Strong implementation truth

- notice surface is mock
- resume action is placeholder/missing
- log entries are mock/missing

### Important limitation

The C1-C4 cards are visible shells, but the initial snapshot does not populate their definition rows.

That means there is little per-value inspect coverage until demo state is seeded later.

### Representative values

#### No-run notice

- **Explain values:** `Last-run notice: Mock state: no saved run is available.`
- **Show real vs mock:** `Mock: Mock state: no saved run is available.`
- **Show backend status:** `Mock: Mock state: no saved run is available.`

#### Resume button

- **Show real vs mock:** `Mock: Resume from saved state (placeholder)`
- **Show backend status:** `Missing: Resume from saved state (placeholder)`

### View C count summary from this chat

- Explain values: approximately **3** visible initial-render attachments
- Show real vs mock: approximately **3**
- Show backend status: approximately **3**
- fallback-only attachments: **0** in the surfaced rows

### View C practical takeaway

View C is not currently misleading in the same way View B is; it is mostly honest about being placeholder-oriented.

---

## View D — Running Process

### Current implementation position

View D is one of the clearest wording-vs-implementation mismatch zones in the repository.

The shared navigation copy says:

- `Live view of the real runtime only.`

But the view renderer and inspect metadata say the opposite:

- it is a frontend-only runtime preview
- the start action is simulated
- worker rows are mock/missing
- notice surfaces exist because real runtime support is not implemented here yet

### Strong implementation truth

- D is preview/mock-oriented in this snapshot
- worker and playback/screen details are inspectable, but they describe simulated state
- D2 and D3 have stronger value-source coverage than B4/B5 because they have explicit mapping branches

### Representative values

#### Hero pill / preview inactive

- **Show real vs mock:** `Mock: Preview inactive`
- **Show backend status:** `Missing: Preview inactive`

#### Start runtime preview button

- **Show real vs mock:** `Mock: Start simulated runtime preview`
- **Show backend status:** `Missing: Start simulated runtime preview`

#### Worker rows

Worker rows such as Download are treated as:

- mock in reality mode
- missing in backend-status mode

#### D2 / Playback worker values

These rows have explicit value-source mapping and clear mock/missing classification.

#### D3 / Screen worker values

These rows also have explicit value-source mapping and clear mock/missing classification.

### View D count summary from this chat

- Explain values: approximately **15** in initial render if worker subvalues are counted
- Show real vs mock: approximately **11**
- Show backend status: approximately **11**
- fallback-only attachments: **0** in the surfaced D2/D3 rows

### View D practical takeaway

View D has decent inspect coverage, but its high-level wording should not be trusted until the shared constants and implementation story are reconciled.

---

## Most important conflicts to revisit later

### Conflict 1 — View D navigation wording

`dashboard/shared/constants.js` describes View D as:

- `Live view of the real runtime only.`

But implementation evidence across the view and inspect metadata says it is still a frontend preview.

### Conflict 2 — View B navigation wording

View B shared copy describes the view as simulation/validation only, yet several actions are already wired as real backend actions.

### Conflict 3 — B3.3 and B3.4 route wording vs inspect truth

Rendered stage text claims live backend routing.

Inspect metadata still says:

- mock in reality mode
- missing in backend-status mode

### Conflict 4 — section-level badges vs action-level truth in B2/B3/B4

Some cards show:

- mock or missing at the card/status-badge level
- real at the button/action level

This is a strong signal that metadata normalization is needed.

### Conflict 5 — weak value provenance in B4/B5

Some displayed values are only explained through generic rendered-state fallback logic rather than dedicated source metadata.

---

## Suggested future update workflow for this document

When you review an item in the repo, update the relevant section in this file using this pattern:

### Step 1

Find the exact subsection here for the affected view/card.

### Step 2

Strike through the outdated statement.

### Step 3

Add a dated replacement directly under it.

### Step 4

If the change resolves a conflict, also update the `Most important conflicts to revisit later` section.

### Step 5

If the change materially alters documentation authority, also update:

- `README.md`
- `docs/IMPLEMENTATION_STATUS_AUDIT.md`

---

## Current developer-useful conclusions

1. **View A** is the best reference for healthy inspect metadata wiring.
2. **View B** is the highest-priority cleanup area because implementation and metadata diverge in multiple places.
3. **View C** is mostly honest placeholder UI and is less dangerous than B.
4. **View D** has good low-level inspect coverage but misleading high-level wording.
5. If a developer wants to understand actual button truth, **action metadata is more trustworthy than broad card copy** in this snapshot.

---

## Short maintenance note

This file should remain **evidence-first**.

Do not replace code-grounded statements with broader wish-state phrasing.

If implementation changes later, preserve prior text with strikethrough and add the new code-grounded truth below it.
