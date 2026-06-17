# Debug Page Documentation 2ACR Review

Status: second-pass documentation review.  
Version introduced: 0.8.132.  
Scope: review of the Debug Page OpenSpec, runbook, and goal registry generated from chat-derived requirements.

## Pass 1 — Analyze

The documentation set now covers the requested Debug page planning surface:

- lightweight Debug route concept;
- bottom/sidebar **Debug** entry;
- sidebar version tracker near Debug;
- global top-right version tracker preservation;
- shared stacked pane template;
- Store and restore state pane;
- Test playback pane with left controls and right preview/player area;
- Add images process-test pane with one plus/add-images entry point;
- test data/database isolation requirement;
- Crontab Setup pane;
- crontab read, pause/resume, and install flows;
- under-10-second interval double confirmation;
- Regular Worker, Playback Worker, and On/off Worker debug panes;
- first called, last called, and called count telemetry;
- Estonian timestamp display requirement;
- Manual **Run now** worker actions;
- proof and non-claim boundaries;
- Debug Page Goal Registry for regular goal intake.

## Pass 1 — Criticize

The docs intentionally stay ahead of implementation, so the primary risks are false proof claims and unsafe scheduler mutation.

Remaining implementation unknowns:

- actual route/component file names;
- exact sidebar component and version source;
- exact state save/restore semantics;
- whether Test playback controls test playback, native playback, or both;
- exact image file types, storage, and cleanup;
- concrete test database isolation mechanism;
- exact crontab marker if a project convention already exists;
- exact worker command names/paths;
- concurrency behavior for manual worker runs.

Safety risks:

- editing unrelated crontab entries;
- installing overly aggressive intervals;
- confusing manual worker calls with crontab calls;
- treating static UI scaffolding as proof;
- mixing test media/database state with production state;
- hard-coding a stale version value.

## Pass 1 — Refine

The docs correctly mark unresolved runtime behavior as planned/TODO and keep real Raspberry crontab proof as a non-claim.

Implementation should proceed in proof-gated slices:

1. Docs/static coverage only.
2. Route/sidebar/visual scaffolding.
3. Version tracker reuse.
4. Static pane rendering.
5. Mock/test telemetry display.
6. Fake-crontab parser/preview.
7. Fake-crontab pause/resume/install safety tests.
8. Manual worker run mock path.
9. Real Raspberry crontab proof gate.

## Pass 2 — Analyze

The OpenSpec/runbook/goal registry split is appropriate:

- OpenSpec defines contracts and proof boundaries.
- Runbook explains operator use and safety behavior.
- Goal registry records new implementation goals without treating chat notes as proof.
- This 2ACR review records risks and recommended slice order.

## Pass 2 — Criticize

The documentation is thorough, but future implementation must avoid architecture drift:

- Do not bypass existing runtime services or scheduler abstractions.
- Do not add direct component-to-component shortcuts for debug actions.
- Do not write to real crontab before fake-crontab tests exist.
- Do not mutate production DB/media in the add-images test path.
- Do not add version display logic that diverges from existing version source.
- Do not claim Raspberry behavior from local Windows/Linux proof.

## Pass 2 — Refine

The final documentation stage is acceptable when docs coverage tests prove the required files and key contract terms exist.

Acceptance for this documentation-only slice:

- `debug_page_openspec.md` exists and contains navigation, version tracker, pane, crontab, worker, proof, and non-claim contracts.
- `debug_page_runbook.md` exists and explains operator/developer use.
- `debug_page_goal_registry.md` exists and contains stable `DBG-GOAL-*` rows.
- Navigation files link the new docs.
- Tests cover required sections and proof-honesty language.

Non-claims after this slice:

- no Debug page route implemented;
- no sidebar item implemented;
- no runtime Debug pane implemented;
- no crontab mutation implemented;
- no worker telemetry implemented;
- no Raspberry proof generated.
