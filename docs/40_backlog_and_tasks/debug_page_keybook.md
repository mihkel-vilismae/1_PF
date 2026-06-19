# Debug Page Keybook

Status: active runtime Debug page keybook for v0.8.200.

This keybook maps Debug page panes/buttons/stable IDs to source files, docs, tests, proof commands, reality level, and non-claims.

## Runtime element-ID rule

- Every implemented Debug pane/card and button listed here has a stable `data-ui-element-id`.
- Inspectable panes/buttons have a small `*` marker. Hover shows the stable ID; click opens a local metadata modal and must not trigger the underlying action.
- The Debug page remains browser-local/proof-safe unless a later backend/provider contract explicitly says otherwise.

## Elements and buttons

| ID | Type | Label | Marker | Reality | Non-claim |
|---|---|---|---|---|---|
| `pf.debug.page` | page | Debug Menu | `data-debug-page-route=/debug` | browser-local/planned-safe | Does not prove backend/provider/worker/crontab/media/database behavior. |
| `pf.debug.help.pane` | pane | Help | `data-debug-pane=help` | browser-local/help | Explains boundaries only; no production action. |
| `pf.debug.stack_status.pane` | pane | Stack / Status | `data-debug-pane=stack-status` | browser-local/status summary | Shows declared frontend/runtime proof context only. |
| `pf.debug.elements_list.pane` | pane | Elements / Buttons list | `data-debug-pane=elements-list` | browser-local/keybook projection | Lists element IDs; does not prove real runtime behavior. |
| `pf.debug.auth_session.pane` | pane | Auth / Session | `data-debug-pane=auth-session` | planned-safe/auth bridge | Does not submit credentials or read session secrets. |
| `pf.debug.auth_session.login_using_env_button` | button | Login using .env values | `data-debug-auth-action=planned` | disabled/planned-safe | Shown as planned bridge only; does not trigger provider login from Debug page. |
| `pf.debug.auth_session.check_login_button` | button | Check login | `data-debug-auth-action=planned` | disabled/planned-safe | Shown as planned bridge only; does not inspect session contents. |
| `pf.debug.auth_session.verify_provider_button` | button | Verify provider session | `data-debug-auth-action=planned` | disabled/planned-safe | Shown as planned bridge only; does not copy cookies or tokens. |
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
| `pf.debug.worker_regular.pane` | pane | Regular Worker Debug Pane | `data-debug-worker-pane=regular` | mock/local worker telemetry | Does not spawn regular worker process. |
| `pf.debug.worker_regular.run_button` | button | Run now | `data-debug-worker-run-now=regular` | mock/local run simulation | Does not spawn regular worker process. |
| `pf.debug.worker_playback.pane` | pane | Playback Worker Debug Pane | `data-debug-worker-pane=playback` | mock/local worker telemetry | Does not spawn playback worker process. |
| `pf.debug.worker_playback.run_button` | button | Run now | `data-debug-worker-run-now=playback` | mock/local run simulation | Does not spawn playback worker process. |
| `pf.debug.worker_screen.pane` | pane | On/off Worker Debug Pane | `data-debug-worker-pane=screen` | mock/local worker telemetry | Does not spawn screen/on-off worker process. |
| `pf.debug.worker_screen.run_button` | button | Run now | `data-debug-worker-run-now=screen` | mock/local run simulation | Does not spawn screen/on-off worker process. |
| `pf.debug.element_id_modal` | modal | Element ID modal | `data-debug-element-modal` | browser-local inspector | Only displays metadata; does not trigger underlying element behavior. |

## Proof

Run:

```bash
npm run proof:debug-page-keybook
```

This proof checks unique IDs, repo references, rendered-ID source markers, the asterisk marker contract, and the element metadata modal contract.
