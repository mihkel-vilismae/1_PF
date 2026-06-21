# Address overlay proof marker contract proof

Introduced: v0.10.5

Command:

```bash
npm run proof:address-overlay-proof-marker-contract
```

## Purpose

Defines the D1 marker contract for `address_overlay_device_display` evidence.

The proof creates a unique visible marker in this shape:

```text
PF_ADDR_<run_id>
```

The marker is included in the overlay text so later render, display-command, screenshot, framebuffer, or operator-photo evidence can be tied to the exact proof run.

## Inputs

Optional environment variables:

```bash
PF_ADDRESS_OVERLAY_PROOF_RUN_ID=<safe_run_id>
PF_ADDRESS_OVERLAY_PROOF_ADDRESS_TEXT="Tartu, Estonia"
PF_ADDRESS_OVERLAY_PROOF_SECONDARY_TEXT="PF_ADDR_<run_id>"
PF_ADDRESS_OVERLAY_SOURCE_KIND=readiness_approved_address
```

If no address is supplied, the proof uses readiness-approved address text and records that source kind. This does not claim real GPS/geocode product data.

## Pass criteria

- `run_id` exists;
- marker matches `PF_ADDR_<run_id>`;
- primary address line exists;
- secondary line includes the marker;
- proof evidence records non-claims.

## Non-claims

This proof does not render pixels, execute a Raspberry display path, validate visual evidence, prove real GPS/geocode, or close the v1 display readiness gate.
