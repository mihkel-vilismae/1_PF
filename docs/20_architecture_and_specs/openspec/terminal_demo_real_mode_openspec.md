# Terminal Demo Real Mode OpenSpec

Generated: 2026-06-29  
Status: Group 3B implemented as guarded terminal orchestration inside PhotoFrame.

## Goal

Turn the terminal mock-demo into a real terminal Demo Mode that uses PhotoFrame DEMO-owned paths, generated demo media, DEMO truth/status files, and existing worker/stage entrypoints without cron.

## Current implementation status

| Area | Status | Score |
|---|---|---:|
| Terminal merged into PhotoFrame | Implemented at `terminal/demo/` | 10/10 |
| Mock adapter preserved | Implemented | 10/10 |
| Real-demo path boundary | Implemented | 9/10 |
| Real-demo media discovery | Implemented | 9/10 |
| Real-demo truth readers | Implemented | 9/10 |
| Command planner | Implemented | 9/10 |
| W batch-size toggle | Implemented for `1 <-> 5` | 10/10 |
| Visible selected batch size | Implemented in header/actions/current run/inspector | 10/10 |
| Q consumes selected batch size | Implemented | 8/10 |
| Demo-safe manifest write | Implemented under `DEMO_RUNTIME_OUTPUT_DIR` with path guard | 9/10 |
| Worker execution | Guarded behind `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1`; default smoke path remains planned/no mutation | 5/10 |
| Real/demo runtime env mapping | Partially implemented for future scheduler CLI calls | 7/10 |
| Queue reader/playback | Planned for Group 5 | 0/10 |
| Proof/de-mocking guard suite | Planned for Group 6 | 2/10 |

## Group 3B behavior

- Default selected `batch_size` is `1`.
- Pressing `W` toggles `batch_size` between `1` and `5`.
- Pressing `W` does not call workers.
- Pressing `Q` uses the currently selected batch size.
- For `batch_size=1`, the terminal describes a file-by-file teaching route.
- For `batch_size=5`, the terminal describes a stage-by-stage batch route.
- Q writes a demo-owned manifest only after verifying the manifest path is inside `DEMO_RUNTIME_OUTPUT_DIR`.
- Q does not use cron.
- Real worker command execution is guarded by `PHOTOFRAME_TERMINAL_DEMO_EXECUTE=1`.

## Boundaries

The Group 3B default path must not:

```text
write real/test paths
install or use cron
fake worker success
implement fullscreen playback
implement screen on/off behavior
```

## Next group

Group 5 should add real demo queue reading and playback-selection display, then Group 6 should add path isolation, no-cron, batch-size, queue, and de-mocking proofs.
