# PF_login / 1234_PF — Main Issues and Improvement Guide

Estonian timestamp: 2026-05-28 20:47 EEST

Latest review timestamp: 30.05.2026, 21:12 EEST

## Scope and authority

This guide records a high-level, decision-grade analysis of recent project-chat themes, the current v0.7.32 provider-enabled baseline, and current project-goal documentation. It is documentation only: no runtime behavior, backend routes, frontend rendering, Test Mode behavior, Real Mode behavior, worker logic, database schema, or scripts are changed by this guide.

Use this document as a planning guide for later slice prompts. Treat code, tests, generated evidence packs, and runtime artifacts as stronger evidence than this guide when they disagree. Previous chat messages are used as context and leads; repo-backed statements are called out when the current v0.7.32 baseline already provides supporting evidence.

## Executive summary

The project is in a usable but still fragile transition state. The strongest implemented area is the deterministic Test Mode media pipeline and its dashboard wiring. The main remaining work is not one single missing file; it is a set of boundaries that must be made clearer before the project can safely move from deterministic/test-ready behavior toward production-ready behavior.

The top issues are:

| # | Issue | Category | Current severity | Short guidance |
|---:|---|---|---|---|
| 1 | Real-provider gaps in the five regular worker stages | Architecture / pipeline | High | Keep deterministic behavior; add provider boundaries and PC/runtime proof before claiming production readiness. |
| 2 | Test Mode vs Real Mode must remain strictly separated | Safety / runtime | High | Keep one `.env` source and use explicit Test Mode projection; never let mock paths silently overlap real paths. |
| 3 | Real geocoding is still placeholder-only | Core functionality | High | Add a real geocoder adapter later, but keep deterministic placeholder as the Test Mode default. |
| 4 | Real iCloudPD download is gated but not fully proven as Stage 1 input | Core functionality | Medium/High | Run a documented PC/runtime proof from real download through Queue before expanding behavior. |
| 5 | GPS parser breadth is limited compared with real media libraries | Core functionality | Medium | Design parser/fallback providers before adding many ad-hoc parsing branches. |
| 6 | UI live updates can interfere with inspection, focus, and scroll state | UI / operability | Medium | Preserve pause-live-updates behavior and continue treating re-render stability as a regression-sensitive area. |
| 7 | View B activity detection and fullscreen playback reuse need careful boundaries | UI / hardware integration | Medium | Reuse the proven detection source model without coupling fullscreen playback to View B UI internals. |
| 8 | Documentation can overclaim or drift from code | Documentation / process | Medium | Keep status tables evidence-backed and separate docs claims from runtime-verified facts. |
| 9 | Baseline safety must be enforced before every implementation run | Workflow / regression control | High | Stop when the newest active baseline ZIP is missing; never silently work on an older repo. |
| 10 | Queue terminology and queue-policy scope must stay clear | Documentation / product policy | Low/Medium | Use “Queue” only; do not expand queue policy without a separate design and tests. |

## Evidence and context map

| Evidence type | What was used | Authority level |
|---|---|---|
| Chat-observed issues | User reports about scrolling, focus loss, inspect-element refreshes, `.env` / `test.env`, baseline confusion, workflow expectations, and stage terminology. | Useful context, not proof by itself. |
| Repo-verified issues | v0.7.15 version metadata, media pipeline docs, worker route/test structure, single-env Test Mode documentation, and prior Goal 4 status docs. | Stronger than chat where inspected. |
| Documentation/status issues | Existing media pipeline implementation-status docs, Goal 4 snapshots, changelog, and current-truth docs. | Useful, but must be checked against code/tests for future implementation claims. |
| User-observed UI/runtime bugs | Focus loss, nested payload scroll reset, DevTools inspect instability, and live update interference. | High practical value; still needs browser/runtime verification after fixes. |
| Future improvement ideas | Provider boundaries, real geocoding, richer GPS parsing, queue policy, PC/runtime assessment columns. | Planning input; not proof of current implementation. |

## Main issue matrix

| Issue | Category | Evidence/source | Why it matters | Likely root cause | Severity | Dependencies | High-level solution | Preserve | Verify |
|---|---|---|---|---|---|---|---|---|---|
| Deterministic pipeline can look production-ready | Pipeline / product truth | Goal 4 docs and prior repo-backed worker analysis | Operators may trust mock/placeholder behavior as real behavior. | Worker shells are implemented before all real providers are ready. | High | Provider design; PC/runtime tests | Label each stage by real maturity and add provider boundaries before production claims. | Existing deterministic tests and Test Mode flow. | Stage-by-stage PC/runtime report. |
| Real geocoding missing | Core functionality | Geocode stage uses deterministic placeholder in prior analysis. | Resolved addresses are not true reverse-geocoded addresses. | Placeholder was intentionally used for deterministic pipeline progress. | High | Provider config, rate limits, cache policy | Add geocoder adapter with placeholder default and real provider gated by Real Mode/config. | Placeholder Test Mode behavior. | Known-coordinate real-provider tests and failure tests. |
| Real download needs full pipeline proof | Core functionality | Real download route/auth boundary exists, but full real run remains a runtime concern. | Real files may expose indexing/GPS/queue gaps that fixtures do not. | Auth provider and deterministic pipeline were implemented separately. | Medium/High | iCloudPD session, real media source, PC run | Create a documented real-download-through-Queue verification run. | Auth gating and no-secret logging. | Manual PC run plus DB/status evidence. |
| GPS parser may be too narrow | Core functionality | EXIF fixture success does not prove all iCloud/phone/video cases. | Real media often uses HEIC, video metadata, sidecars, or variant encodings. | Single parser path is enough for current deterministic tests. | Medium | Real media fixtures | Design metadata parser providers/fallbacks before broadening. | Existing EXIF parser behavior. | Fixture matrix and real media samples. |
| Queue policy is simple and strict | Product policy | Queue stage inserts eligible geocoded media and skips others. | Future UX may require prioritization, retention, unresolved-media handling, or requeue rules. | Current queue is a preparer, not a full playback policy engine. | Low/Medium | Product decisions | Keep strict eligibility until queue policy is designed separately. | Existing idempotent queue behavior. | Queue policy tests if changed. |
| Test Mode and Real Mode can drift | Safety / environment | Single `.env` fix and `test.env` removal are recent. | Overlap or hidden env sources can corrupt real/test separation. | Multiple env sources and path projection were previously confusing. | High | Runtime mode env rules | Keep one `.env` file and make Test Mode projection explicit and test-covered. | Real DB and Test DB isolation. | Verify-env tests plus manual env review. |
| UI re-renders can break operator work | UI / operability | User reported Inspect Element refresh/focus/scroll issues; recent pause and scroll fixes exist. | Operators cannot inspect/copy/type reliably when background polling re-renders the root. | Polling and full-root rendering can reset DOM state. | Medium | Dashboard render architecture | Maintain pause-live-updates; preserve scroll/focus markers; avoid unnecessary full-root replacements. | Existing card actions and live updates when not paused. | Browser manual tests and targeted render tests. |
| View B detection reuse can become coupled | Architecture / UI | Goal 2 and Goal 3 split work. | Fullscreen wake behavior should reuse detection logic, not View B UI state. | Activity detection started as a View B test surface. | Medium | Adapter boundaries | Keep source adapters separate from UI cards and fullscreen consumers. | View B/B5 test behavior. | Mouse/keyboard/PIR source tests and fullscreen HUD checks. |
| Documentation can become stale | Documentation | Many status docs and compatibility pointers exist. | Users may follow old links or over-trust old status snapshots. | Fast slice-based development creates many dated docs. | Medium | Doc index and current-truth discipline | Add current-truth guides, update indexes, classify snapshots by authority, and keep claims evidence-backed. | Existing historical snapshots. | Doc-link checks and manual freshness review. |
| Baseline confusion creates regression risk | Workflow | User explicitly established no older-version work rule. | Work on older ZIPs can reintroduce fixed bugs. | Runtime/session may not contain latest baseline ZIP. | High | Uploaded active baseline | Always verify active baseline before analysis/implementation; stop if missing. | Immutable baseline workflow. | Version, Git HEAD, and package metadata before each run. |

## Detailed issue guide

### 1. Real-provider gaps in the five regular worker stages

The regular worker stages exist as a coherent deterministic pipeline: Download, Index, GPS parser, Geocode, and Queue. The issue is maturity, not absence. Some stages are already real DB/worker behavior, while others are intentionally deterministic or placeholder-only.

A good solution is to classify every stage by provider maturity: test-only, mock-only, deterministic placeholder, real but gated, real but not runtime-confirmed, or real and tested. Later implementation should add provider boundaries where the project needs production behavior, especially for geocoding and metadata parsing.

Do not replace working deterministic behavior too quickly. Test Mode needs stable, deterministic outputs so regressions are easy to detect.

### 2. Test Mode vs Real Mode separation

The project recently moved toward a single `.env` source with Test Mode-specific path projection instead of keeping a separate `test.env`. That is the correct direction because it reduces hidden configuration sources and makes overlap checks easier to reason about.

A good solution is to keep Test Mode as a safe projection from `.env`, not as a second environment universe. Verification should always check that real DB/media paths and test DB/media paths are separated before destructive or real-provider actions can run.

### 3. Geocode provider gap

Geocode is the clearest example of an implemented shell that is not production-ready. The stage can process GPS rows and write address-like output, but current behavior is deterministic placeholder address generation. That is valuable for tests but not equivalent to real reverse geocoding.

A good solution is to introduce a geocoder adapter model later:

| Adapter | Purpose |
|---|---|
| Deterministic placeholder geocoder | Test Mode default, stable tests. |
| Real reverse geocoder | Real Mode provider, gated by config. |
| Rate limiter | Prevent provider abuse and API failures. |
| Retry/backoff policy | Handle network/provider instability. |
| Cache policy | Control address cache freshness and provider metadata. |

### 4. Download provider and real iCloudPD proof

Download has both a deterministic route and a real iCloudPD/auth-gated route. The important remaining question is whether real iCloudPD output can reliably move through the regular pipeline on the user’s PC.

A good solution is not to rewrite Download first. The next safe step is a PC/runtime verification guide: run real auth, real download, Index, GPS parser, Geocode, and Queue, then record exact evidence and failures.

### 5. GPS parser breadth

The GPS parser now has a provider chain for EXIF plus local/offline fallback metadata sources: JSON sidecars, XMP sidecars, text sidecars, filename coordinate tokens, and path coordinate tokens. Real libraries can still contain HEIC, videos, corrupt files, missing GPS, or tool-specific metadata quirks.

A good solution is now to prove the existing fallback methods with real PC media and add future providers only when a concrete unsupported metadata source is observed. Avoid turning the parser into one large ad-hoc function.

### 6. UI stability: focus, scroll, and live updates

Recent user-observed issues showed that background updates and root re-renders can make the UI hard to use. The project has already moved toward scroll preservation and pause-live-updates behavior. This area should remain regression-sensitive.

A good solution is to treat operator interaction as state that must be preserved across live updates: focused inputs should not be recreated unnecessarily, scroll containers should have stable preservation keys, and DevTools inspection should be supported by a pause control.

### 7. View B activity detection and fullscreen reuse

View B/B5 activity detection is useful because it gives a controlled way to test PIR, mouse, and keyboard sources. Fullscreen playback also needs wake/keep-on behavior, but it should consume the same activity-source abstraction rather than depending on View B UI internals.

A good solution is a shared activity adapter that can be used by View B and fullscreen playback. View B remains a test surface; fullscreen playback remains a consumer.

### 8. Documentation truth and status discipline

The project has many docs: current-truth docs, status snapshots, architecture specs, backlog items, compatibility pointers, and old categorized docs. This is useful, but only if authority is clear.

A good solution is to keep current-truth docs short and evidence-backed, keep dated snapshots in dated folders, and mark old docs as historical or compatibility-only. Implementation status tables should distinguish docs status, code/tests status, runtime-observed status, and user subjective assessment.

### 9. Baseline and slice workflow safety

The project is regression-intolerant. Work must start from the active immutable baseline. If a newer active baseline is known but missing, the correct behavior is to stop and ask for it.

A good solution is to enforce baseline verification at the beginning of every analysis or implementation run:

| Check | Required evidence |
|---|---|
| ZIP filename | Matches active baseline name. |
| `VERSION` | Matches expected version. |
| `package.json` | Matches expected version. |
| Git HEAD | Recorded before work. |
| Dirty state | Clean before edits. |

## Architecture improvement guide

### Provider and adapter boundaries

The project should use provider/adapter boundaries where real behavior varies by environment or external dependency:

| Area | Needed boundary |
|---|---|
| Download | Mock/generated provider vs iCloudPD provider vs possible future providers. |
| GPS parser | EXIF provider vs JSON/XMP/text sidecar providers vs filename/path token providers vs future HEIC/video/tool-specific providers. |
| Geocode | Address-cache provider vs disabled-by-default network providers vs deterministic placeholder fallback. |
| Queue | Strict default policy vs future ordering/retention/requeue policy. |
| Runtime status | Observed logs/status vs actual scheduler/worker control. |

### Component, part, and slice separation

Future work should be split by named Parts and small slices. Each slice should have one purpose, one commit, and one verification path. Avoid mixing docs cleanup, provider implementation, UI changes, and runtime behavior in one slice unless the user explicitly approves a batch.

### Backend/frontend/runtime boundaries

Backend routes should remain the authority for worker actions. Frontend cards should trigger routes and display status, but should not invent worker state. Runtime scripts and external providers should be behind explicit server-side boundaries.

### Worker-stage state handoffs

The database-centered stage handoffs are a strength. Preserve them:

| Handoff | Boundary |
|---|---|
| Download → Index | Files in configured download directory. |
| Index → GPS parser | `parse_files_for_gps_queue`. |
| GPS parser → Geocode | `geocode_queue`. |
| Geocode → Queue | `GEOCODE_FOUND` plus address text/cache. |
| Queue → Playback | `slideshow_queue` / playback selection contract. |

### Runtime observability

Observability should distinguish:

| Signal | Meaning |
|---|---|
| Last route response | A user/API action happened. |
| Last worker log | A worker emitted output. |
| Scheduler evidence | Cron/emulator/crontab evidence exists. |
| Actual worker health | The worker is running and succeeding over time. |

Do not let a read-only status panel imply that a worker is actively managed unless the backend proves that state.

## Workflow and process improvement guide

| Workflow rule | Why it matters | High-level solution |
|---|---|---|
| Baseline verification first | Prevents regression from older ZIPs. | Verify filename, version files, Git HEAD, and dirty state. |
| ACR per slice | Improves prompt quality and risk detection. | Generate draft, analyze, criticize, refine, then run only the refined prompt. |
| One logical commit per slice | Makes regressions easier to isolate. | Keep changes scoped and commit-sized. |
| Final ZIP after batch workflows | Avoids noisy package outputs after every small slice. | Generate one full Git ZIP after all slices unless requested otherwise. |
| Slice status tables | Keeps progress visible. | Print planned/running/done/blocked status for each slice. |
| Stop when baseline missing | Prevents silent older-version work. | Ask for the newer active baseline ZIP. |
| Documentation updates with code changes | Keeps docs from drifting. | Update current-truth/status docs and changelog when behavior/status changes. |

## Recommended implementation order

### P0 — safety and correctness blockers

| Priority | Work | Reason |
|---|---|---|
| P0 | Enforce active-baseline verification before every implementation run. | Prevents losing newer fixes. |
| P0 | Preserve single `.env` Test Mode boundary. | Prevents real/test data overlap. |
| P0 | Keep Test Mode deterministic when adding real providers. | Prevents flaky tests and unsafe real actions. |

### P1 — core missing functionality

| Priority | Work | Reason |
|---|---|---|
| P1 | PC/runtime verification from real iCloudPD download through Queue. | Proves real data path before changing code. |
| P1 | Geocoder activation/proof harness with cache-first behavior and placeholder default preserved. | Provider registry exists; the next gap is safe runtime proof and address-quality validation. |
| P1 | GPS parser fixture/runtime proof for added EXIF, sidecar, filename, and path providers. | Provider chain exists; the next gap is evidence against real media and operator-provided metadata formats. |

### P2 — tests, observability, and docs

| Priority | Work | Reason |
|---|---|---|
| P2 | Real-media fixture matrix. | Finds issues before user runtime. |
| P2 | Worker-stage PC assessment table. | Separates static truth from runtime truth. |
| P2 | Runtime observability wording cleanup. | Prevents read-only panels from overclaiming worker control. |
| P2 | UI focus/scroll/live-update regression checks. | Preserves operator usability. |

### P3 — cleanup and polish

| Priority | Work | Reason |
|---|---|---|
| P3 | Normalize Queue terminology everywhere. | Reduces confusion. |
| P3 | Clean old compatibility docs gradually. | Keeps links working while improving navigation. |
| P3 | Add future queue policy design. | Prevents accidental behavior drift. |

## Verification strategy

| Verification type | Use it for | Example checks |
|---|---|---|
| Static inspection | Docs/routes/tests/source alignment | Route exists, docs do not overclaim, provider label is honest. |
| Automated tests | Regression protection | `npm test`, targeted Wave C/D/E and View B tests. |
| Typecheck/build | Frontend/backend TypeScript safety | `npm run typecheck`, `npm run build`. |
| Manual browser testing | Focus, scroll, inspect, visual stability | Inputs keep focus, payload panels keep scroll, pause works. |
| PC/runtime testing | Real provider behavior | iCloudPD real download, real media indexing, GPS parse, Queue rows. |
| Documentation consistency | Planning/status truth | Current-truth docs link to evidence and status snapshots. |

## Risks and tradeoffs

| Risk | Consequence | Mitigation |
|---|---|---|
| Adding real providers too early | Flaky tests, leaked network dependencies, unsafe Real Mode behavior. | Keep placeholder providers as defaults and gate real behavior. |
| Expanding Queue behavior without policy | Playback order and eligibility regressions. | Write policy docs and tests first. |
| Treating docs as proof | False confidence. | Verify against code/tests/runtime evidence. |
| Working on older baseline | Reintroduces fixed bugs. | Stop when latest baseline ZIP is missing. |
| Fixing UI by disabling live updates globally | Operators lose useful status updates. | Use explicit pause/resume and preserve state during updates. |
| Mixing many concerns in one slice | Hard rollback and unclear regressions. | One logical change per commit. |

## Final recommended next action

The best next action is a documentation/status slice that records this guide, normalizes current documentation terminology to use “Queue” only, and keeps the current implementation truth honest: deterministic pipeline implemented, real-provider maturity still incomplete.

After that, the next practical project action should be a PC/runtime verification run for the five regular worker stages using real media. That should happen before enabling production geocoding by default or adding more GPS provider branches, because real media evidence will reveal which provider gaps matter first.
