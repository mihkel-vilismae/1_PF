# Media Pipeline Provider Interfaces

## Status

Version: 0.7.31  
Date: 29.05.2026, 22:02:00 EEST  
Scope: backend-only Python provider foundation for GPS parsing and reverse geocoding.

## Purpose

The media pipeline has separate worker stages for GPS parsing and reverse geocoding. This document defines the provider boundary added around the current Python worker behavior so future providers can be added without changing dashboard UI code or endpoint contracts.

## Current provider modules

| Stage | Contract | Default provider | Current behavior |
|---|---|---|---|
| GPS parsing | `GpsProvider` in `server/scripts/media_pipeline/provider_contracts.py` | `ExifGpsProvider` | Reads embedded EXIF GPS via Pillow and returns parser method `EXIF` |
| Reverse geocoding | `ReverseGeocodeProvider` in `server/scripts/media_pipeline/provider_contracts.py` | `DeterministicPlaceholderGeocodeProvider` | Produces the existing placeholder address format `Lat: 58.37763, Lon: 26.72901` |

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
| `stage4_process_geocode_queue` | `run_reverse_geocode_provider_chain(...)` | Same placeholder provider name, address cache writes, `GEOCODE_FOUND` status |

The TypeScript API routes and dashboard do not own provider selection in this version. They continue to call the same backend worker commands.

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

Then add it to the ordered list returned by `default_reverse_geocode_providers()` after deciding whether it should run before or after the placeholder provider.

## Rules for future real providers

- Keep frontend/dashboard provider logic out of scope unless the UI is explicitly being changed.
- Preserve Test Mode / Real Mode separation.
- Do not log API keys, tokens, cookies, raw provider credentials, or authorization headers.
- Return provider IDs and sanitized failure codes/messages for observability.
- Do not use placeholder geocoding as a real address provider.
- Keep missing GPS as an honest no-result state.
- Add regression coverage for fallback order whenever a provider is added.
