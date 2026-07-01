# Terminal Demo v2.0 Implementation Handoff

Generated: 2026-06-30  
Source baseline: `PF_login_v1.9.0_real_demo_slices_to_operator_layout_full_git.zip` / version `1.9.0` / short HEAD `38cfbe7`.

## What v2.0 should start from

v1.9.0 already contains the implementation slices that v2.0 must consolidate:

| Slice | What exists | Command to refresh |
| --- | --- | --- |
| Q-created DB rows | Q writes q-created rows into real DEMO DB tables. | `npm run proof:terminal-demo-q-db-queue-creation` |
| Metadata/address | Q runs GPS/geocode/address stages before queue. | `npm run proof:terminal-demo-metadata-address-queue` |
| Batch parity | Batch 1/5 write comparable DEMO truth/status outputs. | `npm run proof:terminal-demo-batch-parity` |
| Screen panel | Guarded screen-worker panel and idle/reset state. | `npm run proof:terminal-demo-screen-worker-panel` |
| Operator layout | Area A/B/C labels and diagnostic routing. | `npm run proof:terminal-demo-operator-layout-status` |

## Implementation focus for v2.0

v2.0 should be mostly consolidation and proof freshness, not a new feature detour.

1. Make `proof:terminal-demo-final` cover the v1.5-v1.9 proof chain or explicitly call/report those subproofs.
2. Make `proof:terminal-demo-rc-readiness` exercise the v2.0 final proof without stale baseline assumptions.
3. Ensure operator rehearsal evidence reports the v2.0 decision and exact next action.
4. Ensure the final generated ZIP can be freshly extracted and verified without relying on dirty-worktree runtime state.
5. Keep all behavior DEMO-scoped and manual/no-cron.

## Known implementation risks

| Risk | Why it matters | v2.0 mitigation |
| --- | --- | --- |
| Stale proof claim | v1.9 implementation had some later tool-session hangs/timeouts after earlier proof passes. | Rerun current-baseline proof chain from fresh extraction and report NOT_RUN/BLOCKED honestly. |
| Provider availability | Geocode provider may be disabled or lack network/key configuration. | Treat provider failure as degraded/BLOCKED, not fake address success. |
| Evidence ZIP scope | Logs ZIP must not contain the source repo. | Keep evidence pack source as runtime log folder only. |
| Screen command safety | Real screen power calls can affect operator machine. | Keep commands guarded by explicit platform/safety flags. |
| Mock bleed-through | The old mock storyboard must not satisfy real-demo proof. | Keep adapter/proof separation checks in final guard. |

## Suggested v2.0 acceptance table

| Gate | Required result |
| --- | --- |
| Build/typecheck | PASS |
| q-created DB queue proof | PASS |
| metadata/address proof | PASS or BLOCKED only with exact provider reason; no fake success |
| batch parity proof | PASS |
| screen panel proof | PASS |
| operator layout proof | PASS |
| final proof | PASS and includes v2.0 proof-chain coverage |
| operator rehearsal | PASS with evidence ZIP |
| RC readiness | PASS and reports `REAL_DEMO_MODE_V2_RC_READY` or exact BLOCKED reason |
| ZIP hygiene | Full Git ZIP, no `node_modules`, no runtime data, no source repo inside evidence ZIP |

## Do not do in v2.0

```text
Do not add cron.
Do not redesign the DB schema.
Do not claim production Raspberry readiness.
Do not add unguarded screen power commands.
Do not invent GPS/address values.
Do not let mock-demo satisfy real-demo proofs.
```


## v2.0.0 Real Demo Mode operator RC

Decision: `REAL_DEMO_MODE_V2_RC_READY` when the v2 proof chain passes. The v2 operator RC consolidates the implemented v1.5-v1.9 slices: DEMO-owned DB/media/truth/status/queue/playback, Q-created DB rows, metadata/address stages, batch 1/5 parity, guarded screen-worker panel, Area A/B/C layout routing, operator rehearsal evidence, and RC readiness reporting.

Proof chain:

```bash
npm run proof:terminal-demo-v2-operator-rc
npm run proof:terminal-demo-final
npm run proof:terminal-demo-operator-rehearsal
npm run proof:terminal-demo-rc-readiness
```

Non-claims: no cron, no DB schema redesign, no unguarded real screen power command, no mock success claim, and no production Raspberry v2 claim without target evidence.


## v2.0.2 Q operator status/logging cleanup

The real-demo terminal now records manual `Q` runs as completed operator actions and writes persistent Q button evidence to `runtime_data/logs/demo/terminal-button-actions.jsonl`. The Q event includes batch size, route, selected row count, q-created queue counts, stage status summary, and `noCron=true`. Expected demo/offline GPS/geocode degradation is displayed as degraded/blocked with context rather than an unexplained hard Error, and stale `v0.12.0 Group 6B` copy has been removed from the real-demo operator UI.

Proof:

```bash
npm run proof:terminal-demo-q-operator-status
```
