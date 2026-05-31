---
name: photo-frame-media-provider-proof
description: Use when adding, changing, testing, or documenting PF_login media metadata providers, especially GPS parsing providers, reverse-geocoding providers, cache-first behavior, fallback order, and runtime proof evidence.
---

# Photo Frame Media Provider Proof

Use this skill when work touches media-pipeline provider interfaces, provider chains, provider configuration, GPS coordinate extraction methods, reverse-geocoding providers, or evidence that proves provider behavior.

## Core Rule

Provider existence is not the same as provider proof. Keep implementation, configuration, tests, runtime/manual evidence, and documentation status separate.

## Read First

Read the narrowest relevant files first:

- `server/scripts/media_pipeline/provider_contracts.py`
- `server/scripts/media_pipeline/provider_chain.py`
- `server/scripts/media_pipeline/gps_exif_provider.py`
- `server/scripts/media_pipeline/gps_sidecar_providers.py`
- `server/scripts/media_pipeline/geocode_provider_registry.py`
- `server/scripts/media_pipeline/geocode_config.py`
- `server/scripts/media_pipeline/geocode_address_cache_provider.py`
- `server/scripts/media_pipeline/geocode_http_providers.py`
- `tests/mediaPipelineProviderContracts.test.js`
- `docs/10_runbooks/gps_metadata_sources.md`
- `docs/10_runbooks/geocode_provider_activation.md`
- `docs/20_architecture_and_specs/media_pipeline_provider_interfaces.md`
- `docs/20_architecture_and_specs/media_pipeline_geocode_provider_chain.md`

Use `source-of-truth` when documentation status and implementation evidence disagree.

## GPS Provider Rules

- Preserve EXIF-first behavior unless the task explicitly changes provider order.
- Local fallback methods may read sidecars, filenames, or path tokens only when coordinates are explicit and valid.
- Do not infer coordinates from unrelated numbers.
- Do not fabricate coordinates.
- Return success only when latitude and longitude are both present and valid.
- Keep missing/invalid coordinates as honest no-result or skipped outcomes.
- Record which method supplied coordinates so future debugging can distinguish EXIF, JSON, XMP, text, filename, and path sources.

## Geocode Provider Rules

- Preserve cache-first behavior.
- Keep network providers disabled by default unless the user explicitly asks to activate one.
- Never commit API keys, access tokens, account IDs, usernames, cookies, or provider secrets.
- Do not make network calls in tests unless the task explicitly asks for a live/manual proof run.
- Keep deterministic placeholder fallback visibly labeled as fallback behavior, not production geocoding.
- When testing a real provider, prove cache hit, provider hit, disabled-provider behavior, and fallback behavior separately.

## Proof Checklist

For each changed provider method, capture at least one of these evidence types:

- Unit or integration test fixture proving the parser/provider result.
- Backend command output proving stage behavior.
- Database row/status output proving stored coordinates or address fields.
- Runbook evidence showing exact operator command and expected result.

Do not present a runbook as proof that runtime behavior works. Runbooks describe how to prove behavior; tests or captured command/runtime evidence prove behavior.

## Documentation Rules

When provider behavior changes, update only the relevant canonical docs:

- `docs/00_current_truth/` for verified current status.
- `docs/10_runbooks/` for operator proof steps.
- `docs/20_architecture_and_specs/` for provider contracts and chain rules.
- `docs/40_backlog_and_tasks/` for unproven provider work.
- `docs/50_audits_and_migrations/` for reconciliations and stale-claim cleanup.

Also update `docs/table_of_contents.md`, `docs/DOC_INDEX.md`, and `docs/DOC_FRESHNESS_MATRIX.md` when new or materially reclassified docs are added.

## Verification

Choose the smallest relevant checks:

```powershell
npx tsx --test tests/mediaPipelineProviderContracts.test.js
npm run typecheck
npm run build
npm run task-docs:check
```

For live/provider proof, report exact `.env` keys used without printing secret values, then capture sanitized command output or database/status evidence.
