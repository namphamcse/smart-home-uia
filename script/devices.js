/* ─────────────────────────────────────────
   Smart Home UIA — Devices JS
───────────────────────────────────────── */

/* ══ State ═══════════════════════════════ */
const DevState = {
  selected: "d1",
  filter: "all",
  acTemp: { d5: 24 },
  servoAngle: { d4: 0 },
  fanSpeed: { d3: 2 },
  ledColor: { d1: "#FFFFFF", d2: "#FFFFFF" },
  autoMode: { d1: false, d2: true, d3: false, d4: false, d5: false, d6: true },
  power: { d1: true, d2: false, d3: true, d4: false, d5: false, d6: true },
  temperature: 27.4, // live sensor feed for fan card
};

/* ── Helpers ── */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ══ History Data ════════════════════════ */
const historyDB = {
  d1: [
    { action: "Power ON", source: "app", result: "ok", time: "09:44" },
    {
      action: "Color → White (#FFFFFF)",
      source: "app",
      result: "ok",
      time: "09:44",
    },
    { action: "Power OFF", source: "auto", result: "ok", time: "23:00" },
    {
      action: "Color → Warm White",
      source: "app",
      result: "ok",
      time: "18:32",
    },
    { action: "Power ON", source: "remote", result: "ok", time: "17:01" },
    { action: "Auto Mode enabled", source: "app", result: "ok", time: "08:00" },
    { action: "Power ON", source: "auto", result: "ok", time: "07:00" },
    { action: "Connection lost", source: "auto", result: "err", time: "03:15" },
  ],
  d2: [
    { action: "Auto Mode enabled", source: "app", result: "ok", time: "22:00" },
    {
      action: "Power OFF (schedule)",
      source: "auto",
      result: "ok",
      time: "22:00",
    },
    {
      action: "Color → Blue (#2563EB)",
      source: "app",
      result: "ok",
      time: "20:45",
    },
    { action: "Power ON", source: "remote", result: "ok", time: "19:30" },
    { action: "Power OFF", source: "auto", result: "ok", time: "08:00" },
  ],
  d3: [
    {
      action: "Speed set to Medium",
      source: "app",
      result: "ok",
      time: "09:40",
    },
    { action: "Power ON", source: "app", result: "ok", time: "09:40" },
    {
      action: "Speed set to High",
      source: "remote",
      result: "ok",
      time: "14:22",
    },
    { action: "Power OFF", source: "auto", result: "ok", time: "23:00" },
    { action: "Speed set to Low", source: "app", result: "ok", time: "11:15" },
  ],
  d4: [
    { action: "Door closed (0°)", source: "app", result: "ok", time: "08:12" },
    {
      action: "Door opened (90°)",
      source: "remote",
      result: "ok",
      time: "08:10",
    },
    {
      action: "Auto lock triggered",
      source: "auto",
      result: "ok",
      time: "23:05",
    },
    { action: "Door opened (90°)", source: "app", result: "ok", time: "18:30" },
    {
      action: "Failed to lock — timeout",
      source: "auto",
      result: "err",
      time: "15:00",
    },
  ],
  d5: [
    { action: "Device offline", source: "auto", result: "err", time: "06:00" },
    { action: "Power OFF", source: "auto", result: "ok", time: "23:30" },
    { action: "Temp set to 24°C", source: "app", result: "ok", time: "20:10" },
    { action: "Power ON", source: "app", result: "ok", time: "20:10" },
  ],
  d6: [
    {
      action: "Recording started",
      source: "auto",
      result: "ok",
      time: "00:00",
    },
    {
      action: "Motion alert triggered",
      source: "auto",
      result: "ok",
      time: "08:59",
    },
    { action: "Recording stopped", source: "app", result: "ok", time: "02:30" },
    {
      action: "Camera feed accessed",
      source: "app",
      result: "ok",
      time: "09:42",
    },
  ],
};

const deviceMeta = {
  d1: { name: "Living Room Light", sub: "Living Room · LED Smart Bulb" },
  d2: { name: "Bedroom Light", sub: "Bedroom · LED Smart Bulb" },
  d3: { name: "Ceiling Fan", sub: "Living Room · 3-speed Fan" },
  d4: { name: "Front Door", sub: "Entrance · Servo Smart Lock" },
  d5: { name: "AC Unit", sub: "Bedroom · 18000 BTU" },
  d6: { name: "Security Camera", sub: "Garden · 1080p Live" },
};

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

/* ══ Filter Bar ══════════════════════════ */
function initFilter() {
  $$(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$(".filter-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      DevState.filter = this.dataset.filter;
      applyFilter();
      const titleEl = document.querySelector(".grid-title");
      if (titleEl)
        titleEl.textContent =
          DevState.filter === "all"
            ? "All Devices"
            : this.textContent.trim().replace(/\d+/, "").trim() + " Devices";
    });
  });
}

function applyFilter() {
  $$(".dev-card").forEach((card) => {
    const type = card.dataset.type;
    const show = DevState.filter === "all" || type === DevState.filter;
    card.classList.toggle("hidden-card", !show);
  });
}

/* ══ Card Selection ══════════════════════ */
function initCardSelection() {
  $$(".dev-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      // Don't trigger if clicking a control input
      if (
        e.target.closest(
          "input, button, label, .color-swatch, .color-picker-input",
        )
      )
        return;
      selectCard(this.dataset.id);
    });
  });
}

function selectCard(id) {
  $$(".dev-card").forEach((c) => c.classList.remove("selected"));
  const card = document.querySelector(`.dev-card[data-id="${id}"]`);
  if (card) card.classList.add("selected");
  DevState.selected = id;
  renderHistory(id);
}

/* ══ History Panel ═══════════════════════ */
function renderHistory(id) {
  const meta = deviceMeta[id];
  const list = historyDB[id] || [];
  const nameEl = $("history-device-name");
  const subEl = $("history-device-sub");
  const listEl = $("history-list");
  if (!listEl) return;

  if (nameEl) nameEl.textContent = meta.name;
  if (subEl) subEl.textContent = meta.sub;

  if (!list.length) {
    listEl.innerHTML = `
      <div class="history-empty">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <p>No history yet</p>
      </div>`;
    return;
  }

  const sourceClass = { app: "app", remote: "remote", auto: "auto" };
  const sourceIcon = {
    app: "fa-solid fa-mobile-screen",
    remote: "fa-solid fa-satellite-dish",
    auto: "fa-solid fa-gears",
  };
  const sourceBg = {
    app: "source-app",
    remote: "source-remote",
    auto: "source-auto",
  };

  listEl.innerHTML = list
    .map(
      (item, i) => `
    <div class="history-item" style="animation-delay:${i * 0.04}s">
      <div class="history-icon ${item.result === "err" ? "error" : sourceClass[item.source]}">
        <i class="${item.result === "err" ? "fa-solid fa-triangle-exclamation" : sourceIcon[item.source]}"></i>
      </div>
      <div class="history-body">
        <div class="history-action">${item.action}</div>
        <div class="history-meta">
          <span class="history-time">${item.time}</span>
          <span class="history-source ${sourceBg[item.source]}">${item.source}</span>
        </div>
      </div>
      <span class="history-result ${item.result === "ok" ? "result-ok" : "result-err"}">${item.result === "ok" ? "OK" : "ERR"}</span>
    </div>
  `,
    )
    .join("");
}

/* ══ Power Toggle ════════════════════════ */
function initPowerToggles() {
  $$(".dev-power-toggle").forEach((input) => {
    input.addEventListener("change", function () {
      if (input.disabled) return;
      const id = this.dataset.id;
      const on = this.checked;
      DevState.power[id] = on;

      const card = document.querySelector(`.dev-card[data-id="${id}"]`);
      card?.classList.toggle("is-on", on);

      const lbl = card?.querySelector(".card-toggle-label");
      if (lbl) lbl.textContent = on ? "Power" : "Power";

      addHistoryEntry(id, `Power ${on ? "ON" : "OFF"}`, "app", "ok");
      toast(
        `${deviceMeta[id].name} turned ${on ? "ON" : "OFF"}`,
        on ? "success" : "info",
      );
    });
  });
}

/* ══ Auto Mode Toggle ════════════════════ */
function initAutoToggles() {
  $$(".dev-auto-toggle").forEach((input) => {
    input.addEventListener("change", function () {
      if (input.disabled) return;
      const id = this.dataset.id;
      const auto = this.checked;
      DevState.autoMode[id] = auto;

      const card = document.querySelector(`.dev-card[data-id="${id}"]`);
      const powerInput = card?.querySelector(".dev-power-toggle");
      const statusEl = card?.querySelector(".card-status");
      const existingAutoLabel = card?.querySelector(".auto-label");

      // Disable/enable manual toggle
      if (powerInput) powerInput.disabled = auto;

      // Update status chip
      if (
        statusEl &&
        !statusEl.classList.contains("offline") &&
        !statusEl.classList.contains("error")
      ) {
        if (auto) {
          statusEl.textContent = "Auto";
          statusEl.className = "card-status auto";
        } else {
          statusEl.textContent = "Online";
          statusEl.className = "card-status online";
        }
      }

      // Auto label badge
      if (auto && !existingAutoLabel) {
        const lbl = document.createElement("div");
        lbl.className = "auto-label";
        lbl.textContent = "Auto";
        card?.appendChild(lbl);
      } else if (!auto && existingAutoLabel) {
        existingAutoLabel.remove();
      }

      addHistoryEntry(
        id,
        `Auto Mode ${auto ? "enabled" : "disabled"}`,
        "app",
        "ok",
      );
      toast(`${deviceMeta[id].name}: Auto Mode ${auto ? "ON" : "OFF"}`, "info");
    });
  });
}

/* ══ Color Picker (LED) ══════════════════ */
function initColorControls() {
  // Swatches
  $$(".color-swatch").forEach((swatch) => {
    swatch.addEventListener("click", function (e) {
      e.stopPropagation();
      const card = this.closest(".dev-card");
      const id = card?.dataset.id;
      if (!id) return;
      const color = this.dataset.color;

      card
        .querySelectorAll(".color-swatch")
        .forEach((s) => s.classList.remove("active"));
      this.classList.add("active");

      const preview = $(`${id}-color-preview`);
      if (preview) preview.style.background = color;
      DevState.ledColor[id] = color;

      // Sync custom picker value
      const picker = card.querySelector(".color-picker-input");
      if (picker) picker.value = toHex6(color);

      addHistoryEntry(id, `Color → ${this.title} (${color})`, "app", "ok");
      toast(`${deviceMeta[id].name}: color set to ${this.title}`, "success");
    });
  });

  // Custom color input
  $$(".color-picker-input").forEach((picker) => {
    picker.addEventListener("input", function (e) {
      e.stopPropagation();
      const card = this.closest(".dev-card");
      const id = card?.dataset.id;
      if (!id) return;
      const color = this.value;

      card
        .querySelectorAll(".color-swatch")
        .forEach((s) => s.classList.remove("active"));

      const preview = $(`${id}-color-preview`);
      if (preview) preview.style.background = color;
      DevState.ledColor[id] = color;
    });

    picker.addEventListener("change", function (e) {
      e.stopPropagation();
      const card = this.closest(".dev-card");
      const id = card?.dataset.id;
      if (!id) return;
      addHistoryEntry(id, `Color → Custom (${this.value})`, "app", "ok");
      toast(`${deviceMeta[id].name}: custom color applied`, "success");
    });
  });
}

function toHex6(color) {
  // Handle non-hex colours gracefully
  if (color.startsWith("#") && color.length === 7) return color;
  const tmp = document.createElement("div");
  tmp.style.color = color;
  document.body.appendChild(tmp);
  const rgb = getComputedStyle(tmp).color;
  document.body.removeChild(tmp);
  const m = rgb.match(/\d+/g);
  if (!m) return "#FFFFFF";
  return (
    "#" +
    m
      .slice(0, 3)
      .map((v) => (+v).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

/* ══ Fan Speed ════════════════════════════ */
function initFanControls() {
  $$(".fan-speed-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const id = this.dataset.id;
      const speed = +this.dataset.speed;
      DevState.fanSpeed[id] = speed;

      const card = document.querySelector(`.dev-card[data-id="${id}"]`);
      card
        ?.querySelectorAll(".fan-speed-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const labels = ["", "Low", "Medium", "High"];
      addHistoryEntry(id, `Speed set to ${labels[speed]}`, "app", "ok");
      toast(`${deviceMeta[id].name}: speed → ${labels[speed]}`, "success");
    });
  });
}

/* ══ Door Controls ═══════════════════════ */
function initDoorControls() {
  $$(".door-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const id = this.dataset.id;
      const action = this.dataset.action;
      const target = action === "open" ? 90 : 0;

      animateServo(id, target);

      const card = document.querySelector(`.dev-card[data-id="${id}"]`);
      card?.querySelectorAll(".door-btn").forEach((b) => {
        b.classList.remove("open-btn", "close-btn");
      });

      if (action === "open") {
        btn.classList.add("open-btn");
        const other = card?.querySelector('[data-action="close"]');
        other?.classList.add("close-btn");
      } else {
        btn.classList.add("close-btn");
        const other = card?.querySelector('[data-action="open"]');
        other?.classList.add("open-btn");
      }

      addHistoryEntry(
        id,
        `Door ${action === "open" ? "opened" : "closed"} (${target}°)`,
        "app",
        "ok",
      );
      toast(
        `Front Door ${action === "open" ? "OPENED" : "CLOSED"}`,
        action === "open" ? "success" : "info",
      );
    });
  });
}

function animateServo(id, target) {
  const fill = $(`${id}-servo-fill`);
  const val = $(`${id}-servo-val`);
  if (!fill || !val) return;
  const current = DevState.servoAngle[id] || 0;
  const steps = 30;
  const delta = (target - current) / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    const angle = Math.round(current + delta * step);
    fill.style.width = `${(angle / 180) * 100}%`;
    val.textContent = `${angle}°`;
    if (step >= steps) {
      clearInterval(timer);
      DevState.servoAngle[id] = target;
      fill.style.width = `${(target / 180) * 100}%`;
      val.textContent = `${target}°`;
    }
  }, 15);
}

/* ══ AC Controls ══════════════════════════ */
function initACControls() {
  $$(".ac-temp-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const id = this.dataset.id;
      const dir = +this.dataset.dir;
      DevState.acTemp[id] = Math.max(
        16,
        Math.min(30, (DevState.acTemp[id] || 24) + dir),
      );
      const el = $(`${id}-temp`);
      if (el) el.textContent = `${DevState.acTemp[id]}°C`;
      addHistoryEntry(id, `Temp set to ${DevState.acTemp[id]}°C`, "app", "ok");
      toast(
        `${deviceMeta[id].name}: set to ${DevState.acTemp[id]}°C`,
        "success",
      );
    });
  });
}

/* ══ Live sensor temp on fan card ════════ */
function updateFanTemp() {
  DevState.temperature = Math.max(
    22,
    Math.min(38, DevState.temperature + (Math.random() - 0.48) * 0.5),
  );
  const el = $("d3-temp");
  if (el) {
    const num = el.childNodes[0];
    if (num) num.textContent = DevState.temperature.toFixed(1);
  }
}
setInterval(updateFanTemp, 3000);

/* ══ History helper ══════════════════════ */
function addHistoryEntry(id, action, source, result) {
  const now = new Date();
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!historyDB[id]) historyDB[id] = [];
  historyDB[id].unshift({ action, source, result, time });
  if (historyDB[id].length > 12) historyDB[id].pop();

  if (DevState.selected === id) renderHistory(id);
}

/* ══ Toast ════════════════════════════════ */
let toastTimer = null;

function toast(msg, type = "success") {
  const el = $("ctrl-toast");
  const msgEl = $("toast-msg");
  const icon = $("toast-icon");
  if (!el || !msgEl) return;

  if (toastTimer) clearTimeout(toastTimer);

  const icons = {
    success: "fa-solid fa-circle-check",
    error: "fa-solid fa-circle-xmark",
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-triangle-exclamation",
  };

  el.className = `ctrl-toast ${type}`;
  msgEl.textContent = msg;
  if (icon) icon.className = icons[type] || icons.success;

  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add("show")),
  );

  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ══ Init auto-mode badges on load ══════ */
function initAutoBadges() {
  for (const id in DevState.autoMode) {
    if (!DevState.autoMode[id]) continue;
    const card = document.querySelector(`.dev-card[data-id="${id}"]`);
    if (!card) continue;

    const powerInput = card.querySelector(".dev-power-toggle");
    if (powerInput) powerInput.disabled = true;

    const statusEl = card.querySelector(".card-status");
    if (
      statusEl &&
      !statusEl.classList.contains("offline") &&
      !statusEl.classList.contains("error")
    ) {
      statusEl.textContent = "Auto";
      statusEl.className = "card-status auto";
    }

    if (!card.querySelector(".auto-label")) {
      const lbl = document.createElement("div");
      lbl.className = "auto-label";
      lbl.textContent = "Auto";
      card.appendChild(lbl);
    }
  }
}

/* ══ Init ════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initFilter();
  initCardSelection();
  initPowerToggles();
  initAutoToggles();
  initColorControls();
  initFanControls();
  initDoorControls();
  initACControls();
  initAutoBadges();

  // Render history for default selected card
  renderHistory(DevState.selected);

  // Initial servo state
  animateServo("d4", 0);
});
