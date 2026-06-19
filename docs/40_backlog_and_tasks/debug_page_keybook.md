# Debug Page Keybook

Status: active repo-local keybook seed
Introduced: v0.8.199

## Purpose

This keybook maps Debug page panes, buttons, planned stable UI element IDs, source files, docs, tests, proof commands, reality levels, and non-claims. It is the first place to look before implementing or analyzing Debug page changes.

## Source files

- `dashboard/views/debugView.ts`
- `dashboard/services/debugPageModel.ts`
- `docs/10_runbooks/debug_page_runbook.md`
- `docs/20_architecture_and_specs/openspec/debug_page_openspec.md`
- `tests/debugPageRuntime.test.js`
- `tests/debugPageDocs.test.js`
- `tests/debugPageKeybook.test.js`
- `.codex/skills/debug-page-keybook/SKILL.md`

## Stable ID policy

- Every major Debug page pane/card/container and every Debug button should have a globally unique stable ID.
- The canonical future HTML attribute is `data-ui-element-id`.
- Current v0.8.199 entries are a keybook seed; many IDs are planned until attributes are wired into the UI.
- Future inspect/proof mode should show an `*` corner marker with hover tooltip and click-to-open metadata modal.
- The `*` marker must not trigger the underlying element behavior.

## Entry table

| Stable ID | Type | Label | Current marker | Reality | Non-claim |
|---|---|---|---|---|---|
| `pf.debug.page` | page | Debug Menu | `data-debug-page-route` | real-ui/browser-local-safe | Does not prove real Raspberry/provider/worker/crontab/media/database behavior. |
| `pf.debug.state.pane` | pane | Store and restore state | `data-debug-pane=state` | browser-local/planned-safe | No production runtime state, media, database, or restore target is written. |
| `pf.debug.state.save_button` | button | Save state | `data-debug-action=save-state` | browser-local/fake snapshot preview | Does not create production recovery snapshot. |
| `pf.debug.state.restore_button` | button | Restore state | `data-debug-action=restore-state` | browser-local/blocked preview | Does not mutate production restore target. |
| `pf.debug.playback_test.pane` | pane | Test playback | `data-debug-pane=test-playback` | placeholder/local-ui | Does not start native playback or real workers. |
| `pf.debug.playback_test.run_button` | button | Run | `data-debug-action=test-playback-run` | placeholder/local-ui | Does not start native playback. |
| `pf.debug.playback_test.pause_button` | button | Pause | `data-debug-action=test-playback-pause` | placeholder/local-ui | Does not pause native playback. |
| `pf.debug.playback_test.stop_button` | button | Stop | `data-debug-action=test-playback-stop` | placeholder/local-ui | Does not stop native playback. |
| `pf.debug.media_test.pane` | pane | Add images / process testing | `data-debug-pane=add-images` | browser-local isolated test records | Does not touch production media/database. |
| `pf.debug.media_test.add_images_button` | button | + Add images here | `data-debug-action=add-test-image` | isolated-test-only local record | Does not upload/copy production media. |
| `pf.debug.crontab.pane` | pane | Crontab Setup | `data-debug-pane=crontab` | fake/read-only local crontab surface | Does not read or write system crontab. |
| `pf.debug.crontab.read_button` | button | Read current crontab | `data-debug-action=parse-crontab` | fake/read-only parser | Does not read system crontab. |
| `pf.debug.crontab.pause_button` | button | Pause app-owned entries | `data-debug-action=pause-crontab` | fake/local crontab mutation | Does not write system crontab. |
| `pf.debug.crontab.resume_button` | button | Resume app-owned entries | `data-debug-action=resume-crontab` | fake/local crontab mutation | Does not write system crontab. |
| `pf.debug.crontab.install_button` | button | Install worker crontab intervals | `data-debug-action=install-crontab-pending` | fake/staged local install | Does not install a real crontab. |
| `pf.debug.scheduler_host_mock.pane` | pane | Scheduler Host Mock Status | `data-debug-pane=scheduler-host-mock` | mock-only scheduler host status | Does not start workers or write crontab. |
| `pf.debug.worker_regular.pane` | pane | Regular Worker Debug Pane | `data-debug-worker-pane` | mock/local worker telemetry | Does not spawn regular worker process. |
| `pf.debug.worker_regular.run_button` | button | Run now | `data-debug-worker-run-now` | mock/local run simulation | Does not spawn regular worker process. |
| `pf.debug.worker_playback.pane` | pane | Playback Worker Debug Pane | `data-debug-worker-pane` | mock/local worker telemetry | Does not spawn playback worker process. |
| `pf.debug.worker_playback.run_button` | button | Run now | `data-debug-worker-run-now` | mock/local run simulation | Does not spawn playback worker process. |
| `pf.debug.worker_screen.pane` | pane | On/off Worker Debug Pane | `data-debug-worker-pane` | mock/local worker telemetry | Does not spawn screen/on-off worker process. |
| `pf.debug.worker_screen.run_button` | button | Run now | `data-debug-worker-run-now` | mock/local run simulation | Does not spawn screen/on-off worker process. |
| `pf.debug.help.pane` | planned-pane | Help | `planned:data-ui-element-id` | planned/future | Not implemented in v0.8.199; this keybook records the requirement only. |
| `pf.debug.stack_status.pane` | planned-pane | Stack / Status | `planned:data-ui-element-id` | planned/future | Not implemented in v0.8.199; this keybook records the requirement only. |
| `pf.debug.elements_list.pane` | planned-pane | Elements / Buttons list | `planned:data-ui-element-id` | planned/future | Keybook exists; rendered elist pane is not implemented yet. |
| `pf.debug.auth_session.pane` | planned-pane | Auth / Session | `planned:data-ui-element-id` | planned/future | NEW AUTH controls exist elsewhere; Debug page Auth/Session pane is not implemented yet. |

## Proof

Run:

```bash
npm run proof:debug-page-keybook
```

This proof checks that keybook IDs are unique, referenced files exist, proof commands exist in `package.json`, and current implemented markers are present in Debug page source files.
