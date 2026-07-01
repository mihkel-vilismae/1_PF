# Terminal Demo Empty View Shells Proof

Run:

```bash
npm run proof:terminal-demo-empty-view-shells
```

The proof verifies:

- `D` still renders the default operator view.
- `1`-`5` render empty view shells. Later slices promote `I`, `L`, and `6` into shell pages while preserving no-effect behavior where applicable.
- Each remaining empty shell shows its view key and no-effect guard text.
- View `6` renders the merged fixture-backed playback contract and is not a generic empty shell.
- `start_stage_modal` keeps priority over numeric view keys `1`-`5` while open.
- The docs define `View`, `Pane`, `Section`, `Subsection`, `Modal`, and the full view registry.
