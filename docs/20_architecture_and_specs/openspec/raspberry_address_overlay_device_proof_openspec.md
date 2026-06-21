# Raspberry address overlay device proof OpenSpec

Status: active planning contract  
Introduced: v0.8.69

## Goal

Define the proof boundary for the v1 requirement that address/location text appears on the Raspberry/device display.

## Contract

The address overlay proof must show:

- native display/playback path observed;
- media item has address text or `unknown` location policy applied;
- overlay rendering is enabled for the native display path;
- operator observation or screenshot/photo evidence exists;
- evidence does not expose private full address unless explicitly allowed.

## Default overlay text

Until A2 is confirmed, the default minimum is city/country or `unknown`.

## Non-claims

- Dashboard-only address text does not satisfy device-display overlay.
- JSON state alone does not prove pixels were visible unless the user later accepts JSON-only evidence.


## v0.10.5 D1-D3 implementation boundary

The first implementation slice for `address_overlay_device_display` adds support proofs without claiming final device visibility.

### D1 marker contract

`proof:address-overlay-proof-marker-contract` creates a unique `PF_ADDR_<run_id>` marker and records the expected readiness-approved overlay text. This marker is the visual token that later screenshot/framebuffer/operator evidence must contain.

### D2 render artifact

`proof:raspberry-address-overlay-template` renders an SVG overlay artifact containing the address text and marker. The artifact is L1/render evidence only and does not prove physical display output.

### D3 display command attempt

`proof:raspberry-address-overlay-display-command` runs only on Raspberry-like targets when `PF_ADDRESS_OVERLAY_DISPLAY_COMMAND` is configured. It passes only when the configured command exits zero, but still records a non-claim that visual evidence is required.

### Readiness boundary

The v1 `address_overlay_device_display` gate must remain blocked until D4-D5 collect and validate visual evidence containing the exact marker. Render-only and display-command-only proofs are insufficient.
