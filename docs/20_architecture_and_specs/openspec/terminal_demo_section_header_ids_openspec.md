# Terminal Demo section header ID overlay OpenSpec

Status: implemented in PhotoFrame `2.0.7`.

## Vocabulary

| Term | Meaning |
|---|---|
| `Pane` | A large top-level terminal region. The wide terminal view uses left, center, and right panes. |
| `Section` | A bordered functional block inside a pane. |
| `SectionHeader` | The visible title line of a section, such as `ACTIONS` or `PLAYBACK`. |
| `SectionBody` | The content inside a section below the header. |
| `section_header_id_overlay` | A temporary operator overlay that prefixes section headers with stable view-local IDs. |

## Operator contract

Pressing `H` toggles section header IDs on or off. The default view stays unprefixed. When the overlay is visible, the section header prefix is `{pane-code}-{section-ordinal}`.

| Pane | Code | Counting rule |
|---|---|---|
| Left pane | `L` | Count sections top-to-bottom in the left pane. |
| Center pane | `C` | Count sections top-to-bottom in the center pane. |
| Right pane | `R` | Count sections top-to-bottom in the right pane. |

Examples from the wide terminal view:

| Section | Overlay header |
|---|---|
| Actions | `L-3 ACTIONS` |
| Playback | `C-2 PLAYBACK` |
| RPI stages | `R-1 RPI-STAGES — DEMO TRUTH` |

## Current ID map

| ID | Section |
|---|---|
| `L-1` | PhotoFrame terminal banner/header section. |
| `L-2` | Generated/mock demo media section. |
| `L-3` | Actions section. |
| `L-4` | `start_stage_modal` section when open. |
| `C-1` | Current run / command plan section. |
| `C-2` | Playback section. |
| `C-3` | Screen on/off worker section. |
| `C-4` | Playback queue section. |
| `R-1` | RPI stages section. |
| `R-2` | RPI workers section. |
| `R-3` | Storyboard / inspector section. |
| `R-4` | Area A real-time log section. |

## Boundary

The overlay is display-only. It does not run workers, mutate the DEMO DB, change cron behavior, change proof truth, or change the meaning of the underlying section. It only changes visible section header text while enabled.

## Proof

```bash
npm run proof:terminal-demo-section-header-ids
```

The proof verifies that the default real-demo smoke view stays unprefixed, `H` shows `L-3 ACTIONS`, `C-2 PLAYBACK`, and `R-1 RPI-STAGES`, and `H` plus `S` shows `L-4 START STAGE MODAL`.

Decision: `TERMINAL_DEMO_SECTION_HEADER_IDS_READY`.
