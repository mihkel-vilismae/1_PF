# Raspberry address overlay display-command proof

Introduced: v0.10.5

Command:

```bash
npm run proof:raspberry-address-overlay-display-command
```

## Purpose

Defines the D3 display-command attempt proof for `address_overlay_device_display`.

The proof renders an SVG overlay artifact containing readiness-approved address text and a `PF_ADDR_<run_id>` marker, then attempts to run a configured Raspberry display command with that artifact.

## Required environment on Raspberry

```bash
PF_ADDRESS_OVERLAY_DISPLAY_COMMAND='display-command {artifact}'
```

`{artifact}` is replaced with the shell-quoted overlay artifact path. Example commands depend on the target display stack and may be `feh`, `mpv`, a browser/kiosk command, or a project-owned display command.

## Status rules

| Condition | Status |
|---|---|
| not Raspberry/Linux ARM target | `BLOCKED` |
| display command env missing | `BLOCKED` |
| marker/render contract invalid | `BLOCKED` |
| display command exits nonzero | `FAILED` |
| display command exits zero | `PASSED` for display-command attempt only |

## Non-claims

A passed display-command proof does not prove that the marker was visible on the physical display. D4-D5 still need framebuffer/screenshot/operator evidence that contains the exact marker before `address_overlay_device_display` readiness can pass.
