# Terminal Demo Mode v1.0 Release-Freeze Checklist

Status: v0.18.0 release-freeze gate.

This document freezes the final go/no-go requirements for Terminal Demo Mode v1.0. It is a release confidence checklist, not a feature request. No new terminal-demo runtime behavior is introduced by this milestone.

## Release decision

A package may be promoted toward `v1.0.0` only when the final release-freeze proof reports:

```text
V1_READY_TO_RELEASE
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

Run from a clean extracted package root:

```bash
npm run proof:terminal-demo-v1-release-freeze
```

On Windows, run:

```cmd
VERIFY_TERMINAL_DEMO_V1_RELEASE_FREEZE.CMD
```

The proof collects command logs under:

```text
terminal/demo/runtime_logs/v1_release_freeze/
```

The release-freeze evidence folder is intentionally not source code. It stores command logs and JSON/Markdown status reports only.

## Required green checks

The release-freeze proof must verify these gates remain green:

1. `npm run build`
2. `npm run typecheck`
3. `npm run proof:terminal-demo-final`
4. `npm run proof:dashboard-runtime-mode-boundary`
5. `npm run proof:terminal-demo-transferable-package`
6. `npm run proof:terminal-demo-rc-readiness`

The broader POST-ACTIONS-1 handoff should also rerun operator rehearsal and evidence diagnosis directly.

## v1.0 promotion rule

If this checklist and the release-freeze proof pass from the generated package, the next milestone should be `v1.0.0` release-only: version/docs/package finalization, no terminal-demo runtime behavior change.
