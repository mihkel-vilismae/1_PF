# Goal 4 Media Pipeline Verification Alignment — 2026-05-28 12:20 EEST

## ACR slice record

### Original instruction
Run Goal 4 workflow slice 3: align media pipeline claims with tests and verification evidence.

### Draft prompt
Compare each stage claim against existing tests, especially Wave D and Wave E, and identify what is verified, partially verified, or not verified.

### Analyze
This slice should not duplicate the full behavior doc. It should show which claims are protected by tests and where docs must remain cautious.

### Critique
Avoid saying “fully production ready” when tests prove deterministic/test behavior only. Separate UI wiring tests from backend pipeline tests. Include negative/blocking paths because they are important evidence.

### Refined prompt run
Create a verification alignment document for Goal 4. Map each media pipeline stage to the strongest current tests, list verified claims, unsupported claims, and remaining gaps. Treat Wave D/E as primary deterministic pipeline evidence and View/UI tests as wiring evidence.

## Verification summary

| Stage | Strongest evidence | Verified claims | Remaining caution |
| --- | --- | --- | --- |
| Download | `tests/waveD.e2e.test.js`, `tests/waveE.step5.test.js`, `tests/viewB.buttonWorkflow.test.js` | Mock/generated download copies fixture files into the configured download directory and reports missing-source failure through orchestration. View B routes to the expected endpoint. | Deterministic mock path is verified. Real iCloudPD download is a separate auth-gated route and is not proven by Wave D/E as a production end-to-end download flow. |
| Index | `tests/waveD.e2e.test.js`, `tests/waveE.step5.test.js`, `tests/viewB.buttonWorkflow.test.js` | Stage 2 indexes downloaded fixtures into canonical assets and variants, seeds GPS queue rows, and reports counts. View B routes to the expected endpoint. | Tests verify supported fixture media; broad media-type production coverage depends on supported extension/parser behavior. |
| GPS parser | `tests/waveD.e2e.test.js`, `tests/waveE.step5.test.js`, `tests/viewB.buttonWorkflow.test.js` | Stage 3 processes GPS queue rows, marks GPS-found and GPS-not-found assets, and seeds geocode work for successful GPS extraction. | Verified against controlled EXIF fixtures and no-GPS fixtures; hardware/PIR/screen detection is unrelated. |
| Geocode | `tests/waveD.e2e.test.js`, `tests/waveE.step5.test.js`, `tests/viewB.buttonWorkflow.test.js` | Stage 4 processes geocode queue rows, creates deterministic `Lat/Lon` placeholder addresses, updates address cache, and leaves non-GPS assets pending/not geocoded. | Not a production reverse geocoder. Docs/UI must keep the placeholder warning visible. |
| Queue | `tests/waveD.e2e.test.js`, `tests/viewB.buttonWorkflow.test.js` | Stage 5 inserts eligible READY queue rows and skips ineligible rows with `already_queued`, `geocode_not_ready`, `missing_variant`, and `missing_file_path`. Second run is idempotent for already queued assets. | Verified for deterministic failure fixtures. Future eligibility changes must update both tests and docs. |
| Playback Select | `tests/waveD.e2e.test.js`, `tests/waveE.step5.test.js`, `tests/playbackApiContract.test.js`, `tests/playbackWorker.test.js`, `tests/playbackLoop.test.js` | Stage 6 selects a current playable READY item, persists selected asset summary/current media id behavior, rejects no-ready/no-playable cases, and worker selection remains separate from rendering. | Rendering, fullscreen overlay, and wake/keep-on behavior are separate frontend/playback-view layers, not Stage 6 itself. |
| Orchestration | `tests/waveE.step5.test.js`, `tests/runtimeStatusRoutesCompatibility.test.js`, `tests/viewC.orchestrationWiringGuard.test.js` | Orchestrator executes all stages in order on success, stops and records controlled failure at download, and exposes current/last status endpoints. View C reads last run without restore mutation. | Restore/resume is not implemented as a backend mutation contract. |

## Primary test evidence details

### `tests/waveD.e2e.test.js`

Wave D is the strongest deterministic Stage 1–6 proof because it exercises the real backend routes against a fresh temporary database and real fixture files. It verifies:

- `POST /api/runtime/download/run` copies four fixture files into the download directory.
- `POST /api/runtime/index/run` inserts canonical rows and variants for the fixtures.
- `POST /api/runtime/gps/run` finds GPS for three fixtures and marks one fixture as no GPS.
- `POST /api/runtime/geocode/run` creates deterministic placeholder addresses for GPS-found assets.
- `POST /api/runtime/queue/prepare` inserts only the eligible geocoded asset and records skip reasons for not-ready or invalid assets.
- A second queue-prepare call is idempotent for already queued assets.
- `POST /api/runtime/playback/select-current` selects the eligible asset for playback.

### `tests/waveE.step5.test.js`

Wave E verifies the orchestration layer instead of each manual button route in isolation. It proves:

- successful orchestration executes exactly `download`, `index`, `gps`, `geocode`, `queue_prepare`, and `playback_select` in order;
- successful orchestration stores six stage results and a selected asset summary;
- current and last orchestration status endpoints return the persisted run state;
- controlled missing-source failure stops at `download`, marks the run failed, and records no later stage results;
- inspection before a run returns a stable status shape.

### UI and compatibility tests

| Test file | Alignment use |
| --- | --- |
| `tests/viewB.buttonWorkflow.test.js` | Confirms View B buttons call the documented backend endpoints and surface backend failures without fabricated success. |
| `tests/runtimeExecutionService.test.js` | Guards frontend endpoint constants for download, real download, index, queue prepare, playback select, orchestration run, and orchestration last. |
| `tests/runtimeStatusRoutesCompatibility.test.js` | Guards current/last orchestration route extraction. |
| `tests/viewC.orchestrationWiringGuard.test.js` | Confirms View C refresh reads `/api/runtime/orchestration/last` and resume remains local/no backend mutation. |
| `tests/playbackApiContract.test.js` | Guards playback current/queue/media contract and Test/Real DB separation. |
| `tests/playbackWorker.test.js` | Confirms playback worker only selects current item and does not claim rendering or other pipeline-stage work. |

## Claims that are not fully verified as production behavior

| Claim area | Why caution is required |
| --- | --- |
| Real iCloudPD download as a full production pipeline input | The authenticated real route exists and is separately guarded, but Wave D/E deterministic pipeline coverage uses mock/generated download fixtures. |
| Production reverse geocoding | The current Stage 4 provider is explicitly `deterministic_placeholder`; tests verify deterministic address text, not live geocoder accuracy. |
| View C resume/restore | View C reads last orchestration state; backend restore/resume mutation is intentionally not implemented. |
| Raspberry/OS playback worker runtime freshness | Playback observability reads scheduler/log evidence, but the core media pipeline tests do not prove real cron deployment on a Raspberry Pi. |
| Frontend rendering/fullscreen playback | Stage 6 selects backend media; separate playback view tests cover rendering contracts. Backend Stage 6 does not render. |

## Verification conclusion

Goal 4 can honestly mark the deterministic media pipeline as code/test implemented for Download → Index → GPS → Geocode → Queue → Playback Select. The table must still mark real iCloudPD download and production geocoding as partial or bounded, and it must leave the subjective PC-tested assessment blank until manual PC testing is provided.
