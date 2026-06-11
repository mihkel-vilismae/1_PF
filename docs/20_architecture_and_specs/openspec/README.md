# OpenSpec documentation

This folder holds forward-looking OpenSpec contracts for implementation areas that are not yet proven by current runtime evidence.

OpenSpec documents in this folder are requirements and proof contracts, not implementation proof. A feature is not considered implemented until code, tests, and generated or target-machine evidence prove the specific behavior.

Current OpenSpec entries:

- [Raspberry OS missing feature OpenSpec](raspberry_os_missing_features_openspec.md)

- [Endpoint contract inventory OpenSpec](endpoint_contract_inventory_openspec.md) — static inventory of PF_login `METHOD /api/...` routes and boundary notes.

- [Raspberry local tool checker OpenSpec](raspberry_local_tool_checker_openspec.md) — implemented preflight for `mpv`, `ffmpeg`, and `ffprobe` readiness without playback/recovery claims.

- [Raspberry project-owned launcher OpenSpec](raspberry_project_owned_launcher_openspec.md) — launcher skeleton for dry-run evidence and optional API ownership without playback/scheduler/recovery claims.

- [Raspberry generated fixture proof OpenSpec](raspberry_generated_fixture_proof_openspec.md) — target-gated generated fixture validation using `python3` and `ffprobe` without playback/recovery claims.
