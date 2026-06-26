# V2 Operator Menu Center Panel Original Items OpenSpec

Status: OpenSpec / original-design coverage only  
Version introduced: v0.10.23  
Baseline lineage: v0.10.22 V2 operator left-sidebar OpenSpec  
Scope: center-panel child item structure for the six V2 operator routes  
Implementation status: not implemented by this document  

## 1. Purpose

This OpenSpec captures the original center-panel/sub-item design for the PF_login / PhotoFrame V2 operator menu.

The previous V2 sidebar OpenSpec freezes the left sidebar to exactly six top-level routes. This document covers the next layer: what the selected route may show inside the center panel.

This is intentionally the **original draft coverage**. It is expected to change later. Any later rewrite should supersede this document explicitly rather than silently mutating implementation behavior.

## 2. Non-goals

This OpenSpec does not implement UI behavior, backend calls, real actions, route changes, worker changes, auth changes, database changes, crontab writes, log deletion, snapshot restore, or runtime state mutation.

This OpenSpec does not fully design visual styling. It defines semantic placement and safety classification for original center-panel child items.

## 3. Required relationship to the left sidebar

The left sidebar remains exactly six route rows:

| Order | Label | Route key |
|---:|---|---|
| `01` | `setup.sh` | `setup` |
| `02` | `authentication.sh` | `authentication` |
| `03` | `startup.sh` | `startup` |
| `04` | `workers` | `workers` |
| `05` | `troubleshooting` | `troubleshooting` |
| `06` | `recovery` | `recovery` |

Center-panel child items must not be promoted into sidebar routes. The sidebar answers "which major operator area am I in?" The center panel answers "what can I inspect, configure, or safely request within that area?"

## 4. Allowed original center-panel block types

The original design uses typed blocks instead of generic recursive nested menu rows.

| Type | Meaning |
|---|---|
| `infoPanel` | explanatory text, warnings, scope notes, policy text |
| `statusCard` | read-only current state or runtime/status summary |
| `actionList` | grouped action buttons/rows, safe or guarded depending on item risk |
| `sectionGroup` | named group containing related status/actions/settings |
| `toggleRow` | one enabled/disabled row |
| `toggleGroup` | grouped toggle rows |
| `multiComboRow` | linked selector row, such as worker type plus schedule |
| `stageTable` | repeated regular-worker stage layout |
| `snapshotViewer` | read-only structured current or backup snapshot display |
| `snapshotList` | list/table of stored snapshots |
| `futurePlaceholder` | visible disabled future/v3 item |
| `exampleList` | diagnostic scenario seeds, not executable actions |

Any child item that does not map to one of these types must be classified before implementation. Do not render unknown children as default navigation rows.

## 5. Page contract: `01 setup.sh`

### Intent

`setup.sh` is a small V2 preflight/orchestration page only. Full dependency installation is a V3 milestone unless explicitly approved later.

### Original center-panel blocks

| Block type | ID | Title/label | Interaction | Risk | Notes |
|---|---|---|---|---|---|
| `infoPanel` | `01.info` | Setup scope | read-only | safe | Explains that V2 setup is preflight/orchestration only. |
| `actionList` | `01.actions` | Setup actions | action | safe | Contains the planned-safe `setup.sh` preflight/orchestration action row. |

### Original child rows

| ID | Label | Block type | Interaction | Status | Risk |
|---|---|---|---|---|---|
| `01.01` | `setup.sh` | `actionList` | action | planned-safe | safe |

## 6. Page contract: `02 authentication.sh`

### Intent

`authentication.sh` owns the local iCloudPD login/session workflow. It must be secret-safe and isolated from environment editing, DB, crontab, workers, troubleshooting, and recovery.

### Original center-panel blocks

| Block type | ID/key | Title/label | Interaction | Risk | Notes |
|---|---|---|---|---|---|
| `infoPanel` | `02.info` | Local-only authentication | read-only | localSecretSensitive | Credentials, 2FA, cookies, and session secrets stay local. |
| `statusCard` | `icloudpdSessionStatus` | iCloudPD session status | read-only | localSecretSensitive | Must show only redacted/safe status. |
| `actionList` | `02.actions` | Authentication actions | action | localSecretSensitive | Contains the planned-safe login/session workflow action row. |

### Original child rows

| ID | Label | Block type | Interaction | Status | Risk |
|---|---|---|---|---|---|
| `02.01` | `authentication.sh` | `actionList` | action | planned-safe | localSecretSensitive |

### Secret-safety rule

No implementation may display raw credentials, raw 2FA values, raw cookies, raw session contents, or secret-bearing paths unless an existing redaction contract proves the output is safe.

## 7. Page contract: `03 startup.sh`

### Intent

`startup.sh` owns runtime prerequisites grouped into environment variables, database, and crontab.

### Original center-panel blocks

| Block type | ID | Title | Notes |
|---|---|---|---|
| `sectionGroup` | `03.01` | `.env / environment variables` | Environment verification and editor launch path. |
| `sectionGroup` | `03.02` | `database` | DB verification, backup, and guarded recreation. |
| `sectionGroup` | `03.03` | `crontab` | Current crontab inspection and guarded crontab installation/custom worker scheduling. |

### `.env / environment variables` child rows

| ID | Label | Block type | Interaction | Status | Risk | Notes |
|---|---|---|---|---|---|---|
| `03.01.01` | `verify.env` | `sectionGroup` item | action | planned-safe | safe | Verify environment state. |
| `03.01.02` | `open .env in text editor` | `sectionGroup` item | action | planned-safe | guarded | If `.env` does not exist, create it from defaults/example values; if defaults are missing, show a non-crashing error. |

### `database` child rows

| ID | Label | Block type | Interaction | Status | Risk | Notes |
|---|---|---|---|---|---|---|
| `03.02.01` | `verify DB` | `sectionGroup` item | action | planned-safe | safe | Verify DB state. |
| `03.02.02` | `recreate DB` | `sectionGroup` item | guardedAction | planned-safe | destructive | Must be guarded. |
| `03.02.03` | `backup DB` | `sectionGroup` item | action | v2 enabled | safe | Initial format can be a simple SQL dump. |

### `crontab` child rows

| ID | Label | Block type | Interaction | Status | Risk | Notes |
|---|---|---|---|---|---|---|
| `03.03.01` | `verify crontab` | `sectionGroup` item | action | planned-safe | safe | Read/check crontab state. |
| `03.03.02` | `print/output current crontab` | `sectionGroup` item | action | planned-safe | safe | Read-only output. |
| `03.03.03` | `install default crontab` | `sectionGroup` item | guardedAction | planned-safe | guarded | Writes crontab; must be guarded. |
| `03.03.04` | `go to crontab page / show additional options` | `futurePlaceholder` | disabledPlaceholder | planned/future | future | Marked `*DEV`; not a normal operator path in this slice. |
| `03.03.05` | `current system time` | `statusCard`/status row | readOnly | planned-safe | safe | Display current system time. |
| `03.03.06` | `installed crontab` | `statusCard`/status row | readOnly | planned-safe | safe | Display installed crontab summary. |
| `03.03.07` | `install custom worker` | `multiComboRow` | guardedAction | planned-safe | guarded | Special row; not a submenu. |

### `install custom worker` multi-combo row

`03.03.07 install custom worker` must be rendered as a `multiComboRow`, not as a nested menu.

Recommended original shape:

```text
[Worker type selector] [Schedule selector] [Preview] [Install]
```

Worker type options:

| ID | Label |
|---|---|
| `03.03.07.01` | regular worker |
| `03.03.07.02` | playback worker |
| `03.03.07.03` | screen on-off worker |

Schedule options:

| ID | Label |
|---|---|
| `03.03.07.04` | every 1 minute |
| `03.03.07.05` | every 5 minutes |
| `03.03.07.06` | at the start of each hour |
| `03.03.07.07` | every day at 13:00:00 Estonian time |

The install operation writes crontab and therefore must be previewable and guarded.

## 8. Page contract: `04 workers`

### Intent

`workers` owns live worker status and controls for regular worker, playback worker, and screen-on-off worker. A rich statistics page remains V3.

### Original center-panel blocks

| Block type | ID | Title/key | Notes |
|---|---|---|---|
| `statusCard` | `04.01` | all workers current status | Summary of regular, playback, and screen-on-off worker status. |
| `stageTable` | `04.02` | regular worker | Current status plus repeated stage rows. |
| `statusCard` | `04.03` | playback worker | Playback status and current media. |
| `toggleGroup` | `04.04` | screen on-off worker | Current status plus mouse/keyboard/PIR toggles. |
| `futurePlaceholder` | `04.05` | statistics page | V3; V2 may collect statistics but rich statistics UI is not active. |

### Overall worker status

| ID | Label | Block type | Interaction | Risk | Notes |
|---|---|---|---|---|---|
| `04.01` | `current status` | `statusCard` | readOnly | safe | Shows regular worker, playback worker, and screen-on-off worker status. |

### Regular worker rows

| ID | Label | Block type | Interaction | Risk | Notes |
|---|---|---|---|---|---|
| `04.02.01` | `current status` | `statusCard`/stage header | readOnly | safe | Shows active stage, Estonia datetime, and automatic/manual call type. |
| `04.02.02` | `enable all` | `actionList`/stage control | action | guarded | Enables all regular-worker stage controls if implemented. |
| `04.02.03` | `disable all` | `actionList`/stage control | action | guarded | Disables all regular-worker stage controls if implemented. |
| `04.02.04` | `download` | `stageTable` stage | mixed | safe | Stage row. |
| `04.02.05` | `index` | `stageTable` stage | mixed | safe | Stage row. |
| `04.02.06` | `parse files for GPS` | `stageTable` stage | mixed | safe | Stage row. |
| `04.02.07` | `geocode` | `stageTable` stage | mixed | safe | Stage row. |
| `04.02.08` | `enqueue playback` | `stageTable` stage | mixed | safe | Stage row. |

Every stage row owns:

| Child concept | Rendering | Status | Rule |
|---|---|---|---|
| `batch size` | stage setting/input/display | v2 visual/planned | Not a route. |
| `show statistics for this stage` | `futurePlaceholder` inside stage row | v3 | Disabled/future; not active V2 feature. |

### Playback worker rows

| ID | Label | Block type | Interaction | Risk | Notes |
|---|---|---|---|---|---|
| `04.03.01` | `current status` | `statusCard` | readOnly | safe | Hover/enter may reveal current file, full filename, GPS coordinates, and parsed address using safe display rules. |
| `04.03.02` | `current image / video` | `statusCard`/viewer | readOnly | safe | Shows current media surface. |

### Screen-on-off worker rows

| ID | Label | Block type | Interaction | Risk | Notes |
|---|---|---|---|---|---|
| `04.04.01` | `current status` | `statusCard` | readOnly | safe | Shows screen-on-off worker state. |
| `04.04.02` | `enable all` | `actionList`/toggle group control | action | guarded | Enables all screen-on-off controls if implemented. |
| `04.04.03` | `disable all` | `actionList`/toggle group control | action | guarded | Disables all screen-on-off controls if implemented. |
| `04.04.04` | `mouse` | `toggleRow` | toggle | guarded | Hover shows enabled/disabled; Enter toggles only if implemented with guard rules. |
| `04.04.05` | `keyboard` | `toggleRow` | toggle | guarded | Hover shows enabled/disabled; Enter toggles only if implemented with guard rules. |
| `04.04.06` | `PIR sensor` | `toggleRow` | toggle | guarded | Hover shows enabled/disabled; Enter toggles only if implemented with guard rules. |

### Statistics placeholder

| ID | Label | Block type | Interaction | Status | Risk |
|---|---|---|---|---|---|
| `04.05` | `statistics page` | `futurePlaceholder` | disabledPlaceholder | v3 | future |

## 9. Page contract: `05 troubleshooting`

### Intent

`troubleshooting` owns diagnostics, logs, stale locks, health snapshots, cron/service checks, and examples. It must distinguish real/manual troubleshooting actions from `*EX` example/rule seeds.

### Original center-panel blocks

| Block type | ID | Title | Notes |
|---|---|---|---|
| `actionList` | `05.01` | manual troubleshooting actions | Safe and guarded manual diagnostic actions. |
| `infoPanel` | `05.02` | logging | Page-specific/global/full/high-importance logging model. |
| `infoPanel` | `05.03` | log handling | Conditional actions from measurable rules. |
| `infoPanel` | `05.04` | error logging | Page-specific and global error logging model. |
| `infoPanel` | `05.05` | error handling | Outer-layer catch/log expectations. |
| `exampleList` | `05.06` | examples | `*EX` scenario seeds, not actions. |

### Manual troubleshooting action rows

| ID | Label | Block type | Interaction | Status | Risk |
|---|---|---|---|---|---|
| `05.01.01` | open default logging folder | `actionList` | action | planned-safe | safe |
| `05.01.02` | mark this point in logs with a very distinct entry | `actionList` | action | planned-safe | safe |
| `05.01.03` | export logs between marked points | `actionList` | action | planned-safe | safe |
| `05.01.04` | find stale locks | `actionList` | action | planned-safe | safe |
| `05.01.05` | clear stale locks | `actionList` | guardedAction | planned-safe | guarded |
| `05.01.06` | show latest worker status files | `actionList` | action | planned-safe | safe |
| `05.01.07` | test log write permissions | `actionList` | action | planned-safe | safe |
| `05.01.08` | export troubleshooting bundle | `actionList` | action | planned-safe | safe |
| `05.01.09` | show system health snapshot | `statusCard`/`actionList` | action | planned-safe | safe |
| `05.01.10` | check cron/service status | `actionList` | action | planned-safe | safe |
| `05.01.11` | backup current logs | `actionList` | action | planned-safe | safe |
| `05.01.12` | clear current logs | `actionList` | guardedAction | planned-safe | destructive |

### Logging/error information panels

| ID | Label | Block type | Interaction | Rule |
|---|---|---|---|---|
| `05.02` | logging | `infoPanel` | readOnly | Describes page-specific logs, global log, full verbose log, and high-importance regular log. |
| `05.03` | log handling | `infoPanel` | readOnly | Conditional handling should come from measurable rules, not only thrown errors. |
| `05.04` | error logging | `infoPanel` | readOnly | Describes page-specific error logs, combined/global error log, and high-priority global error log. |
| `05.05` | error handling | `infoPanel` | readOnly | Final outer layer should catch/log unhandled errors before exit when possible. |

### `*EX` examples

The following are original diagnostic scenario seeds. They must render as `exampleList` items, not executable actions.

| ID | Example |
|---|---|
| `05.06.01` | less than 1 GB of storage left |
| `05.06.02` | less than 100 MB of storage left |
| `05.06.03` | less than 10 MB of storage left |
| `05.06.04` | RAM usage 95%+ for 1 minute |
| `05.06.05` | RAM usage 95%+ for 5 minutes |
| `05.06.06` | RAM usage 95%+ for 10 minutes |
| `05.06.07` | CPU usage/load 95%+ for 1 minute |
| `05.06.08` | CPU usage/load 95%+ for 5 minutes |
| `05.06.09` | CPU usage/load 95%+ for 10 minutes |
| `05.06.10` | network usage is consistently high |
| `05.06.11` | network usage is high normally and becomes very high when data-transfer stages run |
| `05.06.12` | network usage suggests something else may be running in the background outside this app |
| `05.06.13` | system temperature above threshold for 1 minute |
| `05.06.14` | system temperature above threshold for 5 minutes |
| `05.06.15` | system temperature above threshold for 10 minutes |

Before any example can become a real action/check, it needs: measurable condition, threshold, duration, recommended handling, log output, proof/evidence output, and operator-facing documentation.

## 10. Page contract: `06 recovery`

### Intent

`recovery` owns snapshot inspection, backup snapshot inspection, saving snapshots, restoring snapshots, and stored snapshot lists. Read-only inspection should be easy. Restore must be guarded.

### Original center-panel blocks

| Block type | ID | Title/label | Interaction | Risk | Notes |
|---|---|---|---|---|---|
| `statusCard` | `06.01` | snapshot metadata | readOnly | safe | Shows latest snapshot time and other snapshot metadata. |
| `infoPanel` | `06.02` | current backup snapshot generation policy | readOnly | safe | Human-readable policy text; policy changes may involve AI later. |
| `snapshotViewer` | `06.03` | current snapshot | readOnly | safe | Human-readable structure, raw fields, JSON-like values. |
| `snapshotViewer` | `06.04` | current backup snapshot | readOnly | safe | Latest saved backup snapshot for inspection before restore. |
| `actionList` | `06.actions` | snapshot actions | mixed | guarded/destructive | Save and restore actions. |
| `snapshotList` | `06.07` | currently stored backup snapshots | readOnly/select | safe | Stored backup snapshot list with protocol/compatibility later. |

### Recovery action rows

| ID | Label | Block type | Interaction | Status | Risk | Notes |
|---|---|---|---|---|---|---|
| `06.05` | save state snapshot | `actionList` | guardedAction/action | v2 visual | guarded | Creates a persistent snapshot later; visual-only in this slice unless explicitly implemented. |
| `06.06` | restore state snapshot | `actionList` | guardedAction | v2 visual | destructive | Must require selection, confirmation, compatibility check, and before/after summary before real implementation. |

## 11. Guarded action classification

The following original center-panel items are guarded or destructive by default:

| Item | Required treatment |
|---|---|
| `03.02.02 recreate DB` | guarded/destructive |
| `03.03.03 install default crontab` | guarded write |
| `03.03.07 install custom worker` | guarded crontab write with preview |
| `05.01.05 clear stale locks` | guarded |
| `05.01.12 clear current logs` | guarded/destructive |
| `06.05 save state snapshot` | guarded/persistent mutation |
| `06.06 restore state snapshot` | guarded/destructive |

Guarded means at minimum: visually marked risk, explicit operator intent, non-accidental trigger, and no one-click destructive default.

## 12. Future/V3 classification

The following items are future placeholders in the original design:

| Item | Required treatment |
|---|---|
| `04.02.* show statistics for this stage` | V3 disabled/future placeholder |
| `04.05 statistics page` | V3 disabled/future placeholder |
| `03.03.04 go to crontab page / show additional options` | developer/future placeholder unless explicitly implemented |

V3 placeholders may be visible, but they must not behave as finished V2 features.

## 13. Acceptance checks for this OpenSpec slice

A future implementation should add checks proving:

1. All center-panel child items for the six routes are declared in a typed model before rendering.
2. No child item is rendered as a top-level left-sidebar route.
3. Every declared center-panel item has an allowed block type.
4. Guarded/destructive items are not rendered as unguarded one-click actions.
5. V3/future items are disabled or clearly marked as future placeholders.
6. `*EX` troubleshooting examples are rendered as example/rule seeds, not buttons.
7. `install custom worker` is represented as a `multiComboRow`, not nested route rows.
8. Regular-worker stages are represented as a `stageTable` or equivalent repeated stage layout, not nested navigation.

## 14. Original implementation prompt

```text
Implement the PF_login / PhotoFrame V2 operator menu center panel from the OpenSpec model. Preserve the six-route left sidebar. Render selected-route children inside the center panel as typed blocks, not as recursive sidebar menu rows. Treat setup as preflight-only, authentication as local/secret-safe, startup as env/database/crontab section groups, workers as status cards/stage table/toggle group/future statistics placeholder, troubleshooting as action list plus info panels plus non-action examples, and recovery as snapshot metadata/viewers/list plus guarded snapshot actions. Do not wire real destructive actions unless existing backend contracts and guard flows prove them safe.
```

## 15. Snapshot conclusion

This document records the original center-panel item design so it can be compared against later changes. It is not a final UI design and not a runtime implementation claim.
