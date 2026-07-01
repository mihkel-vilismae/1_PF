# Terminal Demo start_stage_modal OpenSpec

Status: implemented through PhotoFrame `2.0.5`; docs/launcher guard added in `2.0.6`.

## Operator contract

| The key pressed | Action it must take |
|---|---|
| `S` | Open/display the `start_stage_modal` element. |
| `1` | Show Download row, but keep manual Download disabled for now. |
| `2` | Run Index against the DEMO DB through the shared regular worker path contract. |
| `3` | Run GPS Parser against the DEMO DB through the shared regular worker path contract. |
| `4` | Run Geocode against the DEMO DB through the shared regular worker path contract. |
| `5` | Run Enqueue for Playback against the DEMO DB through the shared regular worker path contract. |

Text summary: pressing `S` opens a modal-like terminal element named `start_stage_modal`. The modal has five rows: Download, Index, GPS Parser, Geocode, and Enqueue for Playback. Download is visible but disabled. Keys `2`-`5` execute DEMO-owned DB effects while retaining the shared `regular-stage-worker` command contract and `noCron=true` evidence.

## Batch size contract

Each modal row owns its own manual `batch_size`. The default is `1`, and the allowed modal values are `1` and `3`. Changing one row must not silently change another row. Q batch-size behavior is separate and is not redefined by this modal.

## Execution boundary

The modal is an operator entrypoint, not a duplicate worker. Manual starts retain the existing scheduled-worker command contract: `npm run api -- --scheduler regular-stage-worker`. The implementation records the cron reference as contract evidence only and does not invoke or install cron.

## Evidence

Manual modal stage events are appended to `runtime_data/logs/demo/terminal-button-actions.jsonl`. Events include key/button, stage, batch size, route, worker command, cron reference, selected rows, manifest path, DB effect status/counts, truth status, messages, and `noCron=true`.

## Proofs

```bash
npm run proof:terminal-demo-start-stage-modal
npm run proof:terminal-demo-start-stage-modal-shared-path
npm run proof:terminal-demo-start-stage-modal-db-effects
npm run proof:terminal-demo-start-stage-modal-docs
```

## Non-claims

- No Download stage start for key `1`.
- No cron/crontab installation or invocation.
- No DB schema redesign.
- No mock success claim from the real-demo modal.
- No production Raspberry v2 claim without target evidence.

Decision: `START_STAGE_MODAL_OPERATOR_DOCS_READY`.
