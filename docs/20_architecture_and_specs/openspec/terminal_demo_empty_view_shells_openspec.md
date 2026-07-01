# Terminal Demo Empty View Shells OpenSpec

## Version

Introduced in `2.0.9`.

## Purpose

Define the first view-system slice for terminal Demo Mode. This slice originally created empty view shells only. Later slices can promote individual views out of the generic empty-shell state while preserving the no-effect boundary for views that remain empty.

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
- `0` renders the map/testing route shell.
- `1`-`5` render empty view shells only. Later slices have promoted `I` to the NEW AUTH shell, `L` to the logs shell, and `6` to the fixture-backed playback contract while preserving the original no-effect boundary where applicable.
- Empty view shells must state that no buttons, workers, auth, playback, DB writes, file copies, or cron calls run from this slice.
- View `6` is no longer a generic empty shell after the View0/View6 branch merge; its current contract is documented in `terminal_demo_view6_fixture_playback_contract_openspec.md`.
- When `start_stage_modal` is open, modal keys `1`-`5` keep their existing modal behavior and must not switch views.
- `H`, `S`, `Q`, `P`, `W`, `R`, and `X` retain their existing meanings.

## Non-goals

- No Logs view file tailing yet.
- No iCloudPD login buttons yet.
- No stage view buttons yet.
- No queue-backed or real playback buttons yet.
- No button functionality yet.
