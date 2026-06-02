# Address display UI proof

`proof:address-display-ui` is a deterministic local UI-render proof for the PF_login dashboard playback surface.

## Command

```bash
npm run proof:address-display-ui
```

## What it proves

- A selected playback item with resolved address evidence renders into the Windows playback surface.
- The same selected item renders into the fullscreen display-facing overlay.
- A selected playback item without address evidence renders the existing pending-address fallback copy.
- Unsafe raw filesystem path-like fields are ignored by the display-facing renderer.
- The proof artifact stores semantic assertion results and markup metrics only, not brittle full-page HTML snapshots.

## What it does not prove

- It does not launch a browser.
- It does not start the backend server.
- It does not prove physical display output.
- It does not change production backend behavior or run network/provider calls.

Runtime JSON is written under `runtime_data/proofs/address_display_ui_*.json` and is intentionally ignored by Git.
