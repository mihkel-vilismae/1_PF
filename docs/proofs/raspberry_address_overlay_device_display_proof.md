# Raspberry address overlay device-display proof

Command:

```bash
npm run proof:raspberry-address-overlay-device-display
```

This proof is an operator/evidence gate for the v1.0 requirement that the Raspberry/device display shows native playback with a visible address overlay. It does not render the overlay by itself.

To pass, provide `PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE` containing JSON with all fields set to `true`:

```json
{
  "native_display_path_observed": true,
  "address_text_present": true,
  "overlay_rendered_on_device": true,
  "operator_observed": true
}
```

The final proof artifact is sanitized before writing.


## v0.10.5 marker/render/display-command support

D1-D3 split the device-display blocker into safer proof layers:

| Layer | Command | Meaning |
|---|---|---|
| D1 marker contract | `npm run proof:address-overlay-proof-marker-contract` | Generates and validates a visible `PF_ADDR_<run_id>` marker. |
| D2 render artifact | `npm run proof:raspberry-address-overlay-template` | Renders an SVG overlay artifact with readiness-approved address text and the marker. |
| D3 display command | `npm run proof:raspberry-address-overlay-display-command` | Attempts the configured Raspberry display command with the rendered artifact. |

D1-D3 are support proofs only. They do not close `address_overlay_device_display`; the final gate still requires visual capture/operator evidence proving the exact marker was visible on the target display.

## Evidence template helper

Generate a non-claiming template:

```bash
npm run proof:raspberry-address-overlay-template
```

Edit the generated JSON only after observing the real Raspberry/device display overlay, then pass it via `PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE`.
