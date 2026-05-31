# Media Pipeline Geocode Provider Chain

## Status

Version: 0.7.32  
Date: 29.05.2026, 22:20:00 EEST  
Scope: backend-only Python reverse-geocoding provider adapters and standardized provider account inputs.

## Provider order

The reverse-geocoding worker now builds a cache-first provider chain from `GEOCODE_PROVIDER_ORDER`.

Default order:

```text
address_cache,nominatim_osm,photon_komoot,postcodes_io_uk,pelias_self_hosted,opencage,geoapify,mapbox,google_geocoding,deterministic_placeholder
```

Runtime behavior remains safe by default:

1. `address_cache` is checked first.
2. Network providers are registered but disabled unless both the global network gate and the provider-specific enable flag are true.
3. The existing deterministic placeholder remains enabled by default to preserve current worker behavior.
4. `GEOCODE_ALLOW_PLACEHOLDER_FALLBACK=false` can disable the placeholder when Real Mode should fail honestly instead of using placeholder text.

## Providers

| Provider ID | Account/API key needed | Default state | Purpose |
|---|---:|---|---|
| `address_cache` | No | Enabled by chain order | Reads the local SQLite `address_cache` before any network calls. |
| `nominatim_osm` | No normal account/API key, but contact/User-Agent should be configured | Disabled | OpenStreetMap/Nominatim reverse geocoding. |
| `photon_komoot` | No normal account/API key | Disabled | Photon/Komoot reverse geocoding. |
| `postcodes_io_uk` | No | Disabled | UK-only nearest postcode/admin reverse lookup. |
| `pelias_self_hosted` | No external account if self-hosted | Disabled | Configured Pelias `/v1/reverse` instance. |
| `opencage` | API key/account | Disabled | OpenCage reverse geocoding. |
| `geoapify` | API key/account | Disabled | Geoapify reverse geocoding. |
| `mapbox` | access token/account | Disabled | Mapbox reverse geocoding. |
| `google_geocoding` | API key/account/billing setup | Disabled | Google Geocoding reverse lookup. |
| `deterministic_placeholder` | No | Enabled | Existing placeholder fallback, not a real address provider. |

## Standardized provider input keys

Every provider uses the same account/config input pattern:

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

Examples:

```text
GEOCODE_OPENCAGE_ENABLED=true
GEOCODE_OPENCAGE_ACCOUNT_USERNAME=operator@example.com
GEOCODE_OPENCAGE_ACCOUNT_ID=photo-frame-account
GEOCODE_OPENCAGE_API_KEY=...
```

```text
GEOCODE_MAPBOX_ENABLED=true
GEOCODE_MAPBOX_ACCOUNT_USERNAME=operator@example.com
GEOCODE_MAPBOX_ACCOUNT_ID=photo-frame-account
GEOCODE_MAPBOX_ACCESS_TOKEN=...
```

Do not commit real credentials. Keep `.env` local.

## Safety rules

- The frontend/dashboard does not select or store provider credentials.
- Provider account values, API keys, access tokens, and raw authorization data must never be logged.
- Provider response storage must use sanitized summaries only.
- Network providers are disabled by default to avoid behavior shifts and unexpected API calls.
- Cache hits stop the chain before network providers.
- Placeholder geocoding must stay clearly labeled as placeholder behavior.


## Operator activation runbook

Use `docs/10_runbooks/geocode_provider_activation.md` when enabling any provider. That runbook keeps activation intentionally narrow: one provider at a time, `address_cache` first, sanitized evidence only, and network providers disabled again after testing unless continued Real Mode testing is intentional.
