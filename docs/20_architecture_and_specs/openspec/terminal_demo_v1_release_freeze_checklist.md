# Terminal Demo Mode v1.0 Release-Freeze Checklist

Status: v1.0.0 final release gate.

This document freezes the final go/no-go requirements for Terminal Demo Mode v1.0. It is a release confidence checklist, not a feature request. No new terminal-demo runtime behavior is introduced by this milestone.

## Release decision

The final v1.0.0 package is released only when the final release proof reports:

```text
TERMINAL_DEMO_MODE_V1_RELEASED
```

A blocked result is:

```text
NOT_READY_FOR_V1
```

## Non-negotiable boundaries

| Requirement | Required state for v1.0 |
|---|---|
| DEMO-owned media/truth/status/queue/playback | Proven by terminal Demo final proof |
| Real/test data isolation | Demo Mode does not write or consume real/test data paths |
| Cron safety | Terminal Demo Mode does not spawn cron/crontab |
| Mock/real separation | Real-demo adapter cannot masquerade as mock logic |
| Worker execution | Guarded by explicit Demo Mode execution flags |
| Native/fullscreen playback | Remains disabled in terminal Demo Mode |
| Dashboard demo mode boundary | `demo` stays out of legacy real/test-only services |
| Transferable package hygiene | Full Git package is clean and packager helper is tracked |
| Evidence hygiene | Proof artifacts contain logs/status only, not source repo files |

## Final command gate

Run the final proof from a clean extracted package root:

```bash
npm run proof:terminal-demo-v1-release
```

On Windows, run:

```cmd
VERIFY_TERMINAL_DEMO_V1_RELEASE.CMD
```

The final proof collects command logs under:

```text
terminal/demo/runtime_logs/v1_release/
```

It also invokes the release-freeze proof, which writes nested release-freeze evidence under:

```text
terminal/demo/runtime_logs/v1_release_freeze/
```

Both evidence folders are intentionally not source code. They store command logs and JSON/Markdown status reports only.

## Required green checks

The final release proof must verify these gates remain green through the release-freeze proof:

1. `npm run build`
2. `npm run typecheck`
3. `npm run proof:terminal-demo-final`
4. `npm run proof:dashboard-runtime-mode-boundary`
5. `npm run proof:terminal-demo-transferable-package`
6. `npm run proof:terminal-demo-rc-readiness`

The broader POST-ACTIONS-1 handoff should also rerun operator rehearsal and evidence diagnosis directly.

## v1.0 promotion rule

If this checklist and the final release proof pass from the generated package, Terminal Demo Mode v1.0 is released. Future work must start from a post-v1 milestone and must not retroactively change the v1.0 contract.
