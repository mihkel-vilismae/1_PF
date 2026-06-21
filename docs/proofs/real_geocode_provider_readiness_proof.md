# Real geocode provider readiness proof

Introduced: v0.10.4

Command:

```bash
npm run proof:real-geocode-provider-readiness
```

## Purpose

This proof is a secret-safe preflight for `real_gps_geocode` provider work. It checks whether a real reverse-geocode provider is explicitly selected and whether the provider-specific safety configuration is present.

It does **not** call the provider and must not be treated as proof that a coordinate was geocoded.

## Required opt-in

The proof expects these values before it can pass:

```bash
PF_PROOF_ENABLE_REAL_GEOCODE_CHAIN=true
PF_GEOCODE_CHAIN_PROOF_PROVIDER=<supported_provider_id>
```

For public Nominatim, the proof also requires:

```bash
GEOCODE_NOMINATIM_OSM_USER_AGENT=<application/contact identifying user agent>
```

Provider API keys, access tokens, base URLs, contact emails, and user-agent values are never written into proof artifacts. Artifacts only record `[CONFIGURED]` for configured values.

## Provider adapter boundary

Provider readiness is evaluated through `tools/real-geocode-provider-adapter-lib.mjs`. The adapter records:

- supported provider id;
- provider env prefix;
- required provider-specific env keys;
- cache requirement;
- minimum request interval policy;
- attribution requirement;
- redacted configured/missing env status.

## Status rules

| Condition | Status |
|---|---|
| proof opt-in missing | `BLOCKED` |
| provider id missing | `BLOCKED` |
| provider id unsupported | `BLOCKED` |
| required provider-specific safety env missing | `BLOCKED` |
| all readiness/safety checks present | `PASSED` |

## Non-claims

A passed readiness proof does not prove:

- real media GPS extraction;
- a live provider call;
- normalized address output;
- product pipeline integration;
- address overlay display visibility;
- v1 readiness gate closure.
