/* ─────────────────────────────────────────
   Smart Home UIA — Automation JS
───────────────────────────────────────── */

/* ══ Seed Data ═══════════════════════════ */
const DEVICE_NAMES = {
  d1: "Living Room Light",
  d2: "Bedroom Light",
  d3: "Ceiling Fan",
  d4: "Front Door",
  d5: "AC Unit",
  d6: "Security Camera",
};
const ACTION_LABELS = {
  on: "Turn ON",
  off: "Turn OFF",
  angle: "Set Angle",
  speed_low: "Speed: Low",
  speed_med: "Speed: Med",
  speed_high: "Speed: High",
  temp_set: "Set Temp",
};
const SENSOR_LABELS = {
  temp: "Temperature",
  hum: "Humidity",
  light: "Light Level",
};
const SENSOR_UNITS = { temp: "°C", hum: "%", light: "lux" };
const OP_LABELS = { gt: ">", lt: "<", gte: "≥", lte: "≤", eq: "=" };

let idCounter = 9;

const RULES = [
  {
    id: 1,
    name: "Auto Fan — Heat",
    type: "sensor",
    active: true,
    sensor: "temp",
    op: "gt",
    threshold: 33,
    device: "d3",
    action: "speed_high",
    extra: null,
    lastRun: "Today · 09:42",
    days: [],
    time: "",
  },
  {
    id: 2,
    name: "Night Mode — Lights Off",
    type: "schedule",
    active: true,
    sensor: null,
    op: null,
    threshold: null,
    device: "d1",
    action: "off",
    extra: null,
    lastRun: "Today · 23:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    time: "23:00",
  },
  {
    id: 3,
    name: "Low Light — Auto Lamp",
    type: "sensor",
    active: true,
    sensor: "light",
    op: "lt",
    threshold: 50,
    device: "d2",
    action: "on",
    extra: null,
    lastRun: "Yesterday · 18:45",
    days: [],
    time: "",
  },
  {
    id: 4,
    name: "High Humidity — AC On",
    type: "sensor",
    active: false,
    sensor: "hum",
    op: "gt",
    threshold: 80,
    device: "d5",
    action: "on",
    extra: null,
    lastRun: "2 days ago",
    days: [],
    time: "",
  },
  {
    id: 5,
    name: "Morning Routine",
    type: "schedule",
    active: true,
    sensor: null,
    op: null,
    threshold: null,
    device: "d1",
    action: "on",
    extra: null,
    lastRun: "Today · 07:00",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    time: "07:00",
  },
  {
    id: 6,
    name: "Auto Lock — Night",
    type: "schedule",
    active: true,
    sensor: null,
    op: null,
    threshold: null,
    device: "d4",
    action: "angle",
    extra: 0,
    lastRun: "Today · 23:05",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    time: "23:05",
  },
  {
    id: 7,
    name: "Overheat Shutdown",
    type: "sensor",
    active: false,
    sensor: "temp",
    op: "gt",
    threshold: 38,
    device: "d5",
    action: "off",
    extra: null,
    lastRun: "Never",
    days: [],
    time: "",
  },
  {
    id: 8,
    name: "Weekend Chill Mode",
    type: "schedule",
    active: true,
    sensor: null,
    op: null,
    threshold: null,
    device: "d3",
    action: "speed_low",
    extra: null,
    lastRun: "Yesterday · 10:00",
    days: ["Sat", "Sun"],
    time: "10:00",
  },
];

const LOG_ENTRIES = [
  {
    ruleId: 1,
    ruleName: "Auto Fan — Heat",
    time: "Today · 09:42",
    result: "ok",
  },
  {
    ruleId: 2,
    ruleName: "Night Mode — Lights Off",
    time: "Today · 23:00",
    result: "ok",
  },
  {
    ruleId: 5,
    ruleName: "Morning Routine",
    time: "Today · 07:00",
    result: "ok",
  },
  {
    ruleId: 6,
    ruleName: "Auto Lock — Night",
    time: "Today · 23:05",
    result: "ok",
  },
  {
    ruleId: 3,
    ruleName: "Low Light — Auto Lamp",
    time: "Yesterday · 18:45",
    result: "ok",
  },
  {
    ruleId: 8,
    ruleName: "Weekend Chill Mode",
    time: "Yesterday · 10:00",
    result: "ok",
  },
  {
    ruleId: 1,
    ruleName: "Auto Fan — Heat",
    time: "Yesterday · 14:22",
    result: "ok",
  },
  {
    ruleId: 2,
    ruleName: "Night Mode — Lights Off",
    time: "Yesterday · 23:00",
    result: "err",
  },
  {
    ruleId: 5,
    ruleName: "Morning Routine",
    time: "Yesterday · 07:00",
    result: "ok",
  },
  {
    ruleId: 6,
    ruleName: "Auto Lock — Night",
    time: "Yesterday · 23:05",
    result: "ok",
  },
  {
    ruleId: 4,
    ruleName: "High Humidity — AC On",
    time: "2 days ago · 16:30",
    result: "err",
  },
  {
    ruleId: 3,
    ruleName: "Low Light — Auto Lamp",
    time: "2 days ago · 19:00",
    result: "ok",
  },
];

/* ══ State ═══════════════════════════════ */
const AS = {
  typeFilter: "all",
  statusFilter: "all",
  searchQuery: "",
  logRuleFilter: "all",
  logResultFilter: "all",
  editingId: null,
  pendingDeleteId: null,
};

/* ── Helpers ── */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ══ Clock ═══════════════════════════════ */
(function tickClock() {
  const el = $("nav-clock");
  if (el)
    el.textContent = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  setTimeout(tickClock, 1000);
})();

/* ══ Summary Bar ═════════════════════════ */
function updateSummary() {
  $("sb-total").textContent = RULES.length;
  $("sb-active").textContent = RULES.filter((r) => r.active).length;
  $("sb-sensor").textContent = RULES.filter((r) => r.type === "sensor").length;
  $("sb-sched").textContent = RULES.filter((r) => r.type === "schedule").length;
  $("sb-exec").textContent = LOG_ENTRIES.filter((l) =>
    l.time.startsWith("Today"),
  ).length;
}

/* ══ Rule Condition String ═══════════════ */
function conditionStr(r) {
  if (r.type === "sensor") {
    const sLabel = SENSOR_LABELS[r.sensor] || r.sensor;
    const unit = SENSOR_UNITS[r.sensor] || "";
    const op = OP_LABELS[r.op] || r.op;
    const action = ACTION_LABELS[r.action] || r.action;
    const dev = DEVICE_NAMES[r.device] || r.device;
    const extra = r.extra != null ? ` (${r.extra}°)` : "";
    return {
      cond: `${sLabel} ${op} ${r.threshold}${unit}`,
      act: `${dev} → ${action}${extra}`,
    };
  } else {
    const days = r.days?.length === 7 ? "Every day" : r.days?.join(", ") || "";
    const action = ACTION_LABELS[r.action] || r.action;
    const dev = DEVICE_NAMES[r.device] || r.device;
    return { cond: `${r.time} · ${days}`, act: `${dev} → ${action}` };
  }
}

/* ══ Rule List Render ════════════════════ */
function getFilteredRules() {
  return RULES.filter((r) => {
    const typeOk = AS.typeFilter === "all" || r.type === AS.typeFilter;
    const statusOk =
      AS.statusFilter === "all" ||
      (AS.statusFilter === "active" ? r.active : !r.active);
    const searchOk =
      !AS.searchQuery ||
      r.name.toLowerCase().includes(AS.searchQuery.toLowerCase());
    return typeOk && statusOk && searchOk;
  });
}

function renderRules() {
  const list = $("rules-list");
  const emptyEl = $("rules-empty");
  const filtered = getFilteredRules();

  $("rules-count").textContent =
    `${filtered.length} rule${filtered.length !== 1 ? "s" : ""}`;

  if (!filtered.length) {
    list.innerHTML = "";
    emptyEl?.classList.add("visible");
    return;
  }

  emptyEl?.classList.remove("visible");

  list.innerHTML = filtered
    .map((r, i) => {
      const { cond, act } = conditionStr(r);
      const typeIcon =
        r.type === "sensor" ? "fa-solid fa-microchip" : "fa-solid fa-clock";
      const typeBadge = r.type === "sensor" ? "badge-sensor" : "badge-schedule";
      const typeLabel = r.type === "sensor" ? "Sensor" : "Schedule";

      return `
    <div class="rule-card ${r.active ? "" : "inactive"}" data-id="${r.id}" data-type="${r.type}"
         style="animation-delay:${i * 0.05}s">
      <div class="rule-head">
        <div class="rule-type-icon"><i class="${typeIcon}"></i></div>
        <div class="rule-meta">
          <div class="rule-name">${r.name}</div>
          <span class="rule-type-badge ${typeBadge}">${typeLabel}</span>
        </div>
        <label class="rule-toggle" title="${r.active ? "Disable" : "Enable"} rule" onclick="event.stopPropagation()">
          <input type="checkbox" class="rule-toggle-input" data-id="${r.id}" ${r.active ? "checked" : ""}>
          <div class="rule-toggle-track"></div>
          <div class="rule-toggle-thumb"></div>
        </label>
      </div>

      <div class="rule-condition">
        <span class="cond-part">${cond}</span>
        <div class="cond-arrow"><i class="fa-solid fa-arrow-right"></i></div>
        <span class="cond-action">${act}</span>
      </div>

      <div class="rule-footer">
        <span class="rule-last-run">
          <i class="fa-regular fa-clock" style="font-size:9px;"></i>
          ${r.lastRun}
        </span>
        <div class="rule-actions">
          <button class="rule-act-btn edit-btn" data-id="${r.id}" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="rule-act-btn del" data-id="${r.id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>`;
    })
    .join("");

  bindRuleEvents();
  updateSummary();
}

/* ══ Rule Events ═════════════════════════ */
function bindRuleEvents() {
  // Toggle
  $$(".rule-toggle-input").forEach((input) => {
    input.addEventListener("change", function () {
      const rule = RULES.find((r) => r.id === +this.dataset.id);
      if (!rule) return;
      rule.active = this.checked;
      addLog(rule.name, rule.active ? "ok" : "ok");
      renderRules();
      renderLog();
      toast(
        `"${rule.name}" ${rule.active ? "enabled" : "disabled"}`,
        rule.active ? "success" : "info",
      );
    });
  });

  // Edit
  $$(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      openModal(+this.dataset.id);
    });
  });

  // Delete
  $$(".rule-act-btn.del").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      AS.pendingDeleteId = +this.dataset.id;
      const rule = RULES.find((r) => r.id === AS.pendingDeleteId);
      $("confirm-sub").textContent =
        `"${rule?.name}" will be permanently removed.`;
      $("confirm-overlay").classList.add("open");
    });
  });
}

/* Delete confirm */
$("btn-confirm-del")?.addEventListener("click", () => {
  const idx = RULES.findIndex((r) => r.id === AS.pendingDeleteId);
  if (idx >= 0) {
    const name = RULES[idx].name;
    RULES.splice(idx, 1);
    toast(`Rule "${name}" deleted`, "error");
    renderRules();
    renderLog();
  }
  $("confirm-overlay").classList.remove("open");
});

$("btn-confirm-cancel")?.addEventListener("click", () =>
  $("confirm-overlay").classList.remove("open"),
);

/* ══ Filters ═════════════════════════════ */
function initFilters() {
  $$("[data-type]").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$("[data-type]").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      AS.typeFilter = this.dataset.type;
      renderRules();
    });
  });

  $$("[data-status]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const wasActive = this.classList.contains("active");
      $$("[data-status]").forEach((b) => b.classList.remove("active"));
      if (!wasActive) {
        this.classList.add("active");
        AS.statusFilter = this.dataset.status;
      } else AS.statusFilter = "all";
      renderRules();
    });
  });

  $("search-input")?.addEventListener("input", function () {
    AS.searchQuery = this.value.trim();
    renderRules();
  });
}

/* ══ Modal ═══════════════════════════════ */
function openModal(editId = null) {
  AS.editingId = editId;
  const isEdit = editId != null;
  $("modal-title").textContent = isEdit ? "Edit Rule" : "Create New Rule";

  if (isEdit) {
    const r = RULES.find((r) => r.id === editId);
    if (!r) return;
    $("f-name").value = r.name;
    $("f-device").value = r.device;
    $("f-action").value = r.action;

    setTriggerType(r.type);

    if (r.type === "sensor") {
      $("f-sensor").value = r.sensor;
      $("f-operator").value = r.op;
      $("f-threshold").value = r.threshold;
    } else {
      $("f-time").value = r.time;
      $$(".day-cb").forEach((cb) => {
        cb.classList.toggle("checked", r.days.includes(cb.dataset.day));
      });
    }

    if (r.extra != null) $("f-extra").value = r.extra;
  } else {
    // Reset
    $("f-name").value = "";
    $("f-sensor").value = "temp";
    $("f-operator").value = "gt";
    $("f-threshold").value = "";
    $("f-device").value = "d1";
    $("f-action").value = "on";
    $("f-time").value = "23:00";
    $("f-extra").value = "";
    $$(".day-cb").forEach((cb) =>
      cb.classList.toggle(
        "checked",
        ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(cb.dataset.day),
      ),
    );
    setTriggerType("sensor");
  }

  updateExtraField();
  $("modal-overlay").classList.add("open");
}

function closeModal() {
  $("modal-overlay").classList.remove("open");
  AS.editingId = null;
}

$("modal-close")?.addEventListener("click", closeModal);
$("btn-cancel-modal")?.addEventListener("click", closeModal);
$("modal-overlay")?.addEventListener("click", (e) => {
  if (e.target === $("modal-overlay")) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    $("confirm-overlay").classList.remove("open");
  }
});

$("btn-create-rule")?.addEventListener("click", () => openModal());

/* Trigger type tabs */
$$(".trigger-type-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    setTriggerType(this.dataset.trigger);
  });
});

function setTriggerType(type) {
  $$(".trigger-type-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.trigger === type),
  );
  $("section-sensor").classList.toggle("active", type === "sensor");
  $("section-schedule").classList.toggle("active", type === "schedule");
}

/* Day checkbox */
$$(".day-cb").forEach((cb) => {
  cb.addEventListener("click", function () {
    this.classList.toggle("checked");
  });
});

/* Action change → extra field */
$("f-action")?.addEventListener("change", updateExtraField);

function updateExtraField() {
  const action = $("f-action")?.value;
  const wrap = $("f-extra-wrap");
  const label = $("f-extra-label");
  if (!wrap) return;
  if (action === "angle") {
    wrap.style.display = "";
    label.textContent = "Angle (0–180°)";
  } else if (action === "temp_set") {
    wrap.style.display = "";
    label.textContent = "Temperature (°C)";
  } else {
    wrap.style.display = "none";
  }
}

/* Save */
$("btn-save-rule")?.addEventListener("click", saveRule);

function saveRule() {
  const name = $("f-name").value.trim();
  if (!name) {
    toast("Rule name is required", "warning");
    return;
  }

  const activeTrigger =
    document.querySelector(".trigger-type-btn.active")?.dataset.trigger ||
    "sensor";
  const device = $("f-device").value;
  const action = $("f-action").value;
  const extra = ["angle", "temp_set"].includes(action)
    ? +$("f-extra").value || null
    : null;

  let sensor = null,
    op = null,
    threshold = null,
    time = "",
    days = [];

  if (activeTrigger === "sensor") {
    sensor = $("f-sensor").value;
    op = $("f-operator").value;
    threshold = parseFloat($("f-threshold").value);
    if (isNaN(threshold)) {
      toast("Enter a valid threshold value", "warning");
      return;
    }
  } else {
    time = $("f-time").value;
    days = [...$$(".day-cb.checked")].map((d) => d.dataset.day);
    if (!time) {
      toast("Select a time for the schedule", "warning");
      return;
    }
    if (!days.length) {
      toast("Select at least one day", "warning");
      return;
    }
  }

  if (AS.editingId != null) {
    const rule = RULES.find((r) => r.id === AS.editingId);
    if (rule) {
      Object.assign(rule, {
        name,
        type: activeTrigger,
        sensor,
        op,
        threshold,
        device,
        action,
        extra,
        time,
        days,
        lastRun: "Edited · just now",
      });
      toast(`Rule "${name}" updated`, "success");
    }
  } else {
    RULES.unshift({
      id: ++idCounter,
      name,
      type: activeTrigger,
      active: true,
      sensor,
      op,
      threshold,
      device,
      action,
      extra,
      time,
      days,
      lastRun: "Never",
    });
    toast(`Rule "${name}" created`, "success");
  }

  closeModal();
  renderRules();
  renderLog();
  updateLogRuleFilter();
}

/* ══ Execution Log ═══════════════════════ */
function addLog(ruleName, result) {
  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const rule = RULES.find((r) => r.name === ruleName);
  LOG_ENTRIES.unshift({
    ruleId: rule?.id || 0,
    ruleName,
    time: `Today · ${now}`,
    result,
  });
  if (LOG_ENTRIES.length > 30) LOG_ENTRIES.pop();
}

function getFilteredLog() {
  return LOG_ENTRIES.filter((l) => {
    const ruleOk =
      AS.logRuleFilter === "all" || l.ruleName === AS.logRuleFilter;
    const resultOk =
      AS.logResultFilter === "all" || l.result === AS.logResultFilter;
    return ruleOk && resultOk;
  });
}

function renderLog() {
  const list = $("log-list");
  if (!list) return;
  const filtered = getFilteredLog();

  if (!filtered.length) {
    list.innerHTML = `<div style="padding:24px;text-align:center;font-family:var(--font-head);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--muted);opacity:.4;">No log entries</div>`;
    return;
  }

  list.innerHTML = filtered
    .map(
      (l, i) => `
    <div class="log-item" style="animation-delay:${i * 0.03}s">
      <div class="log-icon ${l.result}">
        <i class="${l.result === "ok" ? "fa-solid fa-check" : "fa-solid fa-xmark"}"></i>
      </div>
      <div class="log-body">
        <div class="log-rule">${l.ruleName}</div>
        <div class="log-meta">
          <span class="log-time">${l.time}</span>
          <span class="log-result ${l.result === "ok" ? "res-ok" : "res-err"}">${l.result === "ok" ? "OK" : "FAIL"}</span>
        </div>
      </div>
    </div>`,
    )
    .join("");
}

function updateLogRuleFilter() {
  const sel = $("log-rule-filter");
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="all">All Rules</option>';
  RULES.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.name;
    opt.textContent = r.name;
    if (r.name === current) opt.selected = true;
    sel.appendChild(opt);
  });
}

function initLogFilters() {
  $("log-rule-filter")?.addEventListener("change", function () {
    AS.logRuleFilter = this.value;
    renderLog();
  });

  $$("[data-result]").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$("[data-result]").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      AS.logResultFilter = this.dataset.result;
      renderLog();
    });
  });
}

/* ══ Toast ════════════════════════════════ */
let toastTimer = null;
function toast(msg, type = "success") {
  const el = $("auto-toast"),
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
  el.className = `auto-toast ${type}`;
  if (msgEl) msgEl.textContent = msg;
  if (icon) icon.className = icons[type];
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add("show")),
  );
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ══ Simulate periodic execution ════════ */
setInterval(() => {
  const active = RULES.filter((r) => r.active);
  if (!active.length) return;
  const rule = active[Math.floor(Math.random() * active.length)];
  const success = Math.random() > 0.12;
  rule.lastRun = "Today · just now";
  addLog(rule.name, success ? "ok" : "err");
  renderRules();
  renderLog();
}, 15000);

/* ══ Init ════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  initLogFilters();
  renderRules();
  renderLog();
  updateLogRuleFilter();
  updateSummary();
});
