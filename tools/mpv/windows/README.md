# Windows mpv runtime directory

> Current checkpoint: `v0.10.66`. This README was refreshed in the docs/launcher reconciliation pass; code, focused tests, proof artifacts, and runtime evidence override stale prose.

`start_win_full.cmd` and `start_scripts/start_win_full.ps1` use this repo-local directory as the Windows native playback tool location.

Runtime-installed mpv binaries, archives, and extracted files in this folder are intentionally ignored by Git. Only this README and `.gitkeep` are tracked so the directory contract remains visible without vendoring local media-player binaries.

Proof boundary:

- Tracking this directory documentation does not prove mpv is installed.
- Installing or validating mpv remains the responsibility of `scripts/install_mpv_windows.ps1` and the opt-in Windows native playback proofs.
- Runtime proof artifacts must stay under ignored runtime/proof paths and must not include private local paths beyond sanitized evidence.
