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
