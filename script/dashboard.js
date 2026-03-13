/* ─────────────────────────────────────────
   Smart Home UIA — Dashboard JS
───────────────────────────────────────── */

const state = {
  sensors: {
    temp: {
      value: 27.4,
      min: 18,
      max: 40,
      warnLevel: 30,
      alertLevel: 34,
      unit: "°C",
      history: [],
    },
    humidity: {
      value: 62.1,
      min: 30,
      max: 100,
      warnLevel: 75,
      alertLevel: 85,
      unit: "%",
      history: [],
    },
    light: {
      value: 480,
      min: 0,
      max: 1000,
      warnLevel: 800,
      alertLevel: 920,
      unit: "lux",
      history: [],
    },
  },
  devices: [
    {
      id: "d1",
      name: "Living Room Light",
      sub: "Living Room · Smart Bulb",
      on: true,
    },
    { id: "d2", name: "Bedroom Light", sub: "Bedroom · Smart Bulb", on: false },
    { id: "d3", name: "Ceiling Fan", sub: "Living Room · 3-speed", on: true },
    { id: "d4", name: "Front Door", sub: "Entrance · Smart Lock", on: false },
    { id: "d5", name: "AC Unit", sub: "Bedroom · 18000 BTU", on: false },
    { id: "d6", name: "Security Camera", sub: "Garden · 1080p Live", on: true },
  ],
  qa: { autoMode: true, nightMode: false, ecoMode: false, lockDoor: false },
  unreadCount: 5,
};

/* Seed history */
for (const key in state.sensors) {
  const s = state.sensors[key];
  for (let i = 0; i < 8; i++) {
    const j = (Math.random() - 0.5) * (s.max - s.min) * 0.18;
    s.history.push(Math.max(s.min, Math.min(s.max, s.value + j)));
  }
}

/* ── Helpers ── */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ── Clock ── */
function tickClock() {
  const el = $("nav-clock");
  if (el)
    el.textContent = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
}
/* also clock in topbar shares the same id */
setInterval(tickClock, 1000);
tickClock();

/* ── Sensor tick ── */
function tickSensors() {
  const s = state.sensors;
  s.temp.value = clamp(s.temp.value + (Math.random() - 0.46) * 0.6, 22, 38);
  s.humidity.value = clamp(
    s.humidity.value + (Math.random() - 0.48) * 1.4,
    35,
    95,
  );
  s.light.value = clamp(s.light.value + (Math.random() - 0.5) * 28, 50, 980);

  for (const key in s) {
    s[key].history.push(s[key].value);
    if (s[key].history.length > 8) s[key].history.shift();
    renderSensor(key);
  }

  // Alert banner
  if (s.temp.value >= s.temp.alertLevel) {
    showAlertBanner(
      `ALERT: Temperature ${s.temp.value.toFixed(1)}°C — above safe threshold`,
      "error",
    );
  } else if (s.humidity.value >= s.humidity.alertLevel) {
    showAlertBanner(
      `ALERT: Humidity ${s.humidity.value.toFixed(0)}% — dangerously high`,
      "error",
    );
  } else if (
    s.temp.value >= s.temp.warnLevel ||
    s.humidity.value >= s.humidity.warnLevel
  ) {
    showAlertBanner(
      `WARNING: Sensors approaching threshold — monitor closely`,
      "warning",
    );
  } else {
    hideAlertBanner();
  }

  // Status bar update time
  const el = $("last-update");
  if (el)
    el.textContent =
      "Updated " +
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}

function renderSensor(key) {
  const s = state.sensors[key];
  const card = $(`sensor-${key}`);
  if (!card) return;

  const valEl = card.querySelector(".sensor-value");
  const statEl = card.querySelector(".sensor-status");
  const sparks = card.querySelectorAll(".spark-bar");

  if (valEl)
    valEl.textContent =
      key === "light" ? Math.round(s.value) : s.value.toFixed(1);

  const isAlert = s.value >= s.alertLevel;
  const isWarn = s.value >= s.warnLevel;

  card.classList.toggle("alert-state", isAlert);
  card.classList.toggle("warn-state", !isAlert && isWarn);

  if (statEl) {
    statEl.className = "sensor-status";
    if (isAlert) {
      statEl.classList.add("alert");
      statEl.textContent = "ALERT";
    } else if (isWarn) {
      statEl.classList.add("warning");
      statEl.textContent = "WARNING";
    } else {
      statEl.classList.add("normal");
      statEl.textContent = "NORMAL";
    }
  }

  const range = s.max - s.min;
  sparks.forEach((bar, i) => {
    const v = s.history[i] ?? s.value;
    const pct = Math.max(8, Math.round(((v - s.min) / range) * 100));
    bar.style.height = pct + "%";
  });
}

/* ── Alert banner ── */
function showAlertBanner(msg, level) {
  const b = $("alert-banner");
  if (!b) return;
  b.classList.remove("hidden");
  b.style.background = level === "warning" ? "var(--warning)" : "var(--error)";
  const t = b.querySelector(".alert-text");
  const ts = b.querySelector(".alert-time");
  if (t) t.textContent = msg;
  if (ts)
    ts.textContent = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
}

function hideAlertBanner() {
  const b = $("alert-banner");
  if (b) b.classList.add("hidden");
}

/* ── Device toggles ── */
function initDevices() {
  $$(".device-toggle").forEach((input) => {
    input.addEventListener("change", function () {
      const dev = state.devices.find((d) => d.id === this.dataset.id);
      if (!dev) return;
      dev.on = this.checked;

      const item = this.closest(".device-item");
      const badge = item?.querySelector(".device-badge");
      if (item) item.classList.toggle("on", dev.on);
      if (badge) {
        badge.textContent = dev.on
          ? dev.id === "d4"
            ? "LOCKED"
            : "ON"
          : dev.id === "d4"
            ? "UNLOCKED"
            : "OFF";
        badge.className = `device-badge ${dev.on ? "on-badge" : "off-badge"}`;
      }

      const onCount = state.devices.filter((d) => d.on).length;
      const total = state.devices.length;
      [$("devices-online"), $("devices-online-bar")].forEach((el) => {
        if (el) el.textContent = `${onCount}/${total} Online`;
      });

      toast(
        `${dev.name} ${dev.on ? "turned ON" : "turned OFF"}`,
        dev.on ? "success" : "info",
      );
    });
  });
}

/* ── Quick actions ── */
function initQA() {
  $$("[data-qa]").forEach((btn) => {
    btn.addEventListener("click", function () {
      const qa = this.dataset.qa;
      const stEl = this.querySelector(".qa-state");

      if (qa === "all-lights-off") {
        state.devices.forEach((d) => {
          if (["d1", "d2"].includes(d.id)) d.on = false;
        });
        refreshDevices();
        toast("All lights turned OFF", "info");
        return;
      }

      if (qa === "lock-door") {
        state.qa.lockDoor = !state.qa.lockDoor;
        const door = state.devices.find((d) => d.id === "d4");
        if (door) {
          door.on = state.qa.lockDoor;
          refreshDevices();
        }
        this.classList.toggle("active-qa", state.qa.lockDoor);
        if (stEl) {
          stEl.textContent = state.qa.lockDoor ? "LOCKED" : "UNLOCKED";
          stEl.classList.toggle("on", state.qa.lockDoor);
        }
        toast(
          `Front Door ${state.qa.lockDoor ? "LOCKED" : "UNLOCKED"}`,
          "success",
        );
        return;
      }

      const map = {
        "auto-mode": "autoMode",
        "night-mode": "nightMode",
        "eco-mode": "ecoMode",
      };
      const key = map[qa];
      if (key) {
        state.qa[key] = !state.qa[key];
        this.classList.toggle("active-qa", state.qa[key]);
        if (stEl) {
          stEl.textContent = state.qa[key] ? "ON" : "OFF";
          stEl.classList.toggle("on", state.qa[key]);
        }
        toast(
          `${qa.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${state.qa[key] ? "enabled" : "disabled"}`,
          "info",
        );
      }
    });
  });
}

function refreshDevices() {
  state.devices.forEach((dev) => {
    const inp = document.querySelector(`.device-toggle[data-id="${dev.id}"]`);
    if (!inp) return;
    inp.checked = dev.on;
    const item = inp.closest(".device-item");
    const badge = item?.querySelector(".device-badge");
    if (item) item.classList.toggle("on", dev.on);
    if (badge) {
      badge.textContent = dev.on
        ? dev.id === "d4"
          ? "LOCKED"
          : "ON"
        : dev.id === "d4"
          ? "UNLOCKED"
          : "OFF";
      badge.className = `device-badge ${dev.on ? "on-badge" : "off-badge"}`;
    }
  });
  const onCount = state.devices.filter((d) => d.on).length;
  [$("devices-online"), $("devices-online-bar")].forEach((el) => {
    if (el) el.textContent = `${onCount}/${state.devices.length} Online`;
  });
}

/* ── Drawer ── */
function initDrawer() {
  const bell = $("notif-bell");
  const drawer = $("notif-drawer");
  const overlay = $("drawer-overlay");
  const close = $("drawer-close");
  if (!bell || !drawer) return;

  bell.addEventListener("click", () => {
    drawer.classList.add("open");
    overlay.classList.add("open");
    state.unreadCount = 0;
    const badge = $("notif-badge");
    if (badge) badge.style.display = "none";
    // Sync sidebar badge
    if (window.SidebarNav) window.SidebarNav.setBadge(0);
  });

  [close, overlay].forEach((el) => {
    el?.addEventListener("click", () => {
      drawer.classList.remove("open");
      overlay.classList.remove("open");
    });
  });
}

/* ── Alert close ── */
function initAlertClose() {
  $("alert-close")?.addEventListener("click", hideAlertBanner);
}

/* ── Logout ── */
function initLogout() {
  $("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    toast("Signing out…", "info");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);
  });
}

/* ── Toast ── */
function toast(msg, type = "success") {
  document.querySelector(".sh-toast")?.remove();
  const colors = {
    success: "var(--success)",
    info: "var(--primary)",
    error: "var(--error)",
    warning: "var(--warning)",
  };
  const el = document.createElement("div");
  el.className = "sh-toast";
  el.style.cssText = `
    position:fixed;bottom:20px;right:20px;
    background:${colors[type]};border:3px solid #000;box-shadow:4px 4px 0 #000;
    padding:8px 16px;font-family:'Space Grotesk',sans-serif;
    font-size:12px;font-weight:700;color:#fff;
    transform:translateY(60px);opacity:0;
    transition:transform .2s ease,opacity .2s ease;z-index:9999;max-width:260px;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      el.style.transform = "translateY(0)";
      el.style.opacity = "1";
    }),
  );
  setTimeout(() => {
    el.style.transform = "translateY(60px)";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 250);
  }, 2500);
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  Object.keys(state.sensors).forEach(renderSensor);
  showAlertBanner(
    "ALERT: Temperature 34.2°C — above safe threshold in Living Room",
    "error",
  );
  initDevices();
  initQA();
  initDrawer();
  initAlertClose();
  initLogout();
  setInterval(tickSensors, 3000);
});
