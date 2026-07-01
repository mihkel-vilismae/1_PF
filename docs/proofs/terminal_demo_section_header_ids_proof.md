# Terminal Demo section header IDs proof

Command:

```bash
npm run proof:terminal-demo-section-header-ids
```

Expected result: `terminal_demo_section_header_ids: PASS`.

The proof covers:

- default real-demo smoke output does not prefix section headers,
- pressing `H` toggles `section_header_id_overlay` on,
- section headers show stable Pane/Section IDs such as `L-3 ACTIONS`, `C-2 PLAYBACK`, and `R-1 RPI-STAGES`,
- pressing `H` then `S` shows `L-4 START STAGE MODAL`,
- docs and default project settings mention Pane, Section, SectionHeader, SectionBody, and the overlay contract.

This proof is UI/contract-only. It does not claim worker execution, cron execution, DB mutation, or Raspberry production readiness.
