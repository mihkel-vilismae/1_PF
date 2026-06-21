# Raspberry address overlay device-evidence proof

Introduced: v0.10.6

Command:

```bash
npm run proof:raspberry-address-overlay-device-evidence
```

## Purpose

Validates the D4 visual evidence package for `address_overlay_device_display` without using OCR or automatic pixel inspection.

The proof accepts structured/operator-safe metadata that links a visual evidence artifact to the expected `PF_ADDR_<run_id>` marker.

## Evidence file

Provide the evidence file with:

```bash
PF_RASPBERRY_ADDRESS_OVERLAY_EVIDENCE_FILE=/path/to/address_overlay_evidence.json
```

The evidence may describe one of these kinds:

```text
framebuffer_capture
screenshot
mpv_screenshot
browser_capture
operator_photo
```

## Required visual evidence fields

```json
{
  "overlay_marker": "PF_ADDR_20260621_194034",
  "native_display_path_observed": true,
  "address_text_present": true,
  "overlay_rendered_on_device": true,
  "operator_observed": true,
  "marker_visible_in_device_evidence": true,
  "visual_evidence": {
    "kind": "operator_photo",
    "artifact_sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "artifact_path_redacted": true,
    "expected_marker": "PF_ADDR_20260621_194034",
    "observed_marker": "PF_ADDR_20260621_194034",
    "marker_validation": "matched",
    "operator_confirmation": true
  }
}
```

## Status rules

| Condition | Status |
|---|---|
| evidence file missing | `BLOCKED` |
| unsupported evidence kind | `FAILED` |
| missing/invalid SHA-256 artifact hash | `FAILED` |
| expected marker does not equal overlay marker | `FAILED` |
| observed marker does not equal expected marker | `FAILED` |
| marker validation is not `matched` | `FAILED` |
| operator photo without confirmation | `FAILED` |
| valid marker-linked evidence metadata | `PASSED` |

## Non-claims

This proof does not run OCR, inspect pixels automatically, prove real GPS/geocode source, or by itself prove the display gate on Raspberry. The final device-display proof must also run on Raspberry and evaluate the same matched marker evidence.
