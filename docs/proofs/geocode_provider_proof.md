# Real geocode provider proof

This proof is for real reverse-geocode providers behind the existing cache-first provider chain. It must not treat deterministic placeholder output as production geocoding proof.

After preparing a queue row with GPS coordinates and enabling exactly one provider in `.env`, run:

```bash
PF_PROOF_ENABLE_REAL_GEOCODE=true PF_GEOCODE_PROOF_PROVIDER=nominatim_osm PF_API_BASE_URL=http://127.0.0.1:8787 node tools/run-geocode-provider-proof.mjs
```

Output is written under ignored `runtime_data/proofs/geocode_provider_<timestamp>.json`.

The expected provider ID must be observed. `deterministic_placeholder` alone is `PARTIAL`, not `PASSED`. API keys, tokens, accounts, and private coordinates must be redacted.
