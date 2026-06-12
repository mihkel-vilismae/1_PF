# Media Pipeline Provider Interfaces

## Status

Version: 0.7.32
Date: 29.05.2026, 22:20:00 EEST
Scope: backend-only Python provider foundation for GPS parsing and reverse geocoding.

## Purpose

The media pipeline has separate worker stages for GPS parsing and reverse geocoding. This document defines the provider boundary added around the current Python worker behavior so future providers can be added without changing dashboard UI code or endpoint contracts.

## Current provider modules

| Stage | Contract | Default provider | Current behavior |
|---|---|---|---|
| GPS parsing | `GpsProvider` in `server/scripts/media_pipeline/provider_contracts.py` | EXIF first, then offline sidecar/path fallbacks | Reads embedded EXIF GPS via Pillow first, then tries explicit local coordinate metadata without network calls |
| Reverse geocoding | `ReverseGeocodeProvider` in `server/scripts/media_pipeline/provider_contracts.py` | Cache-first registry ending in `DeterministicPlaceholderGeocodeProvider` by default | Checks `address_cache` first, keeps network/account providers disabled by default, and preserves the existing test/dev placeholder address format `Lat: 58.37763, Lon: 26.72901` |

## Provider-chain rule

Provider chains are executed by `server/scripts/media_pipeline/provider_chain.py`.

The runner:

1. tries providers in configured order;
2. stops on the first `SUCCEEDED` result;
3. keeps `NO_RESULT` and `FAILED` outcomes as sanitized attempt data;
4. returns the final no-result/failure when no provider succeeds;
5. does not fabricate GPS coordinates or real addresses.

## Worker integration

The worker integration remains in `server/scripts/sqlite_admin.py`:

| Worker function | Provider-chain call | Preserved external behavior |
|---|---|---|
| `stage3_process_gps_queue` | `run_gps_provider_chain(...)` | Same queue statuses, DB fields, EXIF parser method, geocode queue insertion |
| `stage4_process_geocode_queue` | `run_reverse_geocode_provider_chain(...)` | Same endpoint-visible behavior, address cache writes, `GEOCODE_FOUND` status; cache hits now stop before placeholder/network providers |

The TypeScript API routes and dashboard do not own provider selection in this version. They continue to call the same backend worker commands.


## Current GPS parsing provider order

The GPS stage now uses these safe local/offline methods in order:

```text
exif
json_sidecar
xmp_sidecar
text_sidecar
filename_coordinates
path_coordinates
```

| Provider ID | Parser method | What it reads | Notes |
|---|---|---|---|
| `exif` | `EXIF` | Embedded image EXIF GPS metadata through Pillow | Preserves the original behavior and remains first. |
| `json_sidecar` | `JSON_SIDECAR` | Adjacent `.json` / `.gps.json` sidecars with explicit latitude/longitude keys | Supports common flat, nested, and GeoJSON-like coordinate objects. |
| `xmp_sidecar` | `XMP_SIDECAR` | Adjacent `.xmp` / `.gps.xmp` sidecars with explicit GPS text tokens | Useful for photo tools that export XMP sidecars. |
| `text_sidecar` | `TEXT_SIDECAR` | Adjacent `.txt` / `.gps.txt` sidecars with `lat` / `lon` tokens | Intended for simple local metadata exports and fixtures. |
| `filename_coordinates` | `FILENAME_COORDINATES` | Explicit coordinate tokens in the media file name | Conservative fallback; does not infer coordinates from unrelated numbers. |
| `path_coordinates` | `PATH_COORDINATES` | Explicit coordinate tokens in parent folder names | Last fallback; useful for album folders named with coordinates. |

These providers do not call external services, do not require credentials, and validate coordinate bounds before returning success. Missing or malformed metadata remains an honest `NO_RESULT`, so the existing queue behavior for files without GPS is preserved.

## v1.0 production placeholder boundary

For v1.0 acceptance, GPS extraction must record a real provider/parser ID from the GPS provider chain or a future documented real metadata provider. Reverse geocoding must use cache-first real-provider evidence. `deterministic_placeholder` and coordinate-echo address strings such as `Lat: 58.37763, Lon: 26.72901` are allowed only for deterministic test/dev flows and must not be accepted as production geocode success.

See `docs/20_architecture_and_specs/openspec/production_gps_geocode_placeholder_rules_openspec.md` for the production GPS/geocode acceptance contract.

## Adding a future GPS provider

Add a Python class with this shape:

```python
class FutureGpsProvider:
    provider_id = "future_provider"

    def parse_gps(self, provider_input):
        return GpsProviderResult.no_result(
            self.provider_id,
            "gps_not_found",
            "No GPS coordinates were found by this provider.",
        )
```

Then add it to the ordered list returned by `default_gps_providers()` after deciding its fallback order.

## Adding a future reverse geocoder

Add a Python class with this shape:

```python
class FutureReverseGeocodeProvider:
    provider_id = "future_geocoder"

    def reverse_geocode(self, provider_input):
        return ReverseGeocodeResult.failed(
            self.provider_id,
            "provider_not_configured",
            "The provider is not configured.",
        )
```

Then register it in `server/scripts/media_pipeline/geocode_provider_registry.py` and place its provider id in `GEOCODE_PROVIDER_ORDER`. Keep network/account providers disabled by default until explicitly configured.


## Current reverse-geocode provider registry

The current registry contains these provider IDs:

```text
address_cache
nominatim_osm
photon_komoot
postcodes_io_uk
pelias_self_hosted
opencage
geoapify
mapbox
google_geocoding
deterministic_placeholder
```

See `docs/20_architecture_and_specs/media_pipeline_geocode_provider_chain.md` for account fields, default enablement, and cache-first rules.

## Rules for future real providers

- Keep frontend/dashboard provider logic out of scope unless the UI is explicitly being changed.
- Preserve Test Mode / Real Mode separation.
- Do not log API keys, tokens, cookies, raw provider credentials, or authorization headers.
- Return provider IDs and sanitized failure codes/messages for observability.
- Do not use placeholder geocoding as a real address provider.
- Keep missing GPS as an honest no-result state.
- Add regression coverage for fallback order whenever a provider is added.
- Treat `deterministic_placeholder` and `Lat: ..., Lon: ...` output as test/dev-only unless a future scope decision explicitly changes v1.0 acceptance.
