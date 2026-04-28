# VOICE AI AUTHORITATIVE SPEC - MERGED (2026-04-22)

This merged document preserves all information from both source documents.

## Source 1
Path: C:\Users\mihke\Downloads\VOICE_AI_AUTHORITATIVE_SPEC_2026-04-22.md

# Authoritative Voice AI Implementation Overview

**Date captured:** 2026-04-22  
**Source basis:** User decisions and requirements stated during the Voice AI conversation in this chat.  
**Authority level:** Treat this document as an authoritative implementation reference for the discussed behavior unless the user explicitly overrides part of it later.  
**Primary purpose:** Convert the spoken decisions into a clear, implementation-useful specification covering scheduler behavior, test-view behavior, environment isolation, stage execution, playback testing, and screen activity testing.

**Conflict-resolution note (current manual cleanup):** In this manual reconciliation session, the user's explicit issue-by-issue decisions are the effective authority. If any new unresolved conflict appears later between Source 1 and Source 2 text, default tie-breaker is Source 2 unless the user says otherwise.

---

# 1. Core Intent of This Document

This document captures what the user wants the system to do, based on the Voice AI conversation.

The goal is **not** to preserve the current mixed state of the repository UI as-is. The goal is to capture the **intended authoritative behavior** that the user described for:

- View A scheduler actions
- View B test-stage actions
- test-vs-real environment separation
- stage execution rules
- test playback behavior
- screen activity / inactivity testing behavior

This document should be treated as a specification for future implementation, cleanup, correction, or validation work.

---

# 2. Global Architecture and Environment Rules

## 2.1 Real environment and test environment must be fully separated

The user explicitly wants the testing workflow to be isolated from the real workflow.

That means:

- the **real process** must use its own real paths
- the **test process** must use its own test paths
- the **test database** must be separate from the real database
- the **test download folder** must be separate from the real download folder
- test runs must not interrupt, overwrite, corrupt, or mix with the real process
- if the real process is running, paused, or otherwise in use, the testing environment must still remain logically separate from it

### Required principle

The real workflow and the test workflow must behave as two distinct environments.

---

## 2.2 `.env` must contain separate test paths

The user wants dedicated test paths added to the `.env`.

At minimum, the test environment should have distinct configuration entries for:

- test database path
- test download path
- any other stage-relevant test paths needed by the pipeline

### Validation requirement

When `.env` verification is run, it must verify that:

- the real paths exist or are valid where appropriate
- the test paths exist or are valid where appropriate
- the real paths and test paths do **not overlap**
- the real database path is not the same as the test database path
- the real download path is not the same as the test download path
- other test paths are also distinct from their real counterparts

If overlap is detected, `.env` verification should fail and report that the test and real environments are not safely isolated.

---

# 3. View A — Init: Intended Behavior

## 3.1 Scheduler target platform

The user clarified that the scheduler actions are intended for **Raspberry Pi OS**, not for Windows-specific scheduling behavior.

The scheduler implementation should use **cron**.

---

## 3.2 Install scheduler button

The **Install scheduler** button should not be a vague scheduler action.
It should specifically configure the Raspberry Pi cron setup.

### Required behavior

When pressed, it should:

1. work against the Raspberry Pi OS cron system
2. create or replace the intended cron setup for this system
3. ensure the correct cron jobs are installed

### User-defined required jobs

The user explicitly identified the three jobs that must be installed:

1. **run regular worker**
2. **run playback worker**
3. **run screen on-off worker**

### Interpretation

“Install scheduler” should effectively ensure that the cron table contains the required entries for these three workers.

The user described this as essentially clearing/setting up the cron jobs table and adding the three worker jobs.

### Destructive install mode (explicit)

Install scheduler is intentionally destructive to the target cron file contents.

Required UX flow:

1. Read current cron contents before writing.
2. If current content is not empty (or contains entries outside the required set), show a blocking warning that existing cron contents will be destroyed.
3. In that warning, show that cron is currently non-empty and indicate that other entries exist (summary/preview is sufficient).
4. Show a clear confirmation choice: **Cancel** or **OK**.
5. On **Cancel**, do nothing and leave cron unchanged.
6. On **OK**, wipe the target cron contents and write only the canonical required jobs for this system.

No merge/preserve behavior is required in this mode.

---

## 3.3 Check scheduler button

The **Check scheduler** button should verify the cron configuration.

### Required behavior

When pressed, it should:

1. read the current cron job list from the cron file / cron configuration
2. print out the current cron jobs list
3. compare the detected jobs against the exact canonical required jobs
4. report whether the current installed jobs are correct

### Expected result style

The button should return a success/failure style result:

- **Success** if the cron contents exactly match the canonical required jobs
- **Failure** if required jobs are missing, malformed, incomplete, or if extra unexpected jobs are present

### Minimum required comparison target

The check must validate the presence/correctness of these three jobs:

- regular worker
- playback worker
- screen on-off worker

It must also fail if extra unexpected cron entries are present.

---

## 3.4 B1 authentication placement

The B1 login/authentication action is moved to **View A (Init)**.

### Required behavior in View A

If triggered, it should:

- use values from the `.env`
- attempt the real login/auth flow
- support the possibility that **two-factor authentication** may need to be handled

### Scope clarification

- B1 auth is an init/preflight capability in View A
- B1 auth is **not** a View B stage action
- mock download and the post-download test stages do **not** require successful login to run

---

# 4. View B — Test: Authoritative Intended Behavior

The user wants View B to evolve into a true **test environment runner**, not a misleading mixture of mock and partially real behavior.

The test view should become a place where the user can manually exercise the pipeline against **test data** and a **test database**, while keeping behavior as close as possible to the real pipeline.

## 4.1 Allowed simulation boundaries (normative)

To avoid ambiguity, simulation in View B is allowed **only** for the explicitly listed cases below:

1. mock download source behavior (copying generated test content into test download paths)
2. Windows playback presentation differences (e.g., library choice, fullscreen not required, minor visual differences)
3. Windows screen-off representation as a large persistent notice instead of physical display power-off

Everything else in View B post-download stage execution must be real-equivalent pipeline logic operating on test DB and test folders.

If any wording elsewhere appears broader than this, this boundary list wins.

---

# 5. View B — No Authentication Step

Authentication belongs to **View A (Init)** only.

View B contains no login/auth block and must not gate stage execution on login state.

Specifically:

- mock download must be runnable without login
- post-download stage runs in View B must not be blocked by login state
- View B remains focused on isolated test-data/test-DB execution

---

# 6. View B — Test Environment Preparation Requirements

Before the test stages are used, the test environment must be prepared.

Only these setup prerequisites gate View B stage execution:

- test folders exist
- test database exists

Login is not a gating prerequisite for mock download or post-download stage execution.

## 6.1 Required setup buttons

The user wants explicit setup actions such as:

- **Create test folders**
- **Create test database**

These may be exact button names or implementation-equivalent controls, but the behavior is required.

---

## 6.2 Create test folders behavior

This setup action should:

- create the test directories defined by the test paths in `.env`
- ensure the required test folders exist before stage execution

The user explicitly wants the testing folders to exist before the test pipeline is used.

---

## 6.3 Create test database behavior

This setup action should:

- create the test database
- initialize the necessary test database schema
- make the test DB ready for the later test stages

The user explicitly wants the testing database to exist before the test stages are used.

---

## 6.4 Gating behavior for later buttons

The user wants the rest of the test-stage functionality to be gated by the test environment setup state.

### Required rule

The setup steps for:

- test folders existing
- test database existing

must be satisfied before the other test-stage buttons are considered properly available.

The user described this as:

- these setup buttons must be pressed first (Create test folders, Create test database)
- then the next/all other stage buttons open up and can be run

So the intended behavior is that test stages depend on a prepared test environment.

---

# 7. View B — Mock Download Stage

## 7.1 Purpose

The user wants the download test action to become a **mock download** operation.

This mock download should not pull from the real external source.

Instead, it should use the **generated test content folder** / **generated test data folder**.

---

## 7.2 Source of mock data

The source content should include all files from the generated test data folder, including mixed cases such as:

- images with GPS
- images without GPS
- images with faulty/missing GPS
- videos
- other generated test media cases present in that folder

The user explicitly wants all those previously generated mock download files to be used.

---

## 7.3 Destination of mock download

The mock download should copy those files into the **test download folder**, not into the real download folder.

This is part of the required real-vs-test isolation.

---

## 7.4 Feedback requirement

When the mock download is run, it should provide clear operational feedback.

### Expected behavior

It should tell the user whether:

- the operation succeeded
- the operation failed
- some files copied successfully while others failed

The result should be human-readable and not just silent state mutation.

---

# 8. View B — Stage Execution Model After Mock Download

After test folders and the test database are created, the user wants stage buttons to be runnable individually.

The user explicitly clarified that once the environment is prepared, the later stage buttons should be usable independently.

This means:

- the user does **not** always have to run everything in order from the beginning
- the user can choose a later stage button directly
- that stage should run against whatever data currently exists in the **test database** and related test folders

---

## 8.1 Graceful empty-input behavior

If the user runs a later stage and there is no suitable data, the stage should still execute its logic and then return a graceful message.

### Example given by the user

If the user presses the **geocoding run button** and there is no suitable data in the test DB, the stage should:

- run against the test DB
- determine that there are no suitable entries
- inform the user clearly with something like:
  - `no suitable entries found`
  - or equivalent clear feedback

### Required principle

Later-stage buttons must fail gracefully when prerequisites are missing from the test DB.

---

# 9. View B — Human-Readable Logs and Database Change Tracking

The user wants all meaningful post-download stages to provide **clear human-readable operational output**.

This applies especially to stages after the mock download.

---

## 9.1 Human-readable stage logs

For stages like indexing, GPS parsing, geocoding, and queue preparation, the UI should show a human-readable text/log describing what happened.

### Example style requested by the user

The logs should say things like:

- parsing this file
- indexing this file
- processing this entry
- skipping this file because of some reason
- no suitable items found
- inserted X rows
- updated Y rows

The exact wording can vary, but the output must be understandable to a human operator.

---

## 9.2 Database snapshot / delta logging requirement

The user wants more than just normal logs.

For all stages **after the mock download**, the system should track the DB interaction boundary.

### Required model

When a stage is run:

1. record the **start snapshot** or starting DB state relevant to that stage
2. perform the stage work
3. record the **end snapshot** or ending DB state relevant to that stage
4. compute/log the difference between the start and end

### Required visibility

The changes made during the stage should be logged, including operations such as:

- inserts
- updates
- other meaningful DB mutations

The user explicitly said that this start/end difference behavior should apply to **all the stages after the mock download**.

---

## 9.3 Stage summary requirement

In addition to structured change tracking, each stage should also provide a short human-readable summary of what happened during that stage.

This summary should describe:

- what the stage attempted to do
- what it found
- what it changed
- whether it succeeded, partially succeeded, or had nothing to do

---

# 10. View B — Specific Stage Intent

The user explicitly discussed these stages in order:

1. mock download
2. indexing
3. parsing files for GPS
4. geocoding
5. enqueueing for playback / slideshow

These are all treated as stage-level operations that should exist in the test pipeline.

---

## 10.1 Indexing stage

The indexing stage must:

- run against the **test database**
- produce human-readable logs
- capture DB start/end state and differences
- report what files were indexed or skipped

---

## 10.2 GPS parsing stage

The GPS parsing stage must:

- run against the **test database** / test media state
- behave like the real logic would behave
- produce human-readable logs
- capture DB start/end state and differences
- gracefully report when nothing suitable is available

---

## 10.3 Geocoding stage

The geocoding stage must:

- run against the **test database**
- behave like the real logic would behave
- produce human-readable logs
- capture DB start/end state and differences
- gracefully report when there are no suitable entries to geocode

---

## 10.4 Queue/slideshow enqueue stage

The queue preparation stage must:

- run against the **test database**
- behave like the real logic would behave
- produce human-readable logs
- capture DB start/end state and differences
- populate or update the playback/slideshow queue in the test environment

---

# 11. Relationship to the Real Regular Worker

The user clarified that these real-use-case stages are normally handled in production by the **cron regular worker**.

That means the manual buttons in the test view are conceptually test-side manual triggers for logic that, in the real system, belongs to the regular worker flow.

So the implementation principle is:

- the test view runs the same or equivalent stage logic manually
- the real production workflow runs those stages under the regular worker

---

# 12. Strict One-Stage-At-A-Time Rule

The user explicitly corrected this point very strongly:

> only one. There is no other way, only one.

This is a strict requirement.

## 12.1 Concurrency rule

Only **one stage from this stage block** may run at a time.

There is no “sometimes parallel” mode.
There is no “typically one at a time” flexibility.
The intended rule is strictly:

- **exactly one stage at a time**

---

## 12.2 Lock-file / stop behavior

If another stage attempts to start while one stage is already running, the second stage should **immediately stop**.

The user said that this should be enforced by something like a log file / lock file mechanism.

### Required behavior

If stage A is running and stage B is triggered:

- stage B must not proceed
- stage B must stop immediately
- the system should log that the stage could not start because another stage is already active

---

# 13. Run All Stages Button

The user confirmed the purpose of the **Run all stages** button in the test view.

## Required behavior

It should:

- run all the stages in sequence
- execute them one after another
- respect the same stage order intended by the test pipeline
- still obey the single-stage-at-a-time rule

### Practical meaning

This is not parallel orchestration.
It is sequential orchestration.

---

# 14. Test Playback / Preview Behavior in View B

The user discussed a playback-related button in the test view.

This button should not merely select an item abstractly.
It should drive a meaningful playback-style test preview.

---

## 14.1 Data source for test playback

When the playback test is run, it must:

- use the **test database**
- read from the **playback queue table** in the test DB
- select the correct file from that queue

This should not use the real DB.

---

## 14.2 Playback display behavior

After selecting the correct test-queue media item, the test playback should:

- display the file
- show the overlay
- show the address overlay information

The user explicitly wants the overlay behavior present in the test playback.

---

## 14.3 Automatic transition to next media

After a media item’s display duration expires, the preview should:

- automatically move to the next image or video
- continue through the queue like a slideshow/playback flow

This automatic progression is required.

---

## 14.4 Similarity to real behavior

The user wants all stages besides the mock download to act like the real-life scenario.
That includes playback behavior as much as reasonably possible.

However, the user also explicitly allowed some playback-specific differences for Windows.

---

## 14.5 Windows playback differences are acceptable

The user clarified:

- Windows playback can be somewhat distinct from Raspberry Pi playback
- different libraries may be used
- there may be minor visual differences such as font sizes or similar details
- fullscreen is not required for Windows test playback

### But the core playback logic should still match

Despite those minor differences, the intended behavior should still be functionally similar, including:

- correct queue item selection
- overlay display
- progression to next file after the correct time

So the allowed differences are mostly implementation/rendering differences, not logic differences.

---

# 15. Screen On-Off / Activity Testing in the Test View

The user wants test support for the third worker behavior as well.

This behavior should use the existing **B5 block** for screen activity / inactivity behavior.

---

## 15.1 Use existing B5 block

No new block creation is required.

Use B5 as the dedicated area for screen on-off / activity worker test behavior.

No appearance/layout control redesign is required here; this section clarifies intended behavior of existing controls.

---

## 15.2 Toggleable activity/inactivity detection sources

Inside B5, the user wants the ability to toggle on/off different activity detection methods.

Examples explicitly mentioned:

- mouse movement activity detection
- keyboard press activity detection
- other appearance/activity/inactivity registering methods

### Required behavior

Each detection source should be individually toggleable on or off.

This allows the user to simulate different screen-activity detection configurations.

---

## 15.3 Windows behavior when inactivity occurs

For the Windows test version, the user does **not** require the screen to physically turn off.

Instead, if inactivity is detected and the relevant detection logic says the screen should be off:

- the system should show a **large notice** that the screen is turned off
- that notice should remain visible
- the notice should only go away when activity is detected again

### Important interpretation

In Windows test mode, screen-off behavior is represented visually through a persistent notice rather than actual display power-off.

---

# 16. Summary of Authoritative Intent by Area

## 16.1 View A intent

- Use Raspberry Pi OS cron behavior
- Install scheduler should warn, require explicit OK/Cancel, and on OK wipe/rewrite cron to canonical three jobs
- Check scheduler should print current cron jobs and verify exact canonical match (including no unexpected entries)
- B1 login/auth belongs in View A as init/preflight behavior

## 16.2 View B environment intent

- Test environment must be fully isolated from the real environment
- `.env` must contain separate test paths
- `.env` verification must reject overlapping real/test paths

## 16.3 View B setup intent

- Create test folders first
- Create test database first
- Later stage buttons depend on those setup steps
- Login is not required before mock download or later View B stage runs

## 16.4 View B pipeline intent

- mock download copies all generated test content into the test download folder
- later stages run against the test database
- later stages behave like the real pipeline logic would behave
- if no suitable data exists, the stage should fail gracefully with clear messaging

## 16.5 Logging intent

- stages after mock download must produce human-readable logs
- stages after mock download must capture start/end DB snapshots or equivalent state boundaries
- differences between start and end must be visible/logged

## 16.6 Concurrency intent

- only one stage may run at a time
- any second attempted stage run must stop immediately and log why

## 16.7 Run-all intent

- run all stages in sequence
- not in parallel

## 16.8 Playback test intent

- use test DB playback queue
- display the correct file
- show overlay/address
- auto-advance to the next file after the proper time
- Windows playback may differ slightly visually, but logic should remain aligned

## 16.9 Screen test intent

- use existing B5 block for screen on-off worker behavior (no new block creation)
- toggle individual activity detection sources
- on Windows, inactivity should show a large persistent “screen off” notice instead of actually powering off the display

---

# 17. Implementation Guidance Derived from the Conversation

These are not extra inventions; they are direct implementation-useful consequences of the user’s decisions:

1. **Do not mix test DB and real DB access paths.**
2. **Do not let test download paths reuse the real download folder.**
3. **Do not keep B1 in View B; keep B1 in View A as init/preflight auth, and do not gate mock download on login.**
4. **Do not keep the download test as a real external download if the user wants it to copy generated test content.**
5. **Do not allow later stages to crash unclearly when the test DB has no suitable rows.**
6. **Do not run multiple stages at once.**
7. **Do not treat the test playback preview as a throwaway mock if the user expects queue-driven overlay-bearing slideshow behavior.**
8. **Do not require real physical screen power-off for Windows test mode; use the persistent large notice approach instead.**

---

# 18. Change-Control Note

This document records the user’s spoken decisions from the Voice AI session in this chat.

Unless the user later changes a requirement explicitly, future planning or implementation work should treat these items as the authoritative expected behavior for the discussed areas.



---

## Source 2
Path: C:\Users\mihke\Downloads\VOICE_AI_AUTHORITATIVE_SPEC_2_BEHAVIOR_AND_INTENT_2026-04-22.md

# Voice AI Authoritative Spec — Part 2: Behavioral Intent and Clarifications

Date: 2026-04-22
Status: Authoritative clarification document based on the follow-up Voice AI discussion
Purpose: Record the clarified intended behavior of the discussed views, blocks, controls, and worker-related runtime surfaces.

---

## 1. Document Role

This document is the **second authoritative markdown document** based on the recent Voice AI discussion.

It exists to capture the **clarified intent** behind the UI and system behavior, especially where earlier discussion, current implementation, or prior summary text may have been incomplete, misleading, or too implementation-driven.

This document is focused less on "what the code currently does" and more on:

- what these discussed things are **supposed to do**
- how the user intends them to behave
- which parts are **real system behavior** versus **test-environment behavior**
- which earlier assumptions should be corrected

Where this document conflicts with earlier loose summary wording, this document should be treated as the stronger behavioral clarification.

---

## 2. High-Level Intent

The system has two major operating contexts:

1. **Real / production-like runtime context**
   - used for the actual long-running system
   - driven by cron workers
   - uses the real database and real folders
   - intended to continue automatically after restarts or power interruptions

2. **Test context**
   - fully isolated from the real runtime
   - uses separate testing paths and a separate testing database
   - allows manual triggering of stages in a controlled way
   - should mimic the real behavior of the pipeline as closely as possible, except where platform-specific playback differences are acceptable

The core rule is:

> The test environment must not interfere with the real environment.

That means:

- different database path
- different download / working folders
- separate test setup
- explicit environment verification to ensure no overlap

---

## 3. View A — Init: Intended Meaning

View A is the initialization / setup view.

Its purpose is to prepare and verify core system prerequisites.

### 3.1 Environment verification

The environment verification button should validate the configured environment and make sure required settings are present and sensible.

This should include validation of:

- required `.env` values
- path presence and correctness
- separation between test paths and real paths
- detection of dangerous overlap between the real and test environments

### 3.2 Database-related actions

The database-related actions in View A are intended to manage and inspect the configured database environment.

These actions should provide clear operational feedback, such as:

- whether the DB exists
- whether it can be opened
- whether schema inspection succeeded
- whether delete / recreate operations succeeded or failed

### 3.3 Scheduler-related actions

The scheduler actions must target **Raspberry Pi OS / Linux cron usage**, not a Windows-specific scheduler substitute.

The intended behavior is:

#### Install scheduler

This should:

- run in destructive replace mode for the target cron contents
- install the required cron jobs for the system
- ensure the expected jobs exist as the only managed entries after install

Required confirmation flow:

1. inspect current cron contents before install
2. if non-empty or containing non-canonical entries, show blocking warning that install will destroy current cron contents
3. in that warning, indicate cron is currently non-empty and that other entries exist (summary/preview is sufficient)
4. user must choose **Cancel** or **OK**
5. **Cancel** leaves cron unchanged
6. **OK** wipes and rewrites cron with canonical required jobs only

The three expected cron jobs are:

1. **regular worker**
2. **playback worker**
3. **screen on-off worker**

#### Check scheduler

This should:

- print or show the current cron job list from the relevant cron source
- compare the discovered jobs against the expected canonical required jobs
- clearly report success only if the configured cron content is an exact match
- clearly report failure if jobs are missing, malformed, or unexpected extra entries exist

This means View A should function as a real operational verification/setup area for the scheduler.

---

### 3.4 Authentication preflight placement

The B1 login/auth action should live in **View A (Init)** as an init/preflight capability.

When used, it should:

- use values from the `.env`
- perform the actual login/authentication flow
- support a two-factor authentication step if the real login requires it

This auth action should not be required for mock download or for post-download stage execution in View B.

---

## 4. View B — Test: Intended Meaning

View B is the **test view**.

Its purpose is to let the user manually run controlled test-environment operations that behave like the real system as much as possible, but against isolated test data and test storage.

This is not just a decorative mock area. It is intended to be a serious test harness.

Simulation is allowed only in explicitly defined cases, not as a general fallback.

Allowed simulation cases:

1. mock download source behavior (generated test data copied into test download paths)
2. Windows playback presentation differences (library/rendering/fullscreen differences)
3. Windows screen-off represented by a persistent notice instead of literal display power-off

All post-download stage logic in View B should remain real-equivalent and run against test DB/test folders.

---

## 5. View B Has No Authentication Block

Authentication is part of **View A (Init)** and is not a View B control.

View B is not intended to require login before mock download or before post-download test-stage execution.

So View B should remain a test-pipeline harness operating on isolated test folders/test DB, without auth gating.

---

## 6. View B Test Environment Preparation Requirements

Before stage execution in the test flow, the test environment must be explicitly prepared.

Two setup steps are required:

1. **Create test folders**
2. **Create test database**

These are not optional conveniences. They are part of the intended test harness.

Login/auth is not part of these View B stage-gating prerequisites.

### 6.1 Create test folders

This action should:

- create the testing folders referenced by the `.env`
- ensure the test path structure exists
- be safe to run repeatedly
- provide clear success/failure feedback

### 6.2 Create test database

This action should:

- create the testing database
- initialize any required schema
- be isolated from the real DB
- provide clear success/failure feedback

### 6.3 Unlocking the rest of the flow

After the test folders exist and the test database exists, the other test-stage actions should become available for use.

However, once the environment is prepared, the user should be able to run whichever stage they want.

That means:

- the stages do not need to be forced in strict manual order from the UI
- any stage may be triggered manually
- if a later stage is run without suitable prerequisite data, it should not crash
- instead it should inspect the test DB / test data and report something like:
  - no suitable entries found
  - nothing to process
  - no queued media available

This is important for debugging and exploratory testing.

---

## 7. View B Mock Download: Intended Meaning

The download step in the test environment should be a **mock download**.

But "mock" here does not mean fake meaningless output.

It means:

- use the files from the generated test content / generated test data folder
- copy or place them into the test download folder
- treat those files as the downloaded source set for further stages

The source set should include the broad range of prepared files, including for example:

- images with valid GPS
- images with no GPS
- images with faulty or missing GPS metadata
- videos
- mixed or edge-case test files

The action should:

- copy/use the prepared test files into the isolated test download location
- provide feedback about whether the operation succeeded
- clearly report failures if files are missing, copy fails, or paths are invalid

This mock download must remain separate from the real download process.

---

## 8. View B Stage Behavior After Mock Download

After the mock download, the later stages should behave like their real-life equivalents as much as possible.

The intended rule is:

> All stages after mock download should behave like the real pipeline, but against the test database and test folders instead of the real ones.

This includes stages such as:

- indexing
- GPS parsing
- geocoding
- queue/slideshow preparation
- playback selection / preview behavior

---

## 9. Human-Readable Logs and Stage Reporting

For stages after mock download, the user wants strong visibility.

Each stage should produce:

1. **Human-readable progress / action log**
2. **Database start snapshot**
3. **Database end snapshot**
4. **A meaningful delta / difference view between start and end**

### 9.1 Human-readable log

The user wants the system to explain in readable language what happened during the stage.

Examples of the desired style:

- parsing this file
- indexing this item
- skipping this file because metadata is missing
- geocoded N entries successfully
- no matching rows found for processing

This should be more than raw technical noise.

### 9.2 Start and end database snapshots

For stages after mock download, the stage should record:

- the database state before the stage begins
- the database state after the stage completes

### 9.3 Delta / difference information

The important thing is not only start and end, but also the difference between them.

The user wants visibility into what changed during the stage, for example:

- inserted rows
- updated rows
- changed statuses
- queue additions
- address resolution results
- stage-specific relevant mutations

This requirement applies broadly to the post-download stages, not just indexing.

---

## 10. Stage Concurrency Rule in Test Flow

Only **one stage** may run at a time.

This is not merely a preference. It is the intended execution rule.

If another stage tries to start while one is already running:

- it must not proceed in parallel
- it should be blocked immediately
- the reason should be communicated clearly
- the blocking should be enforced through the locking/logging mechanism

This matches the user's intended real-system discipline.

---

## 11. Run All Stages Button

The "run all stages" behavior in the test view is intended to execute the stages in sequence.

Meaning:

- it should run the pipeline stages one after another
- it should follow the real pipeline order
- it should preserve the same one-stage-at-a-time rule
- it should provide readable progress information across the sequence

This button should act as a controlled sequential orchestration path for the test environment.

---

## 12. Playback in Test View

The playback-related test behavior is intended to be meaningful and close to the real logic.

### 12.1 Media source

When the playback run action is triggered in the test view, it should:

- use the **test database**, not the real one
- read from the **playback queue table** in the test DB
- select the correct next file from that queue

### 12.2 Display behavior

The selected media should then be shown in the test playback area.

The user does **not** require this to be fullscreen in the Windows test view.

But otherwise, it should behave as similarly as practical to the real playback flow.

That includes:

- displaying the media
- drawing the overlay
- showing the address overlay text
- advancing to the next image/video after the configured display time

### 12.3 Auto-advance

After the configured image/video display time passes:

- the next suitable queued file should be selected automatically
- that item should then be displayed
- the slideshow/playback should continue

### 12.4 Platform differences

Playback is the one area where the user explicitly allows practical platform-specific differences.

That means:

- Windows test playback may use different libraries than Raspberry Pi playback
- there may be minor differences such as font size, rendering details, or other presentation quirks
- fullscreen parity is not required in the Windows test preview

However:

- the overall playback logic
- queue usage
- overlay behavior
- transition behavior
- sequencing behavior

should still match the real intended pipeline as closely as possible.

---

## 13. B5 Block — Clarification

A key clarification from the follow-up discussion:

> **B5 already exists.**

It is not a brand-new area that must first be invented from nothing.

The important clarification is:

- B5 exists already
- it contains checkbox/toggle-style controls rather than ordinary run buttons
- the earlier conceptual discussion about activity detection options should be transferred onto this existing area

### 13.1 Intended role of B5

B5 should be the test/control area for screen activity and inactivity detection logic.

It should allow enabling/disabling different activity detection sources, such as:

- mouse movement
- keyboard activity
- other available activity/inactivity sources

The exact control shape may be checkboxes/toggles rather than buttons.

No UI appearance/control-layout redesign is required for B5 in this clarification pass.

### 13.2 Windows-specific testing behavior

In the Windows testing version:

- inactivity does not need to literally power off the physical screen
- instead, when inactivity rules say the screen would be off, a **large persistent notice** should appear
- that notice should remain visible until new activity is detected

So in Windows test mode, the user wants a strong visible simulation of screen-off state rather than literal hardware display-off behavior.

---

## 14. View C — Last Run Info: Clarified Meaning

View C is not primarily meant to be a place where the user must manually resume the system after a restart.

The clarified intended behavior is:

- the real system should resume automatically through cron-based workers
- the user should not need to come into View C to make continuity happen manually

Instead, View C should show the **same continuity / last-known-state information** that the automatic runtime logic uses internally.

So View C is best understood as a:

- continuity-information view
- last-known-state view
- visibility/debug/status view for recent or persisted runtime context

### 14.1 What it should show

The user expects View C to surface meaningful recent continuity data such as:

- last shown media
- recent playback state
- stage context
- screen state context
- other persisted runtime continuity fields

If, for example, the system stopped during display of item 10, the view should show the last meaningful known continuity state, such as item 10 or at least item 9 depending on persistence timing.

### 14.2 Relationship to power outages and restart

After power interruption or restart:

- cron-driven logic should resume automatically using persisted continuity information
- View C should expose that same kind of information for visibility
- View C helps the user understand where the system was / is, but is not the primary mechanism for making it continue

### 14.3 C5 Resume button status

The earlier C5 resume concept became less central during the discussion.

The clarified user intent is:

- automatic continuity should come from the cron/runtime logic itself
- View C should show the information used for that continuity
- manual resume from C is not the main intended path

So if C5 remains in the UI, it should be treated carefully relative to the stronger requirement above.

---

## 15. View D — Running Process: Clarified Meaning

A very important clarification:

> View D should be treated as the **real running process view**.

During the discussion, any confusion around a "simulated runtime preview" was explicitly rejected as the core meaning of View D.

The authoritative intent is:

- View D shows the currently active state of the real system working
- it is meant to represent real live process visibility
- it should show what the cron workers are doing right now

### 15.1 Temporary exception

There may still be a button or wording such as "Start simulated runtime preview" somewhere in the current UI.

The user's instruction for the purpose of this authoritative meaning is:

- ignore that for now
- do not let that wording redefine the intended core meaning of View D

So the behavioral target for View D remains: **real running process visibility**.

### 15.2 D1 Pipeline worker section

The pipeline worker area should show the stages of the real pipeline.

Examples of what the user expects to see:

- download = active, others idle
- GPS parsing = active, others idle
- another stage active, with the rest not running

It should reflect the real currently active stage state.

### 15.3 Other worker information

View D should show the live statuses of the cron workers and related runtime activity.

That includes, in principle:

- current worker statuses
- stage statuses
- which worker is active right now
- which workers are idle
- last run / recent run information where relevant
- other live operational context the runtime exposes

The main point is not one specific field but the overall live truth of the running system.

### 15.4 Intended purpose of View D

View D should answer:

- what is the system doing right now?
- which worker is running?
- which pipeline stage is active?
- which parts are idle?
- what is the real current process state?

So this is fundamentally an **operational live-status view**.

---

## 16. Relationship Between Real Workers and Test Triggers

The user clarified that the real operational pipeline stages are handled by the **regular cron worker**.

Those include the real-life equivalents of:

- download
- indexing
- GPS parsing
- geocoding
- queue preparation

The test view exists so those stages can be triggered manually in an isolated environment.

Therefore:

- real system = worker-driven automation
- test system = manually triggered, isolated but behaviorally similar

---

## 17. Core Behavioral Principles Confirmed in the Discussion

The following principles were clearly established:

1. **Test and real environments must be separate**
2. **`.env` verification must detect overlapping real/test paths**
3. **The test pipeline should behave like the real pipeline after mock download**
4. **Human-readable logs are required**
5. **Database start/end snapshots and deltas are required for post-download stages**
6. **Only one stage may run at a time**
7. **Run-all-stages should execute sequentially**
8. **Playback in test should use the test DB playback queue**
9. **Windows playback may differ slightly in presentation, but logic should remain aligned**
10. **B5 exists and should be used for activity/inactivity control testing**
11. **View C is a continuity/status visibility view, not the primary resume trigger**
12. **View D is the real running-process view in intended meaning**
13. **Cron is the authoritative scheduler model for Raspberry Pi OS**
14. **The three required cron jobs are regular worker, playback worker, and screen on-off worker**

---

## 18. Implementation Interpretation Guidance

If this document is used as implementation guidance, the strongest interpretation should be:

- follow the clarified user intent here even if some current UI wording or earlier metadata is weaker
- preserve strict test/runtime separation
- treat simulation as allow-list only (mock download source behavior, Windows playback presentation differences, Windows screen-off notice simulation)
- treat scheduler install as destructive by design with explicit user confirmation (Cancel/OK) before wipe/rewrite
- treat manual conflict resolutions made by the user in this cleanup session as authoritative for the resolved items
- if a new unresolved Source 1 vs Source 2 conflict appears, prefer Source 2 by default unless the user explicitly overrides
- make the test flow diagnostically rich and operationally useful
- treat View D as real-process visibility
- treat View C as persisted continuity visibility
- treat B5 as the existing activity/inactivity control area

---

## 19. Suggested Priority of What This Clarification Most Strongly Affects

This discussion most strongly affects:

1. View A scheduler behavior and cron job verification
2. Test environment setup and `.env` isolation logic
3. Mock download using generated test data
4. Stage logging / DB snapshot / DB delta behavior
5. Single-stage locking
6. Test playback queue behavior
7. B5 activity/inactivity controls
8. View C continuity-state display meaning
9. View D real-process live-status meaning

---

## 20. Final Authority Statement

This document records the clarified intended meaning of the discussed UI areas and worker-related behavior from the latest Voice AI discussion.

It should be treated as an authoritative behavioral clarification document for those topics unless the user explicitly supersedes parts of it later.

