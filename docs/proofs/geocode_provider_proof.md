# Real geocode provider proof

This proof is for real reverse-geocode providers behind the existing cache-first provider chain. It must not treat deterministic placeholder output as production geocoding proof.

After preparing a queue row with GPS coordinates and enabling exactly one provider in `.env`, run:

```bash
PF_PROOF_ENABLE_REAL_GEOCODE=true PF_GEOCODE_PROOF_PROVIDER=nominatim_osm PF_API_BASE_URL=http://127.0.0.1:8787 node tools/run-geocode-provider-proof.mjs
```

Output is written under ignored `runtime_data/proofs/geocode_provider_<timestamp>.json`.

The expected provider ID must be observed. `deterministic_placeholder` alone is `PARTIAL`, not `PASSED`. API keys, tokens, accounts, and private coordinates must be redacted.


## v1.0 production acceptance

For v1.0, this proof or its successor must show real GPS/geocode provider evidence and must not pass on placeholder behavior. Production geocode acceptance requires:

- `GEOCODE_ALLOW_PLACEHOLDER_FALLBACK=false` or equivalent evidence.
- a real provider ID, not `deterministic_placeholder`.
- address text that is not shaped like `Lat: ..., Lon: ...`.
- cache miss before provider call and cache hit after provider result.
- sanitized artifact output with no API keys, tokens, cookies, raw headers, or raw provider payloads.

See `docs/20_architecture_and_specs/openspec/production_gps_geocode_placeholder_rules_openspec.md`.
