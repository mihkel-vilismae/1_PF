# CHANGELOG

## 2026-04-19 18:22 EEST — v0.3.0
- Performed safe inclusion and validation pass across the incoming frontend bundle and the audited system-documentation bundle.
- Kept the stronger modular frontend from the incoming project, including separate view files for A, B, C, and D, shared runtime-truth mock state, generated test data, and the Vite-based package setup.
- Included the stronger audited system documents `00_TABLE_OF_CONTENTS.md` through `14_VERSIONING_AND_CHANGELOG_RULES.md`.
- Preserved the frontend view documentation files because they remained consistent with the current UI surface and did not contradict the stronger system documents.
- Added `vite.config.js` so `npm run dev` works from the repository root while keeping the frontend files under `dashboard/`.
- Updated top-level README and documentation control text to clarify precedence between system documents and frontend view documents.
