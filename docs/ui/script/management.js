/* ─────────────────────────────────────────
   Smart Home UIA — Management JS
───────────────────────────────────────── */

/* ══ Device Data ═════════════════════════ */
const TYPE_ICON = {
  light: "fa-solid fa-lightbulb",
  fan: "fa-solid fa-fan",
  door: "fa-solid fa-door-closed",
  ac: "fa-solid fa-snowflake",
  camera: "fa-solid fa-video",
  sensor: "fa-solid fa-microchip",
};

let devIdCounter = 8;

const DEVICES = [
  {
    id: 1,
    name: "Living Room Light",
    type: "light",
    gpio: "GPIO14",
    location: "Living Room",
    conn: "online",
    state: "on",
    lastSeen: "Just now",
  },
  {
    id: 2,
    name: "Bedroom Light",
    type: "light",
    gpio: "GPIO15",
    location: "Bedroom",
    conn: "online",
    state: "off",
    lastSeen: "2 min ago",
  },
  {
    id: 3,
    name: "Ceiling Fan",
    type: "fan",
    gpio: "GPIO18",
    location: "Living Room",
    conn: "online",
    state: "on",
    lastSeen: "Just now",
  },
  {
    id: 4,
    name: "Front Door",
    type: "door",
    gpio: "GPIO23",
    location: "Entrance",
    conn: "online",
    state: "off",
    lastSeen: "5 min ago",
  },
  {
    id: 5,
    name: "AC Unit",
    type: "ac",
    gpio: "GPIO24",
    location: "Bedroom",
    conn: "error",
    state: "off",
    lastSeen: "6 hr ago",
  },
  {
    id: 6,
    name: "Security Camera",
    type: "camera",
    gpio: "GPIO17",
    location: "Garden",
    conn: "online",
    state: "on",
    lastSeen: "Just now",
  },
  {
    id: 7,
    name: "Temp/Humidity Sensor",
    type: "sensor",
    gpio: "GPIO4",
    location: "Living Room",
    conn: "offline",
    state: "off",
    lastSeen: "2 hr ago",
  },
];

/* ══ Log Data ════════════════════════════ */
let logIdCounter = 100;

const LOG_ENTRIES = [
  {
    id: 1,
    ts: "2026-03-13 09:42:15.221",
    type: "error",
    device: "AC Unit",
    user: "System",
    desc: "Device heartbeat timeout — 3 consecutive missed pings. Marked as ERROR.",
  },
  {
    id: 2,
    ts: "2026-03-13 09:42:01.004",
    type: "command",
    device: "Living Room Light",
    user: "Jane Doe",
    desc: "MQTT command published: topic=home/d1/set, payload=ON, QoS=1. ACK received in 12ms.",
  },
  {
    id: 3,
    ts: "2026-03-13 09:38:44.890",
    type: "connection",
    device: "Security Camera",
    user: "System",
    desc: "WebRTC session established. Resolution: 1080p, frame rate: 30fps.",
  },
  {
    id: 4,
    ts: "2026-03-13 09:30:10.112",
    type: "connection",
    device: "Yolo:Bit MCU",
    user: "System",
    desc: "MQTT broker reconnected after 4-minute outage. 3 queued messages delivered.",
  },
  {
    id: 5,
    ts: "2026-03-13 08:00:00.000",
    type: "command",
    device: "Bedroom Light",
    user: "Jane Doe",
    desc: "Auto Mode enabled. Manual power toggle disabled for this device.",
  },
  {
    id: 6,
    ts: "2026-03-13 07:00:05.340",
    type: "command",
    device: "Living Room Light",
    user: "Automation",
    desc: "Night Mode rule executed: device turned OFF as per schedule.",
  },
  {
    id: 7,
    ts: "2026-03-13 06:33:09.780",
    type: "error",
    device: "Temp/Humidity Sensor",
    user: "System",
    desc: "Sensor disconnected unexpectedly. Wi-Fi dropout suspected. Retrying…",
  },
  {
    id: 8,
    ts: "2026-03-13 06:35:02.001",
    type: "connection",
    device: "Temp/Humidity Sensor",
    user: "System",
    desc: "Sensor reconnected successfully. 2-minute data gap recorded.",
  },
  {
    id: 9,
    ts: "2026-03-13 03:00:00.000",
    type: "command",
    device: "System",
    user: "Scheduler",
    desc: "Daily energy report generated. Total: 4.2 kWh. File saved to /reports.",
  },
  {
    id: 10,
    ts: "2026-03-12 23:05:11.500",
    type: "command",
    device: "Front Door",
    user: "Automation",
    desc: "Auto Lock rule triggered. Servo set to 0° (closed). Servo feedback: OK.",
  },
  {
    id: 11,
    ts: "2026-03-12 23:00:00.000",
    type: "command",
    device: "Living Room Light",
    user: "Automation",
    desc: "Night Mode rule: all lights OFF. Commands dispatched to d1, d2 via MQTT.",
  },
  {
    id: 12,
    ts: "2026-03-12 20:10:44.230",
    type: "command",
    device: "AC Unit",
    user: "Jane Doe",
    desc: "Target temperature changed from 26°C to 24°C. MQTT payload published.",
  },
  {
    id: 13,
    ts: "2026-03-12 18:45:00.000",
    type: "command",
    device: "Bedroom Light",
    user: "Automation",
    desc: "Low-light rule triggered: ambient lux=38 < 50. Bedroom Light turned ON.",
  },
  {
    id: 14,
    ts: "2026-03-12 14:22:10.888",
    type: "command",
    device: "Ceiling Fan",
    user: "Automation",
    desc: "Fan speed escalated to High: room temp reached 32°C (threshold: 30°C).",
  },
  {
    id: 15,
    ts: "2026-03-12 11:02:00.000",
    type: "error",
    device: "MQTT Broker",
    user: "System",
    desc: "Broker connection lost. Packet loss detected on ISP link. Reconnecting…",
  },
  {
    id: 16,
    ts: "2026-03-12 11:06:30.000",
    type: "connection",
    device: "MQTT Broker",
    user: "System",
    desc: "Broker reconnected. All 6 active devices resubscribed to topics.",
  },
  {
    id: 17,
    ts: "2026-03-12 08:30:00.000",
    type: "connection",
    device: "System",
    user: "Jane Doe",
    desc: "Admin session started. Browser: Chrome 122, macOS, IP: 192.168.1.12.",
  },
  {
    id: 18,
    ts: "2026-03-11 23:30:15.000",
    type: "restart",
    device: "AC Unit",
    user: "Jane Doe",
    desc: "Manual restart triggered by admin. Device offline for 18 seconds.",
  },
  {
    id: 19,
    ts: "2026-03-11 14:00:00.000",
    type: "error",
    device: "Security Camera",
    user: "System",
    desc: "Frame rate dropped to 8fps due to network congestion. Alert issued.",
  },
  {
    id: 20,
    ts: "2026-03-11 09:00:00.000",
    type: "command",
    device: "System",
    user: "Jane Doe",
    desc: "Temperature alert threshold updated: 18°C – 34°C. Chart lines refreshed.",
  },
  {
    id: 21,
    ts: "2026-03-10 02:00:00.000",
    type: "restart",
    device: "Yolo:Bit MCU",
    user: "System",
    desc: "Scheduled nightly restart completed. Uptime reset. All sensors reinitialized.",
  },
  {
    id: 22,
    ts: "2026-03-10 00:00:00.000",
    type: "connection",
    device: "System",
    user: "System",
    desc: "System boot completed. All services started. MQTT broker online.",
  },
];

/* ══ State ═══════════════════════════════ */
const MS = {
  devTypeFilter: "all",
  devStatusFilter: "all",
  devSearch: "",
  logTypeFilter: "all",
  logDevFilter: "all",
  logSearch: "",
  logDateFrom: "",
  logDateTo: "",
  activeTab: "devices",
  editDevId: null,
  pendingRestartId: null,
  pendingDeleteId: null,
};

/* ── Helpers ── */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ══ Clock ═══════════════════════════════ */
(function tick() {
  const el = $("nav-clock");
  if (el)
    el.textContent = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  setTimeout(tick, 1000);
})();

/* ══ Summary Cards ═══════════════════════ */
function updateSummary() {
  const online = DEVICES.filter((d) => d.conn === "online").length;
  const offline = DEVICES.filter((d) => d.conn !== "online").length;
  $("sum-online").textContent = online;
  $("sum-offline").textContent = offline;
  $("sum-total-dev").textContent = DEVICES.length;
  $("tab-badge-devices").textContent = DEVICES.length;
  $("tab-badge-log").textContent = LOG_ENTRIES.length;
  const errors24 = LOG_ENTRIES.filter(
    (l) => l.type === "error" && l.ts.startsWith("2026-03-13"),
  ).length;
  $("sum-errors").textContent = errors24;
}

/* ══ Tab switching ═══════════════════════ */
function initTabs() {
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$(".tab-btn").forEach((b) => b.classList.remove("active"));
      $$(".tab-panel").forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      $(`tab-${this.dataset.tab}`)?.classList.add("active");
      MS.activeTab = this.dataset.tab;
    });
  });
}

/* ══ Device Table ════════════════════════ */
function getFilteredDevices() {
  return DEVICES.filter((d) => {
    const typeOk = MS.devTypeFilter === "all" || d.type === MS.devTypeFilter;
    const statusOk =
      MS.devStatusFilter === "all" || d.conn === MS.devStatusFilter;
    const searchOk =
      !MS.devSearch ||
      d.name.toLowerCase().includes(MS.devSearch.toLowerCase()) ||
      d.location.toLowerCase().includes(MS.devSearch.toLowerCase());
    return typeOk && statusOk && searchOk;
  });
}

function renderDeviceTable() {
  const tbody = $("device-tbody");
  if (!tbody) return;
  const rows = getFilteredDevices();

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;font-family:var(--font-head);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--muted);opacity:.4;">No devices match your filter</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((d, i) => {
      const rowClass =
        d.conn === "error"
          ? "row-error"
          : d.conn === "offline"
            ? "row-offline"
            : "";
      const connDot = `<div class="conn-dot ${d.conn}"></div>`;
      const connBadge = `<span class="td-badge badge-${d.conn}">${d.conn.toUpperCase()}</span>`;
      const stateBadge = `<span class="td-badge badge-${d.state}">${d.state.toUpperCase()}</span>`;
      return `
    <tr class="${rowClass}" style="animation-delay:${i * 0.03}s">
      <td style="font-family:var(--font-head);font-size:10px;font-weight:700;color:var(--muted);">${i + 1}</td>
      <td>
        <div class="td-name type-${d.type}">
          <div class="device-icon-sm"><i class="${TYPE_ICON[d.type] || "fa-solid fa-microchip"}"></i></div>
          ${d.name}
        </div>
      </td>
      <td><span class="td-badge badge-${d.type}">${d.type.toUpperCase()}</span></td>
      <td><span class="gpio-code">${d.gpio}</span></td>
      <td style="font-size:11px;color:var(--muted);font-weight:500;">${d.location}</td>
      <td>${connDot}${connBadge}</td>
      <td>${stateBadge}</td>
      <td style="font-size:10px;color:var(--muted);">${d.lastSeen}</td>
      <td>
        <div class="tbl-actions" style="justify-content:center;">
          <button class="tbl-btn edit-dev" data-id="${d.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
          <button class="tbl-btn restart" data-id="${d.id}" title="Restart"><i class="fa-solid fa-rotate"></i></button>
          <button class="tbl-btn del" data-id="${d.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
    })
    .join("");

  bindDeviceTableEvents();
  updateSummary();
}

function bindDeviceTableEvents() {
  $$(".edit-dev").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeviceModal(+btn.dataset.id);
    });
  });

  $$(".restart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      MS.pendingRestartId = +btn.dataset.id;
      const d = DEVICES.find((x) => x.id === MS.pendingRestartId);
      $("restart-sub").textContent = `"${d?.name}" will be restarted.`;
      $("restart-overlay").classList.add("open");
    });
  });

  $$(".tbl-btn.del").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      MS.pendingDeleteId = +btn.dataset.id;
      const d = DEVICES.find((x) => x.id === MS.pendingDeleteId);
      $("delete-sub").textContent = `"${d?.name}" will be permanently deleted.`;
      $("delete-overlay").classList.add("open");
    });
  });
}

/* ── Device type filter & search ── */
function initDeviceFilters() {
  $$("[data-dtype]").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$("[data-dtype]").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      MS.devTypeFilter = this.dataset.dtype;
      renderDeviceTable();
    });
  });

  $$("[data-dstatus]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const wasActive = this.classList.contains("active");
      $$("[data-dstatus]").forEach((b) => b.classList.remove("active"));
      MS.devStatusFilter = wasActive ? "all" : this.dataset.dstatus;
      if (!wasActive) this.classList.add("active");
      renderDeviceTable();
    });
  });

  $("dev-search")?.addEventListener("input", function () {
    MS.devSearch = this.value.trim();
    renderDeviceTable();
  });
}

/* ══ Device Modal ════════════════════════ */
function openDeviceModal(editId = null) {
  MS.editDevId = editId;
  $("device-modal-title").textContent = editId
    ? "Edit Device"
    : "Add New Device";

  if (editId) {
    const d = DEVICES.find((x) => x.id === editId);
    if (!d) return;
    $("f-dev-name").value = d.name;
    $("f-dev-type").value = d.type;
    $("f-dev-gpio").value = d.gpio;
    $("f-dev-location").value = d.location;
    $("f-dev-conn").value = d.conn;
    $("f-dev-state").value = d.state;
  } else {
    $("f-dev-name").value = "";
    $("f-dev-type").value = "light";
    $("f-dev-gpio").value = "";
    $("f-dev-location").value = "";
    $("f-dev-conn").value = "online";
    $("f-dev-state").value = "off";
  }
  $("device-modal-overlay").classList.add("open");
}

function closeDeviceModal() {
  $("device-modal-overlay").classList.remove("open");
  MS.editDevId = null;
}

$("device-modal-close")?.addEventListener("click", closeDeviceModal);
$("btn-cancel-device")?.addEventListener("click", closeDeviceModal);
$("device-modal-overlay")?.addEventListener("click", (e) => {
  if (e.target === $("device-modal-overlay")) closeDeviceModal();
});
$("btn-add-device")?.addEventListener("click", () => openDeviceModal());

$("btn-save-device")?.addEventListener("click", () => {
  const name = $("f-dev-name").value.trim();
  const type = $("f-dev-type").value;
  const gpio = $("f-dev-gpio").value.trim();
  const location = $("f-dev-location").value.trim();
  const conn = $("f-dev-conn").value;
  const state = $("f-dev-state").value;

  if (!name) {
    toast("Device name is required", "warning");
    return;
  }
  if (!gpio) {
    toast("GPIO pin is required", "warning");
    return;
  }
  if (!location) {
    toast("Location is required", "warning");
    return;
  }

  if (MS.editDevId) {
    const d = DEVICES.find((x) => x.id === MS.editDevId);
    if (d) Object.assign(d, { name, type, gpio, location, conn, state });
    addLog(
      "command",
      name,
      "Jane Doe",
      `Device configuration updated: type=${type}, gpio=${gpio}, location=${location}.`,
    );
    toast(`Device "${name}" updated`, "success");
  } else {
    DEVICES.push({
      id: ++devIdCounter,
      name,
      type,
      gpio,
      location,
      conn,
      state,
      lastSeen: "Just added",
    });
    addLog(
      "connection",
      name,
      "Jane Doe",
      `New device "${name}" registered (${type}, ${gpio}, ${location}).`,
    );
    toast(`Device "${name}" added`, "success");
  }

  closeDeviceModal();
  renderDeviceTable();
  updateLogDeviceFilter();
});

/* ══ Restart + Delete Confirm ════════════ */
$("btn-confirm-restart")?.addEventListener("click", () => {
  const d = DEVICES.find((x) => x.id === MS.pendingRestartId);
  if (d) {
    d.conn = "offline";
    d.lastSeen = "Restarting…";
    renderDeviceTable();
    addLog(
      "restart",
      d.name,
      "Jane Doe",
      `Device restart initiated. Expected reconnection in ~15 seconds.`,
    );
    toast(`Restarting "${d.name}"…`, "warning");
    setTimeout(() => {
      d.conn = "online";
      d.lastSeen = "Just now";
      renderDeviceTable();
      addLog(
        "connection",
        d.name,
        "System",
        `Device reconnected after restart. All subscriptions restored.`,
      );
      renderLogTable();
      toast(`"${d.name}" is back online`, "success");
    }, 4000);
  }
  $("restart-overlay").classList.remove("open");
});

$("btn-cancel-restart")?.addEventListener("click", () =>
  $("restart-overlay").classList.remove("open"),
);

$("btn-confirm-delete")?.addEventListener("click", () => {
  const idx = DEVICES.findIndex((x) => x.id === MS.pendingDeleteId);
  if (idx >= 0) {
    const name = DEVICES[idx].name;
    DEVICES.splice(idx, 1);
    addLog(
      "command",
      name,
      "Jane Doe",
      `Device "${name}" permanently deleted from system.`,
    );
    toast(`"${name}" deleted`, "error");
    renderDeviceTable();
    renderLogTable();
    updateLogDeviceFilter();
  }
  $("delete-overlay").classList.remove("open");
});

$("btn-cancel-delete")?.addEventListener("click", () =>
  $("delete-overlay").classList.remove("open"),
);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("device-modal-overlay").classList.remove("open");
    $("restart-overlay").classList.remove("open");
    $("delete-overlay").classList.remove("open");
  }
});

/* ══ Log Table ═══════════════════════════ */
function addLog(type, device, user, desc) {
  const now = new Date();
  const ts = now.toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
  LOG_ENTRIES.unshift({ id: ++logIdCounter, ts, type, device, user, desc });
  if (LOG_ENTRIES.length > 60) LOG_ENTRIES.pop();
  $("tab-badge-log").textContent = LOG_ENTRIES.length;
}

function getFilteredLog() {
  return LOG_ENTRIES.filter((l) => {
    const typeOk = MS.logTypeFilter === "all" || l.type === MS.logTypeFilter;
    const devOk = MS.logDevFilter === "all" || l.device === MS.logDevFilter;
    const searchOk =
      !MS.logSearch ||
      l.desc.toLowerCase().includes(MS.logSearch.toLowerCase()) ||
      l.device.toLowerCase().includes(MS.logSearch.toLowerCase());
    const fromOk = !MS.logDateFrom || l.ts >= MS.logDateFrom;
    const toOk = !MS.logDateTo || l.ts <= MS.logDateTo + " 23:59:59";
    return typeOk && devOk && searchOk && fromOk && toOk;
  });
}

const LOG_TYPE_LABELS = {
  connection: "Connection",
  error: "Error",
  command: "Command",
  restart: "Restart",
  info: "Info",
};
const LOG_TYPE_CSS = {
  connection: "lt-connection",
  error: "lt-error",
  command: "lt-command",
  restart: "lt-restart",
  info: "lt-info",
};

function renderLogTable() {
  const tbody = $("log-tbody");
  if (!tbody) return;
  const rows = getFilteredLog();

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;font-family:var(--font-head);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--muted);opacity:.4;">No log entries match your filter</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((l, i) => {
      const rowClass =
        l.type === "error"
          ? "log-row-error"
          : l.type === "restart"
            ? "log-row-warn"
            : "";
      return `
    <tr class="${rowClass}" style="animation-delay:${i * 0.02}s">
      <td class="ts-cell">${l.ts}</td>
      <td><span class="log-type-badge ${LOG_TYPE_CSS[l.type] || "lt-info"}">${LOG_TYPE_LABELS[l.type] || l.type}</span></td>
      <td style="font-family:var(--font-head);font-size:11px;font-weight:700;white-space:nowrap;">${l.device}</td>
      <td style="font-size:11px;white-space:nowrap;">${l.user}</td>
      <td><div class="log-desc">${l.desc}</div></td>
    </tr>`;
    })
    .join("");
}

/* Log filters */
function initLogFilters() {
  $$("[data-ltype]").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$("[data-ltype]").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      MS.logTypeFilter = this.dataset.ltype;
      renderLogTable();
    });
  });

  $("log-device-filter")?.addEventListener("change", function () {
    MS.logDevFilter = this.value;
    renderLogTable();
  });

  $("log-search")?.addEventListener("input", function () {
    MS.logSearch = this.value.trim();
    renderLogTable();
  });

  $("log-date-from")?.addEventListener("change", function () {
    MS.logDateFrom = this.value;
    renderLogTable();
  });

  $("log-date-to")?.addEventListener("change", function () {
    MS.logDateTo = this.value;
    renderLogTable();
  });
}

function updateLogDeviceFilter() {
  const sel = $("log-device-filter");
  if (!sel) return;
  const current = sel.value;
  const devices = [...new Set(LOG_ENTRIES.map((l) => l.device))].sort();
  sel.innerHTML = '<option value="all">All Devices</option>';
  devices.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    if (d === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

/* ══ Export Log ══════════════════════════ */
$("btn-export-log")?.addEventListener("click", () => {
  const rows = getFilteredLog();
  const headers = ["Timestamp", "Event Type", "Device", "User", "Description"];
  const lines = [headers.join(",")];
  rows.forEach((l) => {
    const safe = [
      l.ts,
      l.type,
      l.device,
      l.user,
      `"${l.desc.replace(/"/g, '""')}"`,
    ];
    lines.push(safe.join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `system_log_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`Log exported — ${rows.length} entries`, "success");
});

/* ══ Toast ════════════════════════════════ */
let toastTimer = null;
function toast(msg, type = "success") {
  const el = $("mgmt-toast"),
    msgEl = $("toast-msg"),
    icon = $("toast-icon");
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  const icons = {
    success: "fa-solid fa-circle-check",
    error: "fa-solid fa-circle-xmark",
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-triangle-exclamation",
  };
  el.className = `mgmt-toast ${type}`;
  if (msgEl) msgEl.textContent = msg;
  if (icon) icon.className = icons[type];
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add("show")),
  );
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ══ Live status simulation ══════════════ */
setInterval(() => {
  // Occasionally flip a device's lastSeen
  const online = DEVICES.filter((d) => d.conn === "online");
  if (online.length) {
    const d = online[Math.floor(Math.random() * online.length)];
    d.lastSeen = "Just now";
    if (MS.activeTab === "devices") renderDeviceTable();
  }
}, 8000);

/* ══ Init ════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initDeviceFilters();
  initLogFilters();
  renderDeviceTable();
  renderLogTable();
  updateSummary();
  updateLogDeviceFilter();
});
