# Raspberry GPS/geocode provider chain OpenSpec

Status: active planning contract  
Introduced: v0.8.69

## Goal

Define the GPS/geocode v1 behavior from clarified matrix answers.

## Decisions

- Real media usually has GPS metadata (`G1=A`).
- OpenStreetMap/Nominatim is the first provider (`G2=A`).
- Missing GPS media remains playable and is marked `unknown` (`G3=C`).

## Contract

The provider chain must:

1. extract GPS metadata when present;
2. mark missing GPS as `unknown` without blocking playback;
3. call Nominatim/OpenStreetMap only when configured and allowed;
4. cache addresses where possible;
5. reject deterministic placeholder output as real provider success;
6. provide proof artifacts for GPS extraction, provider call/cache behavior, and missing-GPS policy.

## Non-claims

- Generated fixture GPS proof is not real iCloud media proof.
- Placeholder geocode is not a real provider proof.
- Network/provider proof remains opt-in and evidence-gated.


## v0.10.4 G1/G2 provider-chain implementation boundary

The first implementation slice for `real_gps_geocode` is intentionally limited to provider readiness and controlled-coordinate provider-chain proof.

### Provider readiness

`proof:real-geocode-provider-readiness` validates explicit operator opt-in, supported provider id, and provider-specific safety configuration. For public Nominatim, `GEOCODE_NOMINATIM_OSM_USER_AGENT` must be configured explicitly. Proof artifacts record only redacted configured/missing env state.

### Provider-chain proof

`proof:real-geocode-provider-chain` validates:

1. explicit opt-in;
2. supported provider adapter;
3. cache-first miss behavior;
4. fallback past a forced no-result proof provider;
5. real provider result;
6. deterministic placeholder rejection;
7. cache hit after provider success;
8. normalized address artifact generation.

### Normalized artifact

The provider-chain proof emits `normalized_real_geocode_address` with `source_level: provider_coordinate_fixture`. This makes the proof useful for later product integration while preventing readiness overclaiming.

### Readiness boundary

G1/G2 must not close `real_gps_geocode` in `raspberry_v1_readiness` by itself. The gate remains blocked until later work proves a real or accepted GPS source and attaches the normalized address to the regular worker product output.

## v0.10.10 G3/G4/G5 product bridge

`proof:real-gps-geocode-product-bridge` connects accepted media GPS evidence to normalized geocode address evidence and structured v2 regular worker product evidence.

Accepted GPS source evidence may come from:

- a redacted real/download manifest item with `gps_evidence`;
- a readiness-approved media GPS evidence file;
- operator-confirmed media GPS metadata;
- a provider coordinate fixture used only as bridge/readiness evidence.

The bridge validates that:

1. the GPS source is explicit and accepted;
2. the normalized geocode address artifact is valid;
3. the normalized address coordinate matches the accepted GPS evidence;
4. raw provider payloads and provider secrets are not included;
5. the generated product evidence marks `gps_status` and `geocode_status` as `present`;
6. overlay readiness may be marked `ready`, but device visibility remains unclaimed.

### Non-claims

This bridge does not prove iCloud authentication, real iCloud download, native playback, or address overlay visibility. Those remain owned by `real_icloud_media_source`, native playback proofs, and `address_overlay_device_display`.


## v0.10.11 GPS/geocode evidence pack helper

`proof:real-gps-geocode-product-bridge-evidence-pack` generates the operator evidence templates, `latest.env`, and next-step report needed to run `proof:real-gps-geocode-product-bridge`. It reports missing GPS/address evidence as `BLOCKED` while still packaging actionable diagnostics.

The helper does not prove iCloud authentication, real iCloud download, native playback, or address overlay visibility. It only prepares or validates the GPS/geocode-to-product bridge evidence inputs.
