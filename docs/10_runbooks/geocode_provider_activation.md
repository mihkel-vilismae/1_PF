# Geocode provider activation runbook

Estonian timestamp: 30.05.2026, 21:28 EEST

## Purpose

This runbook explains how to safely activate and verify one reverse-geocode provider while preserving the current cache-first provider chain and disabled-by-default network behavior. It is documentation-only and does not change runtime behavior, endpoint contracts, database schema, dashboard UI, or provider code.

Use this only after the deterministic Test Mode media pipeline still passes. Do not commit real credentials, account IDs, API keys, access tokens, cookies, raw provider responses, or authorization headers.

## Current default behavior

Default provider order:

```text
address_cache,nominatim_osm,photon_komoot,postcodes_io_uk,pelias_self_hosted,opencage,geoapify,mapbox,google_geocoding,deterministic_placeholder
```

Default safety model:

1. `address_cache` is checked first.
2. Network providers are registered but disabled by default.
3. A network provider requires the global network gate and that provider's own enable flag.
4. `deterministic_placeholder` preserves existing safe behavior unless placeholder fallback is disabled.
5. Secrets and raw authorization data must not appear in logs, UI payloads, or docs.

## Provider summary

| Provider ID | Needs account/API key? | Default state | Notes |
| --- | ---: | --- | --- |
| `address_cache` | No | Enabled by chain order | Local SQLite cache. Should be first. |
| `nominatim_osm` | Usually no account/key; contact email and User-Agent recommended | Disabled | Check usage policy before repeated calls. |
| `photon_komoot` | Usually no account/key | Disabled | Public service availability and terms can change. |
| `postcodes_io_uk` | No | Disabled | UK-only nearest postcode/admin reverse lookup. |
| `pelias_self_hosted` | No external account when self-hosted | Disabled | Requires `BASE_URL`. |
| `opencage` | API key/account | Disabled | Paid/free-tier limits may apply. |
| `geoapify` | API key/account | Disabled | Paid/free-tier limits may apply. |
| `mapbox` | Access token/account | Disabled | Billing/token scope may apply. |
| `google_geocoding` | API key/account/billing | Disabled | Billing setup likely required. |
| `deterministic_placeholder` | No | Enabled | Not a real address provider. |

## Environment keys

Use `.env` locally. Do not use `test.env` for runtime behavior.

Global gates:

```text
GEOCODE_PROVIDER_ORDER=address_cache,nominatim_osm,photon_komoot,postcodes_io_uk,pelias_self_hosted,opencage,geoapify,mapbox,google_geocoding,deterministic_placeholder
GEOCODE_NETWORK_PROVIDERS_ENABLED=false
GEOCODE_ALLOW_NETWORK_PROVIDERS=false
GEOCODE_ALLOW_PLACEHOLDER_FALLBACK=true
```

Provider-specific pattern:

```text
GEOCODE_<PROVIDER_ID>_ENABLED=true|false
GEOCODE_<PROVIDER_ID>_ACCOUNT_USERNAME=
GEOCODE_<PROVIDER_ID>_ACCOUNT_ID=
GEOCODE_<PROVIDER_ID>_CONTACT_EMAIL=
GEOCODE_<PROVIDER_ID>_API_KEY=
GEOCODE_<PROVIDER_ID>_ACCESS_TOKEN=
GEOCODE_<PROVIDER_ID>_USER_AGENT=
GEOCODE_<PROVIDER_ID>_BASE_URL=
GEOCODE_<PROVIDER_ID>_TIMEOUT_SECONDS=10
```

## Safe activation checklist

| Step | Action | Expected result | Evidence to save |
| ---: | --- | --- | --- |
| 1 | Start from the latest baseline ZIP and record `VERSION`. | Version matches expected repo state. | Version text or screenshot. |
| 2 | Run deterministic Test Mode Download → Index → GPS → Geocode → Queue with network providers disabled. | Existing pipeline behavior still works. | Stage payloads and logs. |
| 3 | Confirm `address_cache` is first in `GEOCODE_PROVIDER_ORDER`. | Cache-first behavior is preserved. | `.env` excerpt with secrets omitted. |
| 4 | Pick exactly one provider to enable. | No multi-provider debugging ambiguity. | Provider ID chosen. |
| 5 | Set both global network gates to true only for this test. | Network providers can be considered by the chain. | Sanitized `.env` excerpt. |
| 6 | Set only the chosen provider's `ENABLED=true`. | Other network providers stay disabled. | Sanitized `.env` excerpt. |
| 7 | Configure only required account/contact/token fields. | Provider has enough config to run. | Redacted config checklist. |
| 8 | Run Geocode on one known GPS asset. | Geocode succeeds or fails with a sanitized provider result. | Endpoint payload, backend log, DB row. |
| 9 | Run Geocode again for the same coordinates. | Cache hit should stop before the network provider when a cache row exists. | Provider attempt/order evidence. |
| 10 | Restore `.env` gates to disabled unless you intentionally continue testing. | No accidental future network calls. | Final sanitized `.env` excerpt. |

## Example: enable Nominatim cautiously

Nominatim usually does not require an API key, but public usage policies normally require a meaningful User-Agent and contact details. Verify current policy before repeated or automated calls.

```text
GEOCODE_NETWORK_PROVIDERS_ENABLED=true
GEOCODE_ALLOW_NETWORK_PROVIDERS=true
GEOCODE_ALLOW_PLACEHOLDER_FALLBACK=true
GEOCODE_NOMINATIM_OSM_ENABLED=true
GEOCODE_NOMINATIM_OSM_CONTACT_EMAIL=operator@example.invalid
GEOCODE_NOMINATIM_OSM_USER_AGENT=PF_login_photo_frame_dev/0.7.32 operator@example.invalid
GEOCODE_NOMINATIM_OSM_TIMEOUT_SECONDS=10
```

Keep `address_cache` first in the order. After a successful first lookup, repeat the lookup and verify that the cache is used before Nominatim.

## Example: enable OpenCage with a redacted key

```text
GEOCODE_NETWORK_PROVIDERS_ENABLED=true
GEOCODE_ALLOW_NETWORK_PROVIDERS=true
GEOCODE_ALLOW_PLACEHOLDER_FALLBACK=true
GEOCODE_OPENCAGE_ENABLED=true
GEOCODE_OPENCAGE_ACCOUNT_USERNAME=operator@example.invalid
GEOCODE_OPENCAGE_ACCOUNT_ID=local-photo-frame-test
GEOCODE_OPENCAGE_API_KEY=<redacted>
GEOCODE_OPENCAGE_TIMEOUT_SECONDS=10
```

Never paste the real API key into chat, docs, screenshots, logs, or committed files.

## Placeholder fallback testing

To verify that Real Mode fails honestly instead of using placeholder text, temporarily use:

```text
GEOCODE_ALLOW_PLACEHOLDER_FALLBACK=false
```

Expected result: when no cache entry and no enabled/working real provider exists, geocoding should not silently produce placeholder address text. Restore this setting after the test unless that behavior is intentionally desired.

## Cache-first verification

Use the same coordinate pair twice:

1. First run: provider may call the chosen geocoder and write an address cache row.
2. Second run: `address_cache` should return the stored address before any network provider is used.

Record evidence in this table:

| Run | Coordinates | Expected provider | Actual provider/attempts | Address text | DB/cache evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| First |  | chosen provider or placeholder |  |  |  |  |
| Second | same as first | `address_cache` |  |  |  |  |

## Failure triage

| Symptom | Likely cause | First checks |
| --- | --- | --- |
| Provider is skipped | Global gate or provider enable flag is false. | `GEOCODE_NETWORK_PROVIDERS_ENABLED`, `GEOCODE_ALLOW_NETWORK_PROVIDERS`, provider `ENABLED`. |
| Provider says not configured | Missing API key, access token, base URL, contact email, or User-Agent. | Provider-specific env keys. |
| Placeholder still appears | Placeholder fallback is enabled and no earlier provider succeeded. | `GEOCODE_ALLOW_PLACEHOLDER_FALLBACK`, provider attempts. |
| Second run calls network again | Cache was not written, coordinates differ, or cache-first order changed. | `address_cache` order and DB/cache rows. |
| Logs show secrets | Sanitization bug or unsafe manual logging. | Stop testing, redact logs, fix logging before continuing. |
| Provider times out | Network/service/rate limit issue. | Timeout setting, connectivity, provider terms/status. |

## What this runbook does not prove

| Not proven | Reason |
| --- | --- |
| Production address quality for all photos | One provider test is not a broad quality benchmark. |
| Provider terms compliance | Terms/policies can change and must be checked before real use. |
| Full real iCloudPD pipeline | Download/auth is separate from geocoding. |
| Raspberry offline behavior | This runbook focuses on local PC/runtime geocode activation. |
