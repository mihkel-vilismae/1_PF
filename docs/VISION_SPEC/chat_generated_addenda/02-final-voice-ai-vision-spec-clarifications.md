# Short Addendum — Final Voice AI Vision/Spec Clarifications

Created: 2026-04-26 20:42 EEST
Status: authoritative addendum to the recent vision/spec Q&A notes.
Purpose: capture the final small set of decisions made after the Raspberry Pi autonomy/runtime failure discussion.

## 1. Remaining Open Items

Most major runtime/autonomy questions have now been answered.

Remaining open items are mostly fine-tuning details, not blocking architecture decisions.

Examples:

```text
stale-lock timeout value
low-disk threshold value
offline check interval
exact notification channels
exact failure behavior per hardware type
```

These can be made configurable later through `.env` or dashboard/admin settings.

## 2. Current Ability to Finalize the Vision Spec

If asked to complete the full vision/spec now, there is enough information to produce a strong consolidated document.

Only minor values or implementation details may still need confirmation, such as exact timeout values, exact polling/check intervals, exact provider list, and exact notification appearance.

The overall system direction is clear: autonomous Raspberry Pi photo-frame runtime after initial setup.

## 3. Implementation Status Documentation Exists / Should Be Used

The documentation set is not only vision-level. It also includes implementation-status documentation.

The key implementation-status source is:

```text
docs/VISION_SPEC/07-current-implementation-spec.md
```

This document should be used to distinguish implemented, partial, planned, unknown, needs verification, and deprecated functionality.

Future consolidated specs should not only describe the target vision. They should also keep an explicit current-state section.

## 4. No Future External Media Integrations for Now

External media integrations should not be planned right now.

Examples explicitly out of scope for now:

```text
new cloud album integrations
additional external media providers
future external media source systems
```

The current focus remains the existing photo-frame pipeline and Raspberry Pi autonomy.

## 5. No Long-Term Archival Plan for Now

Long-term archival planning should not be considered right now.

Examples out of scope:

```text
automatic archival policies
old-media migration strategy
cloud backup/archive system
archive retention lifecycle
```

The system may later need storage safety behavior, but not a full archival strategy at this stage.

## 6. Notification Dashboard Testing / Preview Is Needed Later

Notification customization was not chosen as a major current topic.

However, the dashboard should eventually include a way to test or preview notifications. The purpose is to let the user see how notification messages look visually before relying on them.

Examples:

```text
test notification button
preview warning notification
preview friendly no-new-media notification
preview critical error notification
preview session-expiry warning
```

This should be treated as a future dashboard improvement.

## 7. Dashboard Coverage Gap

The current dashboard view model covers major areas:

```text
View A — Init / setup / verification
View B — Test / controlled pipeline runner
View C — Last Run Info / recovery
View D — Running Process / live runtime
```

But the newer vision/spec decisions suggest at least one missing dashboard capability:

```text
notification testing / notification preview
```

This may fit inside an existing view or become a small diagnostics/admin section later.

## 8. Carry-Forward Decisions

```text
1. Remaining open questions are mostly tuning-level, not architecture-blocking.
2. The full vision/spec can now be consolidated confidently.
3. CURRENT_IMPLEMENTATION_SPEC.md must remain part of future authority because implementation status matters.
4. Do not plan future external media integrations right now.
5. Do not plan long-term archival systems right now.
6. Add future dashboard support for testing/previewing notifications.
7. Treat notification testing/preview as a current dashboard coverage gap.
```
