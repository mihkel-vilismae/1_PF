import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, ChevronsUpDown, X } from "lucide-react";

const columns = [
  { key: "view", label: "View" },
  { key: "cardSection", label: "Card / Section" },
  { key: "elementName", label: "Element name" },
  { key: "codeIdentification", label: "Code identification" },
  { key: "mode", label: "Mode" },
  { key: "attachedLabelText", label: "Attached label text" },
  { key: "attachedDescriptionText", label: "Attached description text" },
  { key: "sourceFileFunction", label: "Source file + function" },
  { key: "attachmentType", label: "Attachment type" },
  { key: "notes", label: "Notes" }
];

const quickFilterColumns = [
  { key: "mode", label: "Mode" },
  { key: "cardSection", label: "Card / Section" },
  { key: "attachmentType", label: "Attachment type" },
  { key: "notes", label: "Notes" }
];

const viewARows = [
  {
    view: "A",
    cardSection: "shared topbar",
    elementName: "View title",
    codeIdentification: ".topbar h1",
    mode: "Explain values",
    attachedLabelText: "Current view title: A — Init",
    attachedDescriptionText:
      "Source: state.currentViewTitle, updated when the active navigation view changes.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: "Shared shell element, not view-local markup."
  },
  {
    view: "A",
    cardSection: "hero",
    elementName: "Hero pill — Backend contract wired",
    codeIdentification: ".hero-pill text match `backend contract wired`",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Backend contract wired",
    attachedDescriptionText:
      "This statement reflects live backend wiring that already exists for View A init actions.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: describeHeroPillReality",
    attachmentType: "direct metadata",
    notes: "Intentional handcrafted copy."
  },
  {
    view: "A",
    cardSection: "hero",
    elementName: "Hero pill — Backend contract wired",
    codeIdentification: ".hero-pill text match `backend contract wired`",
    mode: "Show backend status",
    attachedLabelText: "Real: Backend contract wired",
    attachedDescriptionText:
      "This pill describes a section that already calls live backend endpoints.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeHeroPillBackendStatus",
    attachmentType: "direct metadata",
    notes: "Consistent with View A actions."
  },
  {
    view: "A",
    cardSection: "hero",
    elementName: "Hero pill — Backend still required",
    codeIdentification: ".hero-pill text match `backend still required`",
    mode: "Show real vs mock",
    attachedLabelText: "Mixed: Backend still required",
    attachedDescriptionText:
      "View A has real endpoint wiring, but the broader dashboard is still only partially implemented.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: describeHeroPillReality",
    attachmentType: "direct metadata",
    notes: "Broad dashboard-scope statement, not just View A."
  },
  {
    view: "A",
    cardSection: "hero",
    elementName: "Hero pill — Backend still required",
    codeIdentification: ".hero-pill text match `backend still required`",
    mode: "Show backend status",
    attachedLabelText: "Missing: Backend still required",
    attachedDescriptionText:
      "The UI surface exists, but additional backend support is still missing.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeHeroPillBackendStatus",
    attachmentType: "direct metadata",
    notes: "Broad dashboard-scope statement."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Status badge",
    codeIdentification: ".card[code=1A] .status-badge",
    mode: "Explain values",
    attachedLabelText: "1A status: Idle",
    attachedDescriptionText:
      "Source: state.statusByKey[\"1A\"], updated when that section starts, succeeds, fails, or becomes disabled.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: "Resolved from initial state."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Status badge",
    codeIdentification: ".card[code=1A] .status-badge",
    mode: "Show real vs mock",
    attachedLabelText: "Real: 1A status badge",
    attachedDescriptionText:
      "This section is backed by live init or scheduler backend endpoints.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: getSectionRealityByCode",
    attachmentType: "direct metadata",
    notes: "Section-level classification."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Status badge",
    codeIdentification: ".card[code=1A] .status-badge",
    mode: "Show backend status",
    attachedLabelText: "Real: 1A status badge",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 1A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: "Based on no result yet."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Run button",
    codeIdentification: "[data-action=\"verify-env\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Run",
    attachedDescriptionText:
      "Calls the live `/api/init/verify-env` backend endpoint.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: describeButtonReality -> ACTION_REALITY_COPY.verify-env",
    attachmentType: "direct metadata",
    notes: "Exact button label is just `Run`."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Run button",
    codeIdentification: "[data-action=\"verify-env\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Run",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 1A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeButtonBackendStatus -> getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: "Uses init action→code mapping."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Result surface",
    codeIdentification: ".card[code=1A] .result-surface",
    mode: "Show real vs mock",
    attachedLabelText: "Real: 1A backend result panel",
    attachedDescriptionText:
      "Rendered from the latest real backend request made by this View A card.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: describeResultSurfaceReality",
    attachmentType: "direct metadata",
    notes: "Present even when empty."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Result surface",
    codeIdentification: ".card[code=1A] .result-surface",
    mode: "Show backend status",
    attachedLabelText: "Real: 1A backend result panel",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 1A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeResultSurfaceBackendStatus -> getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: "No child value attachments yet because no backend result exists."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Log entry message",
    codeIdentification: ".log-entry__message in log source `1A`",
    mode: "Explain values",
    attachedLabelText: "Log entry (1A): Ready to call POST /api/init/verify-env.",
    attachedDescriptionText:
      "Source: state.logs[\"1A\"], appended whenever that section records a new log line.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: "Timestamp/type chip use same source family."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Log entry",
    codeIdentification: "[data-log-entry-open][data-log-source-key=\"1A\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: 1A log entry",
    attachedDescriptionText:
      "This log entry comes from a View A action that calls a live backend endpoint.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: describeLogReality",
    attachmentType: "direct metadata",
    notes: "Article-level attachment."
  },
  {
    view: "A",
    cardSection: "1A",
    elementName: "Log entry",
    codeIdentification: "[data-log-entry-open][data-log-source-key=\"1A\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: 1A log entry",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 1A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeLogBackendStatus -> getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: "No real request yet, but endpoint is wired."
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Status badge",
    codeIdentification: ".card[code=2A] .status-badge",
    mode: "Explain values",
    attachedLabelText: "2A status: Idle",
    attachedDescriptionText:
      "Source: state.statusByKey[\"2A\"], updated when that section starts, succeeds, fails, or becomes disabled.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: "Resolved from initial state."
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Status badge",
    codeIdentification: ".card[code=2A] .status-badge",
    mode: "Show real vs mock",
    attachedLabelText: "Real: 2A status badge",
    attachedDescriptionText:
      "This section is backed by live init or scheduler backend endpoints.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: getSectionRealityByCode",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Status badge",
    codeIdentification: ".card[code=2A] .status-badge",
    mode: "Show backend status",
    attachedLabelText: "Real: 2A status badge",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 2A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Check DB button",
    codeIdentification: "[data-action=\"check-db\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Check DB",
    attachedDescriptionText:
      "Calls the live `/api/init/database/status` backend endpoint.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.check-db",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Check DB button",
    codeIdentification: "[data-action=\"check-db\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Check DB",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 2A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Inspect DB button",
    codeIdentification: "[data-action=\"inspect-db\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Inspect DB",
    attachedDescriptionText:
      "Calls the live `/api/init/database/inspect` backend endpoint.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.inspect-db",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Inspect DB button",
    codeIdentification: "[data-action=\"inspect-db\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Inspect DB",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 2A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Delete DB button",
    codeIdentification: "[data-action=\"delete-db\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Delete DB",
    attachedDescriptionText:
      "Calls the live destructive backend path for deleting the configured SQLite database.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.delete-db",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Delete DB button",
    codeIdentification: "[data-action=\"delete-db\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Delete DB",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 2A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Recreate DB button",
    codeIdentification: "[data-action=\"recreate-db\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Recreate DB",
    attachedDescriptionText:
      "Calls the live backend path that recreates the SQLite database file.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.recreate-db",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "A",
    cardSection: "2A",
    elementName: "Recreate DB button",
    codeIdentification: "[data-action=\"recreate-db\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Recreate DB",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 2A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Status badge",
    codeIdentification: ".card[code=3A] .status-badge",
    mode: "Explain values",
    attachedLabelText: "3A status: Idle",
    attachedDescriptionText:
      "Source: state.statusByKey[\"3A\"], updated when that section starts, succeeds, fails, or becomes disabled.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: "Resolved from initial state."
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Status badge",
    codeIdentification: ".card[code=3A] .status-badge",
    mode: "Show real vs mock",
    attachedLabelText: "Real: 3A status badge",
    attachedDescriptionText:
      "This section is backed by live init or scheduler backend endpoints.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: getSectionRealityByCode",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Status badge",
    codeIdentification: ".card[code=3A] .status-badge",
    mode: "Show backend status",
    attachedLabelText: "Real: 3A status badge",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 3A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Install scheduler button",
    codeIdentification: "[data-action=\"install-cron\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Install scheduler",
    attachedDescriptionText:
      "Calls the live scheduler-install backend endpoint.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.install-cron",
    attachmentType: "direct metadata",
    notes: "May be disabled depending on platform support."
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Install scheduler button",
    codeIdentification: "[data-action=\"install-cron\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Install scheduler",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 3A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Check scheduler button",
    codeIdentification: "[data-action=\"check-cron\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Check scheduler",
    attachedDescriptionText:
      "Calls the live scheduler-status backend endpoint.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.check-cron",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Check scheduler button",
    codeIdentification: "[data-action=\"check-cron\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Check scheduler",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 3A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Print scheduler button",
    codeIdentification: "[data-action=\"print-cron\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Print scheduler",
    attachedDescriptionText:
      "Calls the live scheduler-print backend endpoint.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.print-cron",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "A",
    cardSection: "3A",
    elementName: "Print scheduler button",
    codeIdentification: "[data-action=\"print-cron\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Print scheduler",
    attachedDescriptionText:
      "This UI is wired to a live backend endpoint for 3A, even if it has not been called yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getInitBackendStatusMeta",
    attachmentType: "helper-generated",
    notes: ""
  }
];

const viewBRows = [
  {
    view: "B",
    cardSection: "hero",
    elementName: "Hero pill — MIXED VIEW",
    codeIdentification: ".hero-pill text from renderSourceBadge('hybrid','MIXED VIEW')",
    mode: "Show backend status",
    attachedLabelText: "Unknown: MIXED VIEW",
    attachedDescriptionText:
      "This pill explicitly marks a view that mixes real backend actions with mock-only surfaces.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeHeroPillBackendStatus",
    attachmentType: "direct metadata",
    notes: "No reality attachment: source badge is not in the reality selector set."
  },
  {
    view: "B",
    cardSection: "hero",
    elementName: "Hero pill — REAL ACTIONS PRESENT",
    codeIdentification: ".hero-pill text from renderSourceBadge('real','REAL ACTIONS PRESENT')",
    mode: "Show backend status",
    attachedLabelText: "Real: REAL ACTIONS PRESENT",
    attachedDescriptionText:
      "This pill marks a section that already has real backend-backed actions.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeHeroPillBackendStatus",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "hero",
    elementName: "Hero pill — PLACEHOLDERS STILL VISIBLE",
    codeIdentification: ".hero-pill text from renderSourceBadge('mock','PLACEHOLDERS STILL VISIBLE')",
    mode: "Show backend status",
    attachedLabelText: "Mock: PLACEHOLDERS STILL VISIBLE",
    attachedDescriptionText:
      "This view or stage is explicitly simulation-only rather than backend-backed.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeHeroPillBackendStatus",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B1",
    elementName: "Status badge",
    codeIdentification: ".card[code=B1] .status-badge",
    mode: "Explain values",
    attachedLabelText: "B1 status: Idle",
    attachedDescriptionText:
      "Source: state.statusByKey[\"B1\"], updated when that section starts, succeeds, fails, or becomes disabled.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B1",
    elementName: "Status badge",
    codeIdentification: ".card[code=B1] .status-badge",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: B1 status badge",
    attachedDescriptionText:
      "This section belongs to the simulation-only test area.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: getSectionRealityByCode",
    attachmentType: "direct metadata",
    notes: "Matches card copy."
  },
  {
    view: "B",
    cardSection: "B1",
    elementName: "Status badge",
    codeIdentification: ".card[code=B1] .status-badge",
    mode: "Show backend status",
    attachedLabelText: "Missing: B1 status badge",
    attachedDescriptionText:
      "This section stands in for backend/runtime support that is not implemented here yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getSectionBackendStatusByCode",
    attachmentType: "direct metadata",
    notes: "Section-level classification."
  },
  {
    view: "B",
    cardSection: "B1",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b1\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: Run",
    attachedDescriptionText:
      "Runs a frontend-only simulated login flow; there is no live auth backend in this view.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.run-b1",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B1",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b1\"]",
    mode: "Show backend status",
    attachedLabelText: "Missing: Run",
    attachedDescriptionText:
      "This flow is simulated in the frontend, while the planned backend test/login endpoint is not implemented here.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: ACTION_BACKEND_STATUS_COPY.run-b1",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B1",
    elementName: "Log entry",
    codeIdentification: "[data-log-entry-open][data-log-source-key=\"B1\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: B1 log entry",
    attachedDescriptionText:
      "This log entry comes from a simulated, demo, or preview-only dashboard section.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: describeLogReality",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B1",
    elementName: "Log entry",
    codeIdentification: "[data-log-entry-open][data-log-source-key=\"B1\"]",
    mode: "Show backend status",
    attachedLabelText: "Mock: B1 log entry",
    attachedDescriptionText:
      "This log entry comes from frontend-only simulation or placeholder behavior.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeLogBackendStatus",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B2",
    elementName: "Status badge",
    codeIdentification: ".card[code=B2] .status-badge",
    mode: "Explain values",
    attachedLabelText: "B2 status: Idle",
    attachedDescriptionText:
      "Source: state.statusByKey[\"B2\"], updated when that section starts, succeeds, fails, or becomes disabled.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B2",
    elementName: "Status badge",
    codeIdentification: ".card[code=B2] .status-badge",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: B2 status badge",
    attachedDescriptionText:
      "This section belongs to the simulation-only test area.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: getSectionRealityByCode",
    attachmentType: "direct metadata",
    notes: "Conflicts with button/card copy saying real."
  },
  {
    view: "B",
    cardSection: "B2",
    elementName: "Status badge",
    codeIdentification: ".card[code=B2] .status-badge",
    mode: "Show backend status",
    attachedLabelText: "Missing: B2 status badge",
    attachedDescriptionText:
      "This section stands in for backend/runtime support that is not implemented here yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getSectionBackendStatusByCode",
    attachmentType: "direct metadata",
    notes: "Conflicts with action metadata saying real."
  },
  {
    view: "B",
    cardSection: "B2",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b2\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Run",
    attachedDescriptionText: "Runs the real backend download test action.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.run-b2",
    attachmentType: "direct metadata",
    notes: "Intentional per-action classification."
  },
  {
    view: "B",
    cardSection: "B2",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b2\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Run",
    attachedDescriptionText:
      "This button calls the real POST /api/runtime/download/run endpoint.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: ACTION_BACKEND_STATUS_COPY.run-b2",
    attachmentType: "direct metadata",
    notes: "Contradicts section-level status."
  },
  {
    view: "B",
    cardSection: "B2",
    elementName: "Log entry",
    codeIdentification: "[data-log-entry-open][data-log-source-key=\"B2\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: B2 log entry",
    attachedDescriptionText: "This log entry captures a real backend action response.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeLogBackendStatus",
    attachmentType: "direct metadata",
    notes: "Again conflicts with B2 section badge."
  },
  {
    view: "B",
    cardSection: "B3",
    elementName: "Status badge",
    codeIdentification: ".card[code=B3] .status-badge",
    mode: "Explain values",
    attachedLabelText: "B3 status: Idle",
    attachedDescriptionText:
      "Source: state.statusByKey[\"B3\"], updated when that section starts, succeeds, fails, or becomes disabled.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3",
    elementName: "Status badge",
    codeIdentification: ".card[code=B3] .status-badge",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: B3 status badge",
    attachedDescriptionText:
      "This section belongs to the simulation-only test area.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: getSectionRealityByCode",
    attachmentType: "direct metadata",
    notes: "Broad section classifier."
  },
  {
    view: "B",
    cardSection: "B3",
    elementName: "Status badge",
    codeIdentification: ".card[code=B3] .status-badge",
    mode: "Show backend status",
    attachedLabelText: "Missing: B3 status badge",
    attachedDescriptionText:
      "This section stands in for backend/runtime support that is not implemented here yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getSectionBackendStatusByCode",
    attachmentType: "direct metadata",
    notes: "Conflicts with view copy claiming several real stages."
  },
  {
    view: "B",
    cardSection: "B3 toolbar",
    elementName: "Auto run button",
    codeIdentification: "[data-action=\"run-b3-auto\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: Run all stages",
    attachedDescriptionText:
      "Runs the full B3 sequence as a frontend-only simulated pipeline.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.run-b3-auto",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3 toolbar",
    elementName: "Auto run button",
    codeIdentification: "[data-action=\"run-b3-auto\"]",
    mode: "Show backend status",
    attachedLabelText: "Missing: Run all stages",
    attachedDescriptionText:
      "This auto pipeline is frontend-driven because the planned backend stage endpoints are not implemented here.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: ACTION_BACKEND_STATUS_COPY.run-b3-auto",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3.1",
    elementName: "Stage status badge",
    codeIdentification: ".stage-card[code=B3.1] .status-badge",
    mode: "Explain values",
    attachedLabelText: "B3.1 status: Idle",
    attachedDescriptionText:
      "Source: state.statusByKey[\"B3.1\"], updated when that section starts, succeeds, fails, or becomes disabled.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3.1",
    elementName: "Stage status badge",
    codeIdentification: ".stage-card[code=B3.1] .status-badge",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: B3.1 status badge",
    attachedDescriptionText:
      "This section belongs to the simulation-only test area.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: getSectionRealityByCode",
    attachmentType: "direct metadata",
    notes: "Conflicts with stage source badge REAL and action metadata real."
  },
  {
    view: "B",
    cardSection: "B3.1",
    elementName: "Stage status badge",
    codeIdentification: ".stage-card[code=B3.1] .status-badge",
    mode: "Show backend status",
    attachedLabelText: "Mock: B3.1 status badge",
    attachedDescriptionText:
      "This section is intentionally frontend-only simulation rather than backend-backed.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: getSectionBackendStatusByCode",
    attachmentType: "direct metadata",
    notes: "Strong internal contradiction."
  },
  {
    view: "B",
    cardSection: "B3.1",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-1\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Run",
    attachedDescriptionText: "Runs the real backend download stage.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.run-b3-1",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3.1",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-1\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Run",
    attachedDescriptionText:
      "This stage now calls the real POST /api/runtime/download/run endpoint.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: ACTION_BACKEND_STATUS_COPY.run-b3-1",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3.2",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-2\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Run",
    attachedDescriptionText: "Runs the real backend index stage.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.run-b3-2",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3.2",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-2\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Run",
    attachedDescriptionText:
      "This stage now calls the real POST /api/runtime/index/run endpoint.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: ACTION_BACKEND_STATUS_COPY.run-b3-2",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3.3",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-3\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: Run",
    attachedDescriptionText:
      "Runs a simulated GPS parsing stage; no live backend pipeline wiring exists here yet.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.run-b3-3",
    attachmentType: "direct metadata",
    notes: "Directly contradicts rendered subtitle ‘Calls POST /api/runtime/gps/run.’"
  },
  {
    view: "B",
    cardSection: "B3.3",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-3\"]",
    mode: "Show backend status",
    attachedLabelText: "Missing: Run",
    attachedDescriptionText:
      "This stage is meant to be backend-backed later, but currently no real endpoint/response exists here.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: ACTION_BACKEND_STATUS_COPY.run-b3-3",
    attachmentType: "direct metadata",
    notes: "Major mismatch with view copy."
  },
  {
    view: "B",
    cardSection: "B3.4",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-4\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: Run",
    attachedDescriptionText:
      "Runs a simulated geocode stage; no live backend pipeline wiring exists here yet.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.run-b3-4",
    attachmentType: "direct metadata",
    notes: "Directly contradicts rendered subtitle and paragraph."
  },
  {
    view: "B",
    cardSection: "B3.4",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-4\"]",
    mode: "Show backend status",
    attachedLabelText: "Missing: Run",
    attachedDescriptionText:
      "This stage is meant to be backend-backed later, but currently no real endpoint/response exists here.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: ACTION_BACKEND_STATUS_COPY.run-b3-4",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3.5",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-5\"]",
    mode: "Show real vs mock",
    attachedLabelText: "Real: Run",
    attachedDescriptionText: "Runs the real backend queue-prepare stage.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: ACTION_REALITY_COPY.run-b3-5",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B3.5",
    elementName: "Run button",
    codeIdentification: "[data-action=\"run-b3-5\"]",
    mode: "Show backend status",
    attachedLabelText: "Real: Run",
    attachedDescriptionText:
      "This stage now calls the real POST /api/runtime/queue/prepare endpoint.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: ACTION_BACKEND_STATUS_COPY.run-b3-5",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B4",
    elementName: "Preview frame",
    codeIdentification: ".card[code=B4] .preview-frame",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: Playback preview surface",
    attachedDescriptionText:
      "Frontend-only playback emulation panel; it does not represent a real media playback engine.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: describeRealityElement(.preview-frame)",
    attachmentType: "direct metadata",
    notes: "Card action is real, preview surface itself is mock."
  },
  {
    view: "B",
    cardSection: "B4",
    elementName: "Preview frame",
    codeIdentification: ".card[code=B4] .preview-frame",
    mode: "Show backend status",
    attachedLabelText: "Missing: Playback preview surface",
    attachedDescriptionText:
      "This preview stands in for backend/runtime support that is not implemented yet.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeBackendStatusElement(.preview-frame)",
    attachmentType: "direct metadata",
    notes: "Intentionally separate from selection action."
  },
  {
    view: "B",
    cardSection: "B4",
    elementName: "Screen indicator",
    codeIdentification: ".preview-frame__bar .screen-indicator:first-child",
    mode: "Explain values",
    attachedLabelText: "Playback preview screen state: Screen ON",
    attachedDescriptionText:
      "Source: state.truth.screenState, updated by B5 simulation controls and runtime preview state.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: "Resolved from seeded truth."
  },
  {
    view: "B",
    cardSection: "B4",
    elementName: "Screen indicator",
    codeIdentification: ".preview-frame__bar .screen-indicator:first-child",
    mode: "Show real vs mock",
    attachedLabelText: "Mock: Screen ON",
    attachedDescriptionText:
      "Derived from simulated B4/B5 preview state rather than live screen hardware state.",
    sourceFileFunction:
      "dashboard/inspect/realityMetadata.js :: describeRealityElement(.screen-indicator)",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B4",
    elementName: "Screen indicator",
    codeIdentification: ".preview-frame__bar .screen-indicator:first-child",
    mode: "Show backend status",
    attachedLabelText: "Mock: Screen ON",
    attachedDescriptionText:
      "This indicator is driven by frontend simulation state rather than a real backend/hardware response.",
    sourceFileFunction:
      "dashboard/inspect/backendStatusMetadata.js :: describeBackendStatusElement(.screen-indicator)",
    attachmentType: "direct metadata",
    notes: ""
  },
  {
    view: "B",
    cardSection: "B4",
    elementName: "Queue readiness indicator",
    codeIdentification: ".preview-frame__bar .screen-indicator:last-child",
    mode: "Explain values",
    attachedLabelText: "Playback preview queue readiness: No selected item yet",
    attachedDescriptionText:
      "Source: derived from state.truth.currentMedia; it changes when queue-stage actions create or remove the current media item.",
    sourceFileFunction:
      "dashboard/inspect/controlMetadata.js :: describeValueElement",
    attachmentType: "helper-generated",
    notes: "Since cu