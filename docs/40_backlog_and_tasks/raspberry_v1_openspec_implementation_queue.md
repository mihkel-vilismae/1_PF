# Raspberry v1 OpenSpec implementation queue

Status: active implementation queue  
Introduced: v0.8.77

## Purpose

This queue converts the improved OpenSpec bundle into implementation-ready work items. It is deliberately proof-gated: a slice is not done because code exists; it is done only when the matching proof/artifact status is clear.

## Queue

| Queue ID | OpenSpec source | Next implementation slice | Proof target | Current state |
|---|---|---|---|---|
| `OSQ-APP-001` | `raspberry_cron_worker_runtime_openspec.md`, `raspberry_v1_openspec_traceability_matrix.md` | Rerun v0.8.68+ target pack on Raspberry | `npm run proof:raspberry-app-running-target-pack` | Waiting for Raspberry access |
| `OSQ-ICL-001` | `raspberry_icloudpd_discovery_preflight_openspec.md` | Run/repair iCloudPD preflight on Raspberry | `npm run proof:raspberry-icloudpd-preflight` | Scaffold exists; real target NOT RUN |
| `OSQ-REG-001` | `raspberry_icloud_first_regular_worker_pipeline_openspec.md` | Implement staged iCloud-first regular worker product path | product evidence + gate proof | Contract exists; implementation pending |
| `OSQ-GEO-001` | `raspberry_gps_geocode_provider_chain_openspec.md` | Add/provider-proof Nominatim chain and missing GPS unknown policy | `npm run proof:real-geocode-provider-chain` | Existing proof command; real provider NOT RUN |
| `OSQ-PLAY-001` | native playback specs + regular worker pipeline spec | Connect playback worker to real queued media | native playback + queue evidence | Native standalone proof PASSED; queue integration pending |
| `OSQ-OVL-001` | `raspberry_address_overlay_device_proof_openspec.md` | Render address/unknown overlay on native/device display | `npm run proof:raspberry-address-overlay-device-display` | Gate/template exists; display evidence NOT RUN |
| `OSQ-DASH-001` | `raspberry_dashboard_status_view_openspec.md` | Implement proof-backed dashboard status projection | future dashboard proof | Data contract exists; UI proof pending |
| `OSQ-SCR-001` | `raspberry_screen_worker_non_blocking_openspec.md` | Add dedicated screen worker non-blocking proof | future screen non-blocking proof | Worker exists; dedicated gate pending |
| `OSQ-DOC-001` | all v1 OpenSpec docs | Keep static OpenSpec/docs audits passing | `npm run proof:openspec-v1-audit`, `npm run proof:docs-reconciliation-audit` | Audit scaffolds PASSED locally |

## OpenSpec implementation rule

Every implementation slice after v0.8.77 must reference at least one `OSQ-*` item in its changelog entry or proof docs. If a slice changes runtime behavior without a matching queue/spec/proof update, it is incomplete.

## Next recommended slices

1. With Raspberry access: `OSQ-APP-001`, then `OSQ-ICL-001`.
2. Without Raspberry access: `OSQ-REG-001` staged skeleton or `OSQ-DASH-001` backend status projection.

## Non-claims

- This queue does not implement the product pipeline by itself.
- This queue does not prove iCloud, geocode, overlay, dashboard, or screen behavior.
- This queue is a planning/control artifact that must be kept synchronized with real proof artifacts.
