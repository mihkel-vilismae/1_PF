# SECURITY_AUDIT_TRIAGE_20260626

Checkpoint: `v0.10.66`.

## 2x ACR finding

The unresolved `npm install` audit risk was the only listed risk that could be directly reduced inside the sandbox without target Raspberry hardware. The live playback/recovery/PIR risks require target-device evidence and must remain blocked by the B12 proof gate.

## Fix applied

- Upgraded `vite` from `^5.4.19` to `^8.1.0`.
- Added a root `overrides.esbuild = 0.28.1` pin so both Vite and tsx use an audit-clean esbuild release.
- Regenerated `package-lock.json`.

## Proof run

`npm audit --audit-level=low` completed with `found 0 vulnerabilities` during the v0.10.66 slice.

## Boundary

This is a dependency/security-maintenance slice. It does not change V2 runtime behavior, backend recovery behavior, playback queue semantics, or live proof status.
