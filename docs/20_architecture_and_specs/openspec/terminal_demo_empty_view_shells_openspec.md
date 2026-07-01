# Terminal Demo Empty View Shells OpenSpec

## Version

Introduced in `2.0.9`.

## Purpose

Define the first view-system slice for terminal Demo Mode. This slice creates empty view shells only. It does not implement the future buttons or actions for those views.

## Vocabulary

| Term | Definition |
|---|---|
| `View` | The whole full-screen terminal screen/state currently shown. |
| `Pane` | A large top-level region inside a view. |
| `Section` | A bordered block inside a pane. |
| `Subsection` | A smaller logical block inside a section. |
| `Modal` | A view-scoped overlay visible only when opened/enabled. |
| `SectionHeader` | The visible title line of a section. |
| `SectionBody` | The content area inside a section. |
| `ViewKey` | A keyboard key that selects a terminal view when no modal owns input. |

## View registry

| View key | View shell |
|---|---|
| `0` | Table of Contents and Debug map/testing shell. |
| `D` | Default operator view. |
| `L` | Logs view. |
| `I` | iCloudPD login view. |
| `1` | Download stage view. |
| `2` | Indexing stage view. |
| `3` | GPS Parser stage view. |
| `4` | Geocode stage view. |
| `5` | Enqueue view. |
| `6` | Playback view. |

## Behavior contract

- `D` remains the current real-demo operator screen.
- `0` renders a map/testing shell only.
- `1`-`6` render empty view shells only. Later slices have promoted `I` to the NEW AUTH shell and `L` to the logs shell while preserving the original no-effect boundary.
- Empty view shells must state that no buttons, workers, auth, playback, DB writes, file copies, or cron calls run from this slice.
- When `start_stage_modal` is open, modal keys `1`-`5` keep their existing modal behavior and must not switch views.
- `H`, `S`, `Q`, `P`, `W`, `R`, and `X` retain their existing meanings.

## Non-goals

- No Logs view file tailing yet.
- No iCloudPD login buttons yet.
- No stage view buttons yet.
- No playback view buttons yet.
- No button functionality yet.
