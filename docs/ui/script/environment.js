/* ─────────────────────────────────────────
   Smart Home UIA — Environment JS
───────────────────────────────────────── */

/* ══ Config ══════════════════════════════ */
const SENSORS = {
  temp: {
    label: "Temperature",
    unit: "°C",
    color: "#EF4444",
    value: 27.4,
    min: 18,
    max: 40,
    warnLo: 18,
    warnHi: 30,
    alertHi: 34,
    alertEnabled: true,
    dayMin: 22.1,
    dayMax: 34.2,
  },
  hum: {
    label: "Humidity",
    unit: "%",
    color: "#2563EB",
    value: 62.1,
    min: 0,
    max: 100,
    warnLo: 30,
    warnHi: 75,
    alertHi: 85,
    alertEnabled: true,
    dayMin: 45.0,
    dayMax: 74.3,
  },
  light: {
    label: "Light Level",
    unit: "lux",
    color: "#F97316",
    value: 480,
    min: 0,
    max: 1000,
    warnLo: 0,
    warnHi: 800,
    alertHi: 920,
    alertEnabled: true,
    dayMin: 12,
    dayMax: 892,
  },
};

const THRESHOLDS = {
  temp: { min: 18, max: 34, enabled: true },
  hum: { min: 30, max: 85, enabled: true },
  light: { min: 0, max: 900, enabled: true },
};

const ENV = {
  activeSensor: "temp",
  activeRange: "1h",
  activeThreshSensor: "temp",
  activeLogFilter: "all",
  historyData: { temp: [], hum: [], light: [] },
  chartAnimFrame: null,
};

/* ══ History seed ════════════════════════ */
function seedHistory() {
  const now = Date.now();
  const count = 120; // data points
  ["temp", "hum", "light"].forEach((key) => {
    const s = SENSORS[key];
    let v = s.value;
    for (let i = count; i >= 0; i--) {
      v += (Math.random() - 0.5) * (s.max - s.min) * 0.04;
      v = clamp(v, s.min * 0.8, s.max * 0.95);
      ENV.historyData[key].unshift({ t: now - i * 60 * 1000, v });
    }
  });
}

/* ══ Utilities ═══════════════════════════ */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ══ Clock ═══════════════════════════════ */
function tickClock() {
  const el = $("nav-clock");
  if (el)
    el.textContent = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
}
setInterval(tickClock, 1000);
tickClock();

/* ══ Live sensor tick ════════════════════ */
function tickSensors() {
  const now = Date.now();
  SENSORS.temp.value = clamp(
    SENSORS.temp.value + (Math.random() - 0.46) * 0.5,
    22,
    38,
  );
  SENSORS.hum.value = clamp(
    SENSORS.hum.value + (Math.random() - 0.48) * 1.2,
    35,
    90,
  );
  SENSORS.light.value = clamp(
    SENSORS.light.value + (Math.random() - 0.5) * 25,
    20,
    960,
  );

  // Push to history
  ["temp", "hum", "light"].forEach((key) => {
    ENV.historyData[key].push({ t: now, v: SENSORS[key].value });
    if (ENV.historyData[key].length > 500) ENV.historyData[key].shift();

    // day min/max
    const s = SENSORS[key];
    s.dayMin = Math.min(s.dayMin, s.value);
    s.dayMax = Math.max(s.dayMax, s.value);
  });

  updateOverviewBar();
  updateSensorCards();
  drawChart();
}

/* ══ Overview Bar ════════════════════════ */
function updateOverviewBar() {
  const map = { temp: "ov-temp", hum: "ov-hum", light: "ov-light" };
  const statusMap = {
    temp: "ov-temp-status",
    hum: "ov-hum-status",
    light: "ov-light-status",
  };

  ["temp", "hum", "light"].forEach((key) => {
    const s = SENSORS[key];
    const el = $(map[key]);
    const stEl = $(statusMap[key]);
    if (!el) return;
    el.textContent = key === "light" ? Math.round(s.value) : s.value.toFixed(1);

    const { statusClass, label } = getStatus(key, s.value);
    if (stEl) {
      stEl.className = `ov-status ${statusClass}${statusClass === "alert" ? " ov-blink" : ""}`;
      stEl.textContent = label;
    }
  });
}

function getStatus(key, val) {
  const t = THRESHOLDS[key];
  const s = SENSORS[key];
  if (!t.enabled) return { statusClass: "normal", label: "OK" };
  if (val >= s.alertHi || val <= s.warnLo)
    return { statusClass: "alert", label: "ALERT" };
  if (val >= s.warnHi) return { statusClass: "warning", label: "WARN" };
  return { statusClass: "normal", label: "OK" };
}

/* ══ Sensor Cards ════════════════════════ */
function updateSensorCards() {
  const keyMap = { temp: "temp", hum: "hum", light: "light" };

  ["temp", "hum", "light"].forEach((key) => {
    const s = SENSORS[key];
    const card = $(`scard-${key}`);
    const valEl = $(`sc-${key}-val`);
    const minEl = $(`sc-${key}-min`);
    const maxEl = $(`sc-${key}-max`);
    const badgeEl = $(`sc-${key}-badge`);
    if (!card || !valEl) return;

    valEl.textContent =
      key === "light" ? Math.round(s.value) : s.value.toFixed(1);
    if (minEl)
      minEl.textContent =
        key === "light" ? Math.round(s.dayMin) : s.dayMin.toFixed(1);
    if (maxEl)
      maxEl.textContent =
        key === "light" ? Math.round(s.dayMax) : s.dayMax.toFixed(1);

    const { statusClass, label } = getStatus(key, s.value);
    card.classList.remove("alert-state", "warn-state");
    if (statusClass === "alert") card.classList.add("alert-state");
    if (statusClass === "warning") card.classList.add("warn-state");

    if (badgeEl) {
      badgeEl.className = `scard-badge ${statusClass}`;
      badgeEl.textContent = label;
    }
  });
}

/* ══ Sensor Card selection ═══════════════ */
function initCardSelection() {
  $$(".scard").forEach((card) => {
    card.addEventListener("click", function () {
      const sensor = this.dataset.sensor;
      ENV.activeSensor = sensor;

      $$(".scard").forEach((c) => c.classList.remove("active"));
      this.classList.add("active");

      // sync chart tabs
      $$(".cs-tab").forEach((t) => t.classList.remove("active"));
      const tab = document.querySelector(`.cs-tab[data-sensor="${sensor}"]`);
      if (tab) tab.classList.add("active");

      // sync threshold panel
      setThreshSensor(sensor);

      updateLegend();
      drawChart();
    });
  });
}

/* ══ Chart tabs ══════════════════════════ */
function initChartTabs() {
  $$(".cs-tab").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$(".cs-tab").forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      ENV.activeSensor = this.dataset.sensor;

      // sync scard
      $$(".scard").forEach((c) => c.classList.remove("active"));
      const sc = document.querySelector(
        `.scard[data-sensor="${ENV.activeSensor}"]`,
      );
      if (sc) sc.classList.add("active");

      setThreshSensor(ENV.activeSensor);
      updateLegend();
      drawChart();
    });
  });

  $$(".t-tab").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$(".t-tab").forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      ENV.activeRange = this.dataset.range;
      drawChart();
    });
  });
}

/* ══ Legend ══════════════════════════════ */
function updateLegend() {
  const s = SENSORS[ENV.activeSensor];
  const el = $("legend-sensor-name");
  const line = $("legend-data-line");
  if (el) el.textContent = `${s.label} (${s.unit})`;
  if (line) line.style.background = s.color;
}

/* ══ Canvas Chart ════════════════════════ */
function getFilteredData(key, range) {
  const now = Date.now();
  const ms =
    { "1h": 3600e3, "6h": 21600e3, "24h": 86400e3, "7d": 604800e3 }[range] ||
    3600e3;
  return ENV.historyData[key].filter((p) => p.t >= now - ms);
}

function drawChart() {
  const canvas = $("sensor-chart");
  if (!canvas) return;
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth;
  canvas.height = wrap.clientHeight;

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const PAD = { top: 14, right: 20, bottom: 28, left: 44 };
  const pW = W - PAD.left - PAD.right;
  const pH = H - PAD.top - PAD.bottom;

  ctx.clearRect(0, 0, W, H);

  const key = ENV.activeSensor;
  const s = SENSORS[key];
  const thresh = THRESHOLDS[key];
  const data = getFilteredData(key, ENV.activeRange);

  if (data.length < 2) {
    ctx.fillStyle = "#aaa";
    ctx.font = "600 12px Inter";
    ctx.textAlign = "center";
    ctx.fillText("Collecting data…", W / 2, H / 2);
    return;
  }

  const tMin = data[0].t;
  const tMax = data[data.length - 1].t;
  const vMin = s.min;
  const vMax = s.max;
  const tRange = tMax - tMin || 1;
  const vRange = vMax - vMin || 1;

  const tx = (t) => PAD.left + ((t - tMin) / tRange) * pW;
  const ty = (v) => PAD.top + (1 - (v - vMin) / vRange) * pH;

  /* ── Background grid ── */
  ctx.strokeStyle = "#E5E5E0";
  ctx.lineWidth = 1;
  const gridLines = 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = PAD.top + (pH / gridLines) * i;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + pW, y);
    ctx.stroke();
    // y-axis labels
    const val = vMax - (vRange / gridLines) * i;
    ctx.fillStyle = "#888";
    ctx.font = "600 9px Inter";
    ctx.textAlign = "right";
    ctx.fillText(val.toFixed(key === "light" ? 0 : 1), PAD.left - 4, y + 3);
  }

  /* ── X-axis time labels ── */
  ctx.fillStyle = "#888";
  ctx.font = "600 9px Inter";
  ctx.textAlign = "center";
  const xTicks = 5;
  for (let i = 0; i <= xTicks; i++) {
    const t = tMin + (tRange / xTicks) * i;
    const x = PAD.left + (pW / xTicks) * i;
    const d = new Date(t);
    const label =
      ENV.activeRange === "7d"
        ? d.toLocaleDateString("en-GB", { weekday: "short" })
        : d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    ctx.fillText(label, x, H - PAD.bottom + 12);
  }

  /* ── Threshold lines ── */
  if (thresh.enabled) {
    // Warning line (warnHi)
    const warnY = ty(s.warnHi);
    ctx.save();
    ctx.strokeStyle = "#F97316";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.left, warnY);
    ctx.lineTo(PAD.left + pW, warnY);
    ctx.stroke();
    ctx.fillStyle = "#F97316";
    ctx.font = "bold 8px Inter";
    ctx.textAlign = "right";
    ctx.fillText(`WARN ${s.warnHi}${s.unit}`, PAD.left + pW - 2, warnY - 3);

    // Alert line (alertHi)
    const alertY = ty(s.alertHi);
    ctx.strokeStyle = "#EF4444";
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.left, alertY);
    ctx.lineTo(PAD.left + pW, alertY);
    ctx.stroke();
    ctx.fillStyle = "#EF4444";
    ctx.fillText(`ALERT ${s.alertHi}${s.unit}`, PAD.left + pW - 2, alertY - 3);
    ctx.restore();
  }

  /* ── Gradient fill under chart ── */
  const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + pH);
  grad.addColorStop(0, s.color + "33");
  grad.addColorStop(1, s.color + "00");
  ctx.beginPath();
  data.forEach((p, i) => {
    const x = tx(p.t),
      y = ty(p.v);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(tx(data[data.length - 1].t), PAD.top + pH);
  ctx.lineTo(tx(data[0].t), PAD.top + pH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  /* ── Data line ── */
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  // Shadow for pop
  ctx.shadowColor = s.color + "55";
  ctx.shadowBlur = 4;
  ctx.beginPath();
  data.forEach((p, i) => {
    const x = tx(p.t),
      y = ty(p.v);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();

  /* ── Last value dot ── */
  const last = data[data.length - 1];
  const lx = tx(last.t);
  const ly = ty(last.v);
  ctx.beginPath();
  ctx.arc(lx, ly, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = s.color;
  ctx.lineWidth = 2.5;
  ctx.fill();
  ctx.stroke();

  /* ── Value label at dot ── */
  const label =
    key === "light" ? Math.round(last.v) + " lux" : last.v.toFixed(1) + s.unit;
  ctx.fillStyle = s.color;
  ctx.font = "bold 10px Space Grotesk";
  ctx.textAlign = "center";
  ctx.fillText(label, lx, ly - 10);

  /* ── Chart border ── */
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.strokeRect(PAD.left, PAD.top, pW, pH);
}

/* ══ Threshold Panel ═════════════════════ */
function initThresholdPanel() {
  $$(".thresh-sensor-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      setThreshSensor(this.dataset.tsensor);
    });
  });

  $("btn-save-thresh")?.addEventListener("click", () => {
    const sensor = ENV.activeThreshSensor;
    const minVal = parseFloat($("thresh-min").value);
    const maxVal = parseFloat($("thresh-max").value);
    const enabled = $("thresh-alert-toggle").checked;

    if (isNaN(minVal) || isNaN(maxVal)) {
      toast("Invalid threshold values", "error");
      return;
    }
    if (minVal >= maxVal) {
      toast("Min must be less than Max", "error");
      return;
    }

    THRESHOLDS[sensor].min = minVal;
    THRESHOLDS[sensor].max = maxVal;
    SENSORS[sensor].alertHi = maxVal;
    SENSORS[sensor].warnHi = maxVal * 0.88;
    THRESHOLDS[sensor].enabled = enabled;

    addLog(
      `${SENSORS[sensor].label} threshold updated: ${minVal}–${maxVal}${SENSORS[sensor].unit}`,
      "info",
    );
    toast(`Thresholds saved for ${SENSORS[sensor].label}`, "success");
    drawChart();
  });
}

function setThreshSensor(sensor) {
  ENV.activeThreshSensor = sensor;
  $$(".thresh-sensor-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.tsensor === sensor),
  );
  $("thresh-min").value = THRESHOLDS[sensor].min;
  $("thresh-max").value = THRESHOLDS[sensor].max;
  $("thresh-alert-toggle").checked = THRESHOLDS[sensor].enabled;
}

/* ══ Status Log ══════════════════════════ */
const LOG_DATA = [
  {
    type: "threshold",
    sensor: "temp",
    msg: "Temperature exceeded alert threshold (34°C)",
    time: "09:42",
  },
  {
    type: "threshold",
    sensor: "hum",
    msg: "Humidity crossed warning level (75%)",
    time: "09:16",
  },
  {
    type: "restore",
    sensor: "temp",
    msg: "Temperature returned to normal range",
    time: "08:55",
  },
  {
    type: "disconnect",
    sensor: "light",
    msg: "Light sensor connection lost",
    time: "06:33",
  },
  {
    type: "restore",
    sensor: "light",
    msg: "Light sensor reconnected successfully",
    time: "06:35",
  },
  {
    type: "threshold",
    sensor: "temp",
    msg: "Temperature exceeded alert threshold (34.2°C)",
    time: "03:20",
  },
  {
    type: "info",
    sensor: "hum",
    msg: "Humidity alert threshold updated to 85%",
    time: "08:00",
  },
  {
    type: "restore",
    sensor: "temp",
    msg: "Temperature back within normal range",
    time: "02:50",
  },
  {
    type: "disconnect",
    sensor: "temp",
    msg: "Temperature sensor heartbeat missed (×3)",
    time: "01:10",
  },
  {
    type: "info",
    sensor: "temp",
    msg: "Auto-mode adjusted fan based on temperature",
    time: "00:30",
  },
];

function renderLog() {
  const list = $("log-list");
  if (!list) return;
  const filter = ENV.activeLogFilter;
  const items =
    filter === "all" ? LOG_DATA : LOG_DATA.filter((l) => l.type === filter);

  const iconMap = {
    threshold: "fa-solid fa-triangle-exclamation",
    disconnect: "fa-solid fa-plug-circle-xmark",
    restore: "fa-solid fa-rotate",
    info: "fa-solid fa-circle-info",
  };

  list.innerHTML = items
    .map(
      (item, i) => `
    <div class="log-item" style="animation-delay:${i * 0.04}s">
      <div class="log-dot ${item.type}"></div>
      <div class="log-body">
        <div class="log-msg">${item.msg}</div>
        <div class="log-time">Today · ${item.time} &middot; ${item.sensor.toUpperCase()}</div>
      </div>
      <span class="log-tag tag-${item.type}">${item.type}</span>
    </div>
  `,
    )
    .join("");
}

function addLog(msg, type) {
  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  LOG_DATA.unshift({ type, sensor: ENV.activeSensor, msg, time: now });
  if (LOG_DATA.length > 20) LOG_DATA.pop();
  renderLog();
}

function initLogFilters() {
  $$(".log-filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$(".log-filter-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      ENV.activeLogFilter = this.dataset.logfilter;
      renderLog();
    });
  });
}

/* ══ Export ══════════════════════════════ */
function initExport() {
  $("btn-export-csv")?.addEventListener("click", () => {
    const key = ENV.activeSensor;
    const s = SENSORS[key];
    const data = getFilteredData(key, ENV.activeRange);

    const rows = ["Timestamp,Value,Unit"];
    data.forEach((p) => {
      const dt = new Date(p.t).toISOString();
      const val = key === "light" ? Math.round(p.v) : p.v.toFixed(2);
      rows.push(`${dt},${val},${s.unit}`);
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${key}_${ENV.activeRange}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast(`CSV exported — ${data.length} records`, "success");
    addLog(
      `Data exported to CSV (${ENV.activeRange} range, ${data.length} pts)`,
      "info",
    );
  });

  $("btn-export-pdf")?.addEventListener("click", () => {
    toast("PDF export requires backend — CSV available now", "warning");
  });
}

/* ══ Toast ════════════════════════════════ */
let toastTimer = null;
function toast(msg, type = "success") {
  const el = $("env-toast");
  const msgEl = $("env-toast-msg");
  const icon = $("env-toast-icon");
  if (!el || !msgEl) return;
  if (toastTimer) clearTimeout(toastTimer);
  const icons = {
    success: "fa-solid fa-circle-check",
    error: "fa-solid fa-circle-xmark",
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-triangle-exclamation",
  };
  el.className = `env-toast ${type}`;
  msgEl.textContent = msg;
  if (icon) icon.className = icons[type] || icons.success;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add("show")),
  );
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ══ Resize chart on window resize ══════ */
window.addEventListener("resize", drawChart);

/* ══ Init ════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  seedHistory();
  updateOverviewBar();
  updateSensorCards();
  initCardSelection();
  initChartTabs();
  initThresholdPanel();
  initLogFilters();
  initExport();
  renderLog();
  updateLegend();

  // Draw chart after layout settles
  setTimeout(drawChart, 80);

  // Live tick every 2 seconds
  setInterval(tickSensors, 2000);
});
