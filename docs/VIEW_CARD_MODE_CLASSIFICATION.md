# View/Card Test Mode vs Real Mode Classification

Generated: 2026-05-27 18:39 EEST

## Purpose

This document records which dashboard cards are universal and which cards belong only to Test Mode or Real Mode. It is based on repository source inspection for the current baseline after the View B B2 split. Runtime behavior, backend routes, authentication, scheduler, pipeline, playback, and database actions remain governed by their existing code paths.

## Classification rules

| Classification | Meaning |
| --- | --- |
| Universal | The card is available in both Test Mode and Real Mode. It may still display mock, hybrid, or real status badges internally. |
| Test-only | The card/control appears only after selecting Test Mode. It must not expose real provider/download actions. |
| Real-only | The card/control appears only after selecting Real Mode. It must not expose mock/generated download controls. |
| Runtime-dependent | The card appears in both modes, but its labels or data source can change according to live runtime state. |

## View A — Init

| Card | Heading | Classification | Notes |
| --- | --- | --- | --- |
| 1A | Verify .env | Universal | Backend init/config verification. Safe prerequisite for both modes. |
| 1A-AUTH | Verify icloudpd | Universal | Legacy auth-preflight compatibility surface remains in View A. |
| 1A-STASH-OFF | NEW AUTH | Universal | Real iCloudPD auth/session verification belongs before real downloads, but the status card remains visible in both modes. |
| 2A | Database controls | Universal | Database check/inspect/delete/recreate controls remain shared. |
| 3A | Scheduler controls | Universal | Scheduler target controls remain shared across modes and are platform/capability gated. |

## View B — Test / Runtime actions

| Card | Heading | Classification | Notes |
| --- | --- | --- | --- |
| B2 | Download test action | Test-only | Mock/generated download path. In Test Mode it renders `data-action="run-b2"`; in Real Mode it is hidden. |
| B2-REAL_DOWNLOAD | Authenticated real download | Real-only | Authenticated iCloudPD download path. In Real Mode it renders `data-action="run-b2-real-download"`; in Test Mode it is hidden. |
| B3 | Pipeline stages | Universal | Shared pipeline control surface. Individual stages may still be real, hybrid, or placeholder-backed as documented by their badges and copy. |
| B4 | Playback selection | Universal | Shared playback-selection surface. Presentation controls are frontend-only; backend selection endpoint remains unchanged. |
| B5 | Screen on-off simulation | Universal | Shared simulation surface. It remains simulation-only and not real screen hardware. |

## View C — Last Run

| Card | Heading | Classification | Notes |
| --- | --- | --- | --- |
| C1 | Last shown media | Universal | Reads latest orchestration/run projection. |
| C2 | Playback state | Universal | Reads latest playback projection. |
| C3 | Stage context | Universal | Backend orchestration context. |
| C4 | Screen state | Universal | Not fully payload-backed where indicated by the card badge. |
| C5 | Restore and evidence | Universal | Partial restore/evidence surface. |

## View D — Running Process

| Card | Heading | Classification | Notes |
| --- | --- | --- | --- |
| D1 | Pipeline worker | Runtime-dependent | Visible in both modes. Its copy/badges switch between preview and live monitor according to `state.truth.realRunActive`, not the visual Test/Real mode selector. |
| D2 | Playback worker | Runtime-dependent | Visible in both modes; data source changes with runtime monitor state. |
| D3 | Screen on-off worker | Runtime-dependent | Visible in both modes; data source changes with runtime monitor state. |
| D4 | Monitor log / Preview log | Runtime-dependent | Visible in both modes; heading and copy depend on live runtime state. |

## View E — Database Viewer

| Card | Heading | Classification | Notes |
| --- | --- | --- | --- |
| E1 | Verify and connect | Universal | Shared database viewer verification. |
| E2 | Table catalog | Universal | Shared database object catalog. |
| E3 | Row viewer | Universal | Shared database rows/details viewer. |
| E4 | DB activity logging | Universal | Shared DB viewer log card. |

## Global shell card

| Card | Heading | Classification | Notes |
| --- | --- | --- | --- |
| IO | Transit terminal | Universal | Global shell card rendered after each view. It remains shared and records gateway traffic when available. |

## Current implementation summary

| Requirement | Implemented behavior |
| --- | --- |
| Test Mode includes mock B2 download and removes real B2 download | `renderTestView(state, 'test')` renders B2 and omits B2-REAL_DOWNLOAD. |
| Real Mode includes B2-REAL_DOWNLOAD and removes mock B2 download | `renderTestView(state, 'real')` renders B2-REAL_DOWNLOAD and omits B2. |
| Existing backend actions are preserved | Existing `run-b2` and `run-b2-real-download` action handlers and backend endpoints are unchanged. |
| Other cards stay available | All other View A-E cards remain shared unless runtime state already changes their presentation. |
