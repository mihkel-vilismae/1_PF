# Terminal Demo Empty View Shells Proof

Run:

```bash
npm run proof:terminal-demo-empty-view-shells
```

The proof verifies:

- `D` still renders the default operator view.
- `L`, `I`, and `1`-`6` render empty view shells.
- Each empty shell shows its view key and no-effect guard text.
- `start_stage_modal` keeps priority over numeric view keys `1`-`5` while open.
- The docs define `View`, `Pane`, `Section`, `Subsection`, `Modal`, and the full view registry.
