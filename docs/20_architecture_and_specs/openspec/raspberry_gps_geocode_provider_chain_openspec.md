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
