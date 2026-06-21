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
