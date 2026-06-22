# Address Display Proof

## Purpose

This deterministic proof verifies that, when a usable resolved address exists, that enrichment reaches the playback payload used by the dashboard/native playback surfaces. It runs the local SQLite pipeline helpers from GPS sidecar parsing through geocoding, queue preparation, playback selection, and playback contract generation.

## Command

```bash
npm run proof:address-display
```

## What it proves

The proof creates temporary local media and database artifacts, then verifies:

1. GPS coordinates are parsed from a JSON sidecar.
2. The deterministic geocode provider writes `address_text` into `canonical_media_assets`.
3. Stage 5 queues only an address-ready `GEOCODE_FOUND` asset.
4. Stage 6 selection returns `selected.addressText`.
5. `playback_contract` exposes `currentItem.resolvedAddress` and `currentItem.hasResolvedAddress`.

This proof uses an address-ready fixture path. It does not claim that missing GPS or unresolved address blocks playback for otherwise playable media.

## Safety and boundaries

- The proof is deterministic and local.
- It does not use iCloudPD.
- It does not call a network geocode provider.
- It does not start browser UI, fullscreen playback, Raspberry hardware, or native players.
- Runtime proof JSON is written under ignored `runtime_data/proofs/`.

## Pass criteria

The proof passes when the expected address string appears both in the Stage 6 selected payload and the current playback contract item.

## Limitations

This proof uses the current deterministic placeholder geocoder, so it proves address propagation through repository contracts rather than production-quality human address resolution. It must not count as v1.0 production geocoding acceptance. A separate real geocode provider proof is required, with `deterministic_placeholder` disabled/rejected and cache-first real-provider evidence recorded. Missing GPS or unresolved address remains optional enrichment outside this proof, and any address overlay visibility claim still requires a separate device-display proof.
