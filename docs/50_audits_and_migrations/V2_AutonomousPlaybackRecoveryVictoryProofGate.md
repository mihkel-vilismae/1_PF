# V2 Autonomous Playback + Recovery Victory Proof Gate — B12

Status: proof gate implemented, live target-machine victory proof not passed in this sandbox.

## Purpose

B12 prevents customer-ready claims until both primary objectives are proven with evidence:

1. Autonomous playback: auth/session, Raspberry scheduler, download, index, GPS parse, geocode, queue, and fullscreen playback.
2. Autonomous recovery: rough stop/restart or power-loss simulation restores same media/queue context. Exact timestamp resume is not required.

## Gate requirements

| Requirement | Rule |
|---|---|
| Scheduler | `3A` success on the target machine. |
| Pipeline | `B3.1` through `B3.5` success. |
| Queue | At least one image/video row prepared by backend queue bridge. |
| Metadata | GPS/address may be present or explicitly missing; never fake an address. |
| Recovery state | Manual/autosave/restart snapshot is available. |
| Live playback proof | Explicit live autonomous playback evidence artifact required. |
| Live recovery proof | Explicit live abrupt-stop/restart recovery evidence artifact required. |

## Non-claim

The current sandbox can pass code/tests for the gate, but it cannot pass live Raspberry/autonomous recovery victory proof without target-machine evidence.
