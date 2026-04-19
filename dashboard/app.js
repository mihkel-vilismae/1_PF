const nowStamp = () => new Date().toLocaleString("en-GB", { hour12: false });

const appState = {
  activeView: "view-a",
  runtimeState: {
    envStatus: "Idle",
    databaseStatus: "Idle",
    cronStatus: "Idle",
    queueLength: 0,
    currentMedia: null,
    playbackStatus: "Idle",
    screenState: "ON",
    lastActivitySource: "mouse",
    inactivityTimeoutSeconds: 5,
    lastCheckpoint: "Not saved",
    lastStageCompleted: "None",
    realRunActive: false,
  },
  history: [
    {
      id: crypto.randomUUID(),
      at: nowStamp(),
      source: "System",
      type: "info",
      message: "Dashboard prototype loaded with mock state only.",
    },
  ],
  logs: {
    "1a": [{ at: nowStamp(), type: "info", message: "Waiting for .env verification." }],
    "2a": [{ at: nowStamp(), type: "info", message: "Database controls are frontend placeholders." }],
    "3a": [{ at: nowStamp(), type: "info", message: "Cron controls ready for future wiring." }],
    b1: [{ at: nowStamp(), type: "info", message: "Login flow is idle." }],
    b2: [{ at: nowStamp(), type: "info", message: "No batch download started." }],
    "b3-1": [{ at: nowStamp(), type: "info", message: "Mock download points to /generated_test_data." }],
    "b3-2": [{ at: nowStamp(), type: "info", message: "Index stage waiting for manual or auto run." }],
    "b3-3": [{ at: nowStamp(), type: "info", message: "GPS parse stage waiting." }],
    "b3-4": [{ at: nowStamp(), type: "info", message: "Geocode stage waiting." }],
    "b3-5": [{ at: nowStamp(), type: "info", message: "Enqueue playback stage waiting." }],
    b4: [{ at: nowStamp(), type: "info", message: "Playback emulation disabled until queue has media." }],
    b5: [{ at: nowStamp(), type: "info", message: "Screen simulation ready. Current screen state: ON." }],
    c: [{ at: nowStamp(), type: "info", message: "No previous run has been selected yet." }],
  },
  statuses: {
    "1a": "idle",
    "2a": "idle",
    "3a": "idle",
    b1: "idle",
    b2: "idle",
    b3: "idle",
    "b3-1": "idle",
    "b3-2": "idle",
    "b3-3": "idle",
    "b3-4": "idle",
    "b3-5": "idle",
    b4: "disabled",
    b5: "idle",
    c: "info",
    d1: "disabled",
    d2: "disabled",
    d3: "disabled",
  },
  lastRunMode: "none",
  simulation: {
    pirEnabled: true,
    mouseEnabled: true,
    keyboardEnabled: true,
    executionMode: "auto",
    inputMode: "single",
  },
  runningProcess: {
    pipelineStages: [
      { name: "Download", status: "Idle", summary: "Waiting for real run.", lastRun: "Never" },
      { name: "Index", status: "Idle", summary: "Waiting for real run.", lastRun: "Never" },
      { name: "Get GPS", status: "Idle", summary: "Waiting for real run.", lastRun: "Never" },
      { name: "Geocode", status: "Idle", summary: "Waiting for real run.", lastRun: "Never" },
      { name: "Queue Slideshow", status: "Idle", summary: "Waiting for real run.", lastRun: "Never" },
    ],
    playbackWorker: {
      status: "Inactive",
      heartbeat: "Never",
      currentMedia: "None",
      summary: "Playback worker is not active.",
    },
    screenWorker: {
      status: "Inactive",
      heartbeat: "Never",
      screenState: "ON",
      lastActivity: "None",
      timeout: "5s",
      summary: "Screen worker is not active.",
    },
  },
};

const statusLabelMap = {
  idle: "Idle",
  running: "Running",
  success: "Success",
  error: "Error",
  disabled: "Disabled",
  info: "Info",
};

const viewTitleMap = {
  "view-a": "A — Init",
  "view-b": "B — Test",
  "view-c": "C — Last Run Info",
  "view-d": "D — Running Process",
};

const lastRunMockData = {
  media: {
    file: "same_gps_03.jpg",
    type: "Image",
    queuePosition: "3 of 7",
    checkpoint: "00:00 / full image duration",
  },
  playback: {
    status: "Paused by inactivity",
    lastCheckpoint: "Saved at " + nowStamp(),
    resumeMarker: "same_gps_03.jpg :: display-start",
    crashState: "Power lost during inactivity hold",
  },
  stage: {
    active: "Playback",
    lastCompleted: "Queue Slideshow",
    previousStage: "Geocode",
    stageError: "None",
  },
  screen: {
    state: "OFF",
    lastActivitySource: "PIR timeout elapsed",
    timeout: "5 seconds",
    transition: "screen_off_due_to_inactivity",
  },
};

function setActiveView(viewId) {
  appState.activeView = viewId;
  document.querySelectorAll(".view-nav__button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewId);
  });
  document.querySelectorAll(".view-section").forEach((section) => {
    section.classList.toggle("is-active", section.id === viewId);
  });
  document.getElementById("active-view-title").textContent = viewTitleMap[viewId];
}

function pushHistory(source, type, message) {
  appState.history.unshift({ id: crypto.randomUUID(), at: nowStamp(), source, type, message });
  renderHistory();
}

function pushLog(logKey, type, message) {
  if (!appState.logs[logKey]) {
    appState.logs[logKey] = [];
  }
  appState.logs[logKey].unshift({ at: nowStamp(), type, message });
  renderLog(logKey);
}

function setStatus(key, status) {
  appState.statuses[key] = status;
  const badge = document.getElementById(`status-${key}`);
  if (!badge) return;
  badge.textContent = statusLabelMap[status] ?? status;
  badge.className = `status-badge status-badge--${status}`;
}

function renderHistory() {
  const panel = document.getElementById("history-panel");
  panel.innerHTML = "";
  appState.history.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div class="history-item__meta">
        <span>${entry.at}</span>
        <span>${entry.source}</span>
      </div>
      <div class="history-item__message">${entry.message}</div>
    `;
    panel.appendChild(item);
  });
}

function renderLog(logKey) {
  const panel = document.getElementById(`log-${logKey}`);
  if (!panel) return;
  panel.innerHTML = "";
  (appState.logs[logKey] || []).forEach((entry) => {
    const item = document.createElement("article");
    item.className = "log-entry";
    item.innerHTML = `
      <div class="log-entry__meta">
        <span>${entry.at}</span>
        <span>${entry.type.toUpperCase()}</span>
      </div>
      <div class="log-entry__message">${entry.message}</div>
    `;
    panel.appendChild(item);
  });
}

function renderAllLogs() {
  Object.keys(appState.logs).forEach(renderLog);
}

function renderCurrentState() {
  const list = document.getElementById("current-state-panel");
  const stateEntries = {
    "Queue length": String(appState.runtimeState.queueLength),
    "Current media": appState.runtimeState.currentMedia?.name ?? "None",
    "Playback status": appState.runtimeState.playbackStatus,
    "Screen state": appState.runtimeState.screenState,
    "Last activity": appState.runtimeState.lastActivitySource,
    "Timeout": `${appState.runtimeState.inactivityTimeoutSeconds}s`,
    "Checkpoint": appState.runtimeState.lastCheckpoint,
    "Last stage": appState.runtimeState.lastStageCompleted,
    "Real run": appState.runtimeState.realRunActive ? "Active" : "Inactive",
  };

  list.innerHTML = Object.entries(stateEntries)
    .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
    .join("");
}

function renderPlaybackPreview() {
  const preview = document.getElementById("playback-preview");
  const content = document.getElementById("playback-preview-content");
  const info = document.getElementById("current-media-panel");
  const indicator = document.getElementById("screen-state-indicator");
  const runButton = document.getElementById("run-b4-button");

  preview.dataset.screenState = appState.runtimeState.screenState.toLowerCase();
  indicator.textContent = `Screen ${appState.runtimeState.screenState}`;

  if (!appState.runtimeState.currentMedia) {
    content.textContent = "No queued media. Run B3.5 first.";
    info.innerHTML = "Queue is empty. Playback emulation is disabled.";
    runButton.disabled = true;
    setStatus("b4", "disabled");
    return;
  }

  const media = appState.runtimeState.currentMedia;
  content.innerHTML = `
    <strong>${media.type}</strong><br />
    ${media.name}<br />
    <span style="color:#cbd5e1">${media.overlay}</span>
  `;
  info.innerHTML = `
    <strong>Current media</strong><br />
    Name: ${media.name}<br />
    Type: ${media.type}<br />
    Queue position: ${media.position}<br />
    Playback status: ${appState.runtimeState.playbackStatus}
  `;
  runButton.disabled = false;
  if (appState.statuses.b4 === "disabled") {
    setStatus("b4", "idle");
  }
}

function renderLastRunView() {
  const emptyBanner = document.getElementById("last-run-empty-state");
  const errorBanner = document.getElementById("last-run-error-state");
  const details = document.getElementById("last-run-details");
  const resumeButton = document.getElementById("resume-button");

  emptyBanner.classList.add("is-hidden");
  errorBanner.classList.add("is-hidden");
  details.classList.remove("is-disabled");
  resumeButton.disabled = false;

  if (appState.lastRunMode === "none") {
    emptyBanner.classList.remove("is-hidden");
    details.classList.add("is-disabled");
    resumeButton.disabled = true;
    writeDefinitionList("last-run-media", {});
    writeDefinitionList("last-run-playback", {});
    writeDefinitionList("last-run-stage", {});
    writeDefinitionList("last-run-screen", {});
    return;
  }

  if (appState.lastRunMode === "error") {
    errorBanner.classList.remove("is-hidden");
    details.classList.add("is-disabled");
    resumeButton.disabled = true;
    writeDefinitionList("last-run-media", {});
    writeDefinitionList("last-run-playback", {});
    writeDefinitionList("last-run-stage", {});
    writeDefinitionList("last-run-screen", {});
    return;
  }

  writeDefinitionList("last-run-media", lastRunMockData.media);
  writeDefinitionList("last-run-playback", lastRunMockData.playback);
  writeDefinitionList("last-run-stage", lastRunMockData.stage);
  writeDefinitionList("last-run-screen", lastRunMockData.screen);
}

function writeDefinitionList(elementId, data) {
  const target = document.getElementById(elementId);
  target.innerHTML = Object.entries(data)
    .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
    .join("");
}

function renderRunningProcess() {
  const inactiveBanner = document.getElementById("real-run-inactive-banner");
  const grid = document.getElementById("running-process-grid");
  const pipeline = document.getElementById("pipeline-worker-list");
  const playbackSummary = document.getElementById("playback-worker-summary");
  const screenSummary = document.getElementById("screen-worker-summary");

  inactiveBanner.classList.toggle("is-hidden", appState.runtimeState.realRunActive);
  grid.classList.toggle("is-disabled", !appState.runtimeState.realRunActive);

  pipeline.innerHTML = "";
  appState.runningProcess.pipelineStages.forEach((stage) => {
    const row = document.createElement("article");
    row.className = "worker-row";
    if (stage.status === "Running") {
      row.classList.add("is-active");
    }
    row.innerHTML = `
      <div class="worker-row__meta">
        <span>${stage.name}</span>
        <span>${stage.status}</span>
      </div>
      <div class="worker-row__message">${stage.summary}<br />Last run: ${stage.lastRun}</div>
    `;
    pipeline.appendChild(row);
  });

  playbackSummary.innerHTML = `
    <strong>Status:</strong> ${appState.runningProcess.playbackWorker.status}<br />
    <strong>Heartbeat:</strong> ${appState.runningProcess.playbackWorker.heartbeat}<br />
    <strong>Current media:</strong> ${appState.runningProcess.playbackWorker.currentMedia}<br />
    <strong>Summary:</strong> ${appState.runningProcess.playbackWorker.summary}
  `;

  screenSummary.innerHTML = `
    <strong>Status:</strong> ${appState.runningProcess.screenWorker.status}<br />
    <strong>Heartbeat:</strong> ${appState.runningProcess.screenWorker.heartbeat}<br />
    <strong>Screen state:</strong> ${appState.runningProcess.screenWorker.screenState}<br />
    <strong>Last activity:</strong> ${appState.runningProcess.screenWorker.lastActivity}<br />
    <strong>Timeout:</strong> ${appState.runningProcess.screenWorker.timeout}<br />
    <strong>Summary:</strong> ${appState.runningProcess.screenWorker.summary}
  `;

  setStatus("d1", appState.runtimeState.realRunActive ? "running" : "disabled");
  setStatus("d2", appState.runtimeState.realRunActive ? "running" : "disabled");
  setStatus("d3", appState.runtimeState.realRunActive ? "running" : "disabled");
}

function updateStepList(activeStep) {
  document.querySelectorAll("#b1-step-list li").forEach((node) => {
    node.classList.remove("is-active", "is-success");
    if (node.dataset.step === activeStep) {
      node.classList.add("is-active");
    }
  });
}

function completeStepList() {
  document.querySelectorAll("#b1-step-list li").forEach((node) => {
    node.classList.remove("is-active");
    node.classList.add("is-success");
  });
}

function applySimulationControls() {
  const pir = document.getElementById("toggle-pir").checked;
  const mouse = document.getElementById("toggle-mouse").checked;
  const keyboard = document.getElementById("toggle-keyboard").checked;
  const enableAll = document.getElementById("toggle-all").checked;
  const timeoutValue = Number(document.getElementById("timeout-input").value || 5);

  if (enableAll) {
    document.getElementById("toggle-pir").checked = true;
    document.getElementById("toggle-mouse").checked = true;
    document.getElementById("toggle-keyboard").checked = true;
  }

  appState.simulation.pirEnabled = enableAll || pir;
  appState.simulation.mouseEnabled = enableAll || mouse;
  appState.simulation.keyboardEnabled = enableAll || keyboard;
  appState.runtimeState.inactivityTimeoutSeconds = timeoutValue;
  appState.runningProcess.screenWorker.timeout = `${timeoutValue}s`;

  setStatus("b5", "success");
  pushLog(
    "b5",
    "success",
    `Simulation controls applied. PIR=${appState.simulation.pirEnabled}, mouse=${appState.simulation.mouseEnabled}, keyboard=${appState.simulation.keyboardEnabled}, timeout=${timeoutValue}s.`
  );
  pushHistory("B5", "success", "Screen simulation controls updated.");
  renderCurrentState();
  renderRunningProcess();
}

function setScreenState(newState, source) {
  appState.runtimeState.screenState = newState;
  appState.runtimeState.lastActivitySource = source;
  appState.runtimeState.lastCheckpoint = `${newState === "OFF" ? "Saved" : "Resumed"} at ${nowStamp()}`;

  if (newState === "OFF") {
    appState.runtimeState.playbackStatus = "Paused by inactivity";
    pushHistory("Screen worker", "info", "screen_off_due_to_inactivity event recorded.");
    pushLog("b5", "info", `Screen set to OFF. Playback checkpoint saved. Source: ${source}.`);
  } else {
    appState.runtimeState.playbackStatus = appState.runtimeState.currentMedia ? "Ready to resume" : "Idle";
    pushHistory("Screen worker", "info", "screen_on_due_to_activity event recorded.");
    pushLog("b5", "info", `Screen set to ON. Resume marker retained. Source: ${source}.`);
  }

  renderCurrentState();
  renderPlaybackPreview();
  renderRunningProcess();
}

function runPipelineStage(stageKey, displayName, successMessage, options = {}) {
  setStatus(stageKey, "running");
  pushLog(stageKey, "info", `${displayName} started.`);
  pushHistory(stageKey.toUpperCase(), "info", `${displayName} started.`);

  setStatus(stageKey, options.forceError ? "error" : "success");
  pushLog(stageKey, options.forceError ? "error" : "success", successMessage);
  pushHistory(stageKey.toUpperCase(), options.forceError ? "error" : "success", successMessage);

  if (!options.forceError) {
    appState.runtimeState.lastStageCompleted = displayName;
  }

  if (["b3-1", "b3-2", "b3-3", "b3-4", "b3-5"].includes(stageKey)) {
    setStatus("b3", options.forceError ? "error" : "success");
  }

  renderCurrentState();
}

function seedDemoState() {
  appState.runtimeState.currentMedia = {
    name: "gps_valid_02.jpg",
    type: "Image",
    overlay: "Overlay: Tartu, Estonia",
    position: "1 of 3",
  };
  appState.runtimeState.queueLength = 3;
  appState.runtimeState.playbackStatus = "Ready";
  appState.runtimeState.lastStageCompleted = "Enqueue playback";
  setStatus("b4", "idle");
  pushHistory("System", "success", "Demo playback queue seeded.");
  pushLog("b4", "success", "Queued media detected. Playback emulation can now run.");
  renderCurrentState();
  renderPlaybackPreview();
}

function startRealRun() {
  appState.runtimeState.realRunActive = true;
  const stamp = nowStamp();

  appState.runningProcess.pipelineStages = appState.runningProcess.pipelineStages.map((stage, index) => ({
    ...stage,
    status: index === 0 ? "Running" : "Waiting",
    summary: index === 0 ? "Download worker is processing the current batch." : "Waiting for previous stage to finish.",
    lastRun: index === 0 ? stamp : stage.lastRun,
  }));

  appState.runningProcess.playbackWorker = {
    status: "Running",
    heartbeat: stamp,
    currentMedia: appState.runtimeState.currentMedia?.name ?? "No media yet",
    summary: "Playback watchdog is checking the process every 5 seconds.",
  };

  appState.runningProcess.screenWorker = {
    status: "Running",
    heartbeat: stamp,
    screenState: appState.runtimeState.screenState,
    lastActivity: appState.runtimeState.lastActivitySource,
    timeout: `${appState.runtimeState.inactivityTimeoutSeconds}s`,
    summary: "Screen worker is checking inactivity state every 5 seconds.",
  };

  pushHistory("Runtime", "success", "Real run started. Running Process view is now active.");
  renderCurrentState();
  renderRunningProcess();
}

function wireActions() {
  document.querySelectorAll(".view-nav__button").forEach((button) => {
    button.addEventListener("click", () => setActiveView(button.dataset.viewTarget));
  });

  document.getElementById("seed-demo-button").addEventListener("click", seedDemoState);
  document.getElementById("start-real-run-button").addEventListener("click", startRealRun);
  document.getElementById("clear-history-button").addEventListener("click", () => {
    appState.history = [];
    pushHistory("System", "info", "History cleared.");
  });

  document.querySelectorAll('input[name="execution-mode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      appState.simulation.executionMode = radio.value;
      pushLog("b3-1", "info", `Execution mode set to ${radio.value}.`);
      pushHistory("B3", "info", `Execution mode changed to ${radio.value}.`);
    });
  });

  document.querySelectorAll('input[name="input-mode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      appState.simulation.inputMode = radio.value;
      pushLog("b3-1", "info", `Input mode set to ${radio.value}.`);
      pushHistory("B3", "info", `Mock input mode changed to ${radio.value}.`);
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;

      switch (action) {
        case "verify-env":
          runPipelineStage("1a", "Verify .env", "Configuration placeholder check completed successfully.");
          appState.runtimeState.envStatus = "Verified";
          break;
        case "check-db":
          runPipelineStage("2a", "Check DB", "Database placeholder state reports: exists = false.");
          appState.runtimeState.databaseStatus = "Checked";
          break;
        case "inspect-db":
          runPipelineStage("2a", "Inspect DB", "Database placeholder inspection completed. No rows inspected in frontend mode.");
          break;
        case "delete-db":
          runPipelineStage("2a", "Delete DB", "Database placeholder delete action completed. Future wiring should ask for confirmation.");
          appState.runtimeState.databaseStatus = "Deleted";
          break;
        case "recreate-db":
          runPipelineStage("2a", "Recreate DB", "Database placeholder recreate action completed. Empty DB state is now represented in UI.");
          appState.runtimeState.databaseStatus = "Empty";
          break;
        case "install-cron":
          runPipelineStage("3a", "Install cron", "Cron placeholder install completed.");
          appState.runtimeState.cronStatus = "Installed";
          break;
        case "check-cron":
          runPipelineStage("3a", "Check cron", "Cron placeholder health check returned healthy.");
          break;
        case "print-cron":
          runPipelineStage("3a", "Print cron", "Cron placeholder output printed to log panel.");
          break;
        case "run-b1":
          setStatus("b1", "running");
          updateStepList("login");
          pushLog("b1", "info", "Login step started.");
          updateStepList("file");
          pushLog("b1", "info", "Required file preparation step completed.");
          updateStepList("2fa");
          pushLog("b1", "info", "2FA verification placeholder completed.");
          completeStepList();
          setStatus("b1", "success");
          pushHistory("B1", "success", "Login flow completed through placeholder login, file, and 2FA steps.");
          break;
        case "run-b2":
          runPipelineStage("b2", "Download 5 files", "Placeholder batch download completed: 5 files marked as downloaded.");
          break;
        case "run-b3-auto":
          [
            ["b3-1", "Mock download", "Mock download complete from /generated_test_data."],
            ["b3-2", "Index", "Index stage completed using real-intended placeholder wiring."],
            ["b3-3", "Parse GPS", "GPS parse stage completed using real-intended placeholder wiring."],
            ["b3-4", "Geocode", "Geocode stage completed using real-intended placeholder wiring."],
            ["b3-5", "Enqueue playback", "Media added to slideshow queue. Playback emulation is now available."],
          ].forEach(([key, name, message]) => runPipelineStage(key, name, message));
          seedDemoState();
          break;
        case "run-b3-1":
          runPipelineStage("b3-1", "Mock download", "Loaded placeholder media from /generated_test_data in single-file mode.");
          break;
        case "run-b3-2":
          runPipelineStage("b3-2", "Index", "Index stage placeholder completed.");
          break;
        case "run-b3-3":
          runPipelineStage("b3-3", "Parse GPS", "GPS parse placeholder completed.");
          break;
        case "run-b3-4":
          runPipelineStage("b3-4", "Geocode", "Geocode placeholder completed.");
          break;
        case "run-b3-5":
          runPipelineStage("b3-5", "Enqueue playback", "Playback queue placeholder now contains media.");
          seedDemoState();
          break;
        case "run-b4":
          setStatus("b4", "running");
          appState.runtimeState.playbackStatus = "Running";
          pushLog("b4", "info", `Playback emulation started for ${appState.runtimeState.currentMedia.name}.`);
          pushHistory("B4", "info", `Playback started for ${appState.runtimeState.currentMedia.name}.`);
          appState.runtimeState.lastCheckpoint = `Playback checkpoint saved at ${nowStamp()}`;
          setStatus("b4", "success");
          pushLog("b4", "success", "Playback emulation completed one frontend-only cycle.");
          renderCurrentState();
          renderPlaybackPreview();
          break;
        case "apply-b5":
          applySimulationControls();
          break;
        case "simulate-screen-off":
          setScreenState("OFF", "timeout or manual simulation");
          break;
        case "simulate-screen-on":
          setScreenState("ON", "activity or manual simulation");
          break;
        case "show-no-run":
          appState.lastRunMode = "none";
          pushLog("c", "info", "Last run view switched to no-run state.");
          renderLastRunView();
          break;
        case "show-last-run-error":
          appState.lastRunMode = "error";
          pushLog("c", "error", "Last run source-of-truth placeholder returned an error.");
          renderLastRunView();
          break;
        case "show-last-run-success":
          appState.lastRunMode = "success";
          pushLog("c", "success", "Last run state loaded from placeholder source of truth.");
          renderLastRunView();
          break;
        case "resume-last-run":
          pushLog("c", "success", "Restore last known state requested. Future backend wiring should resume from persisted checkpoint.");
          pushHistory("C", "success", "Restore last known state button pressed.");
          break;
        default:
          break;
      }

      renderCurrentState();
      renderPlaybackPreview();
      renderRunningProcess();
    });
  });
}

function init() {
  renderHistory();
  renderAllLogs();
  renderCurrentState();
  renderPlaybackPreview();
  renderLastRunView();
  renderRunningProcess();
  wireActions();
}

init();
