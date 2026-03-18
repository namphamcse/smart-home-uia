/* ─────────────────────────────────────────
   Smart Home UIA — Notifications JS
───────────────────────────────────────── */

/* ══ Data ════════════════════════════════ */
const TYPE_META = {
  alert: {
    label: "Alert",
    icon: "fa-solid fa-triangle-exclamation",
    iconBg: "#FEE2E2",
    iconColor: "#EF4444",
    badge: "badge-alert",
    navHref: "environment.html",
    navLabel: "Go to Environment",
  },
  intrusion: {
    label: "Intrusion",
    icon: "fa-solid fa-user-secret",
    iconBg: "#EDE9FE",
    iconColor: "#7C3AED",
    badge: "badge-intrusion",
    navHref: "security.html",
    navLabel: "Go to Security",
  },
  device: {
    label: "Device",
    icon: "fa-solid fa-sliders",
    iconBg: "#FFEDD5",
    iconColor: "#F97316",
    badge: "badge-device",
    navHref: "devices.html",
    navLabel: "Go to Devices",
  },
  system: {
    label: "System",
    icon: "fa-solid fa-gear",
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
    badge: "badge-system",
    navHref: "dashboard.html",
    navLabel: "Go to Dashboard",
  },
};

const SEVERITY = {
  alert: "High",
  intrusion: "Critical",
  device: "Medium",
  system: "Low",
};

// 28 seed notifications
const RAW_NOTIFS = [
  {
    id: 1,
    type: "alert",
    title: "Temperature exceeded alert threshold",
    preview: "Sensor reading 34.2°C — above max limit of 34°C.",
    device: "Temp Sensor",
    time: "Today · 09:42",
    read: false,
    desc: "The temperature sensor in the Living Room recorded 34.2°C at 09:42, exceeding the configured alert threshold of 34°C. The ceiling fan was auto-activated to regulate airflow.",
  },
  {
    id: 2,
    type: "intrusion",
    title: "Motion detected at Front Door (Zone 1)",
    preview: "IR sensor triggered — unrecognised movement pattern.",
    device: "IR Sensor Z1",
    time: "Today · 09:38",
    read: false,
    desc: "The PIR infrared sensor at Zone 1 (Front Door) detected motion at 09:38. The security camera simultaneously captured activity. No authorised entry was logged at this time.",
  },
  {
    id: 3,
    type: "device",
    title: "Bedroom Light disconnected unexpectedly",
    preview: "Device went offline without a manual command.",
    device: "Bedroom Light",
    time: "Today · 09:20",
    read: false,
    desc: "The Bedroom Light smart bulb lost connection to the MQTT broker at 09:20 without receiving a shutdown command. Possible causes: power interruption, Wi-Fi drop, or hardware fault.",
  },
  {
    id: 4,
    type: "system",
    title: "Yolo:Bit firmware update available",
    preview: "Version 2.4.1 ready to install — 2.3 MB download.",
    device: "Yolo:Bit MCU",
    time: "Today · 08:00",
    read: false,
    desc: "A firmware update for the Yolo:Bit microcontroller is available (v2.4.1). This update includes improved MQTT stability, reduced power consumption and a fix for the ADC sampling bug reported in v2.3.",
  },
  {
    id: 5,
    type: "alert",
    title: "Humidity warning — rising trend detected",
    preview: "Humidity at 74%, approaching alert threshold of 85%.",
    device: "Humidity Sensor",
    time: "Today · 07:55",
    read: false,
    desc: "Humidity has been rising steadily for the past 40 minutes and reached 74% at 07:55. The configured warning threshold is 75%. At current rate, the alert threshold of 85% may be reached within the hour.",
  },
  {
    id: 6,
    type: "intrusion",
    title: "Camera motion alert — garden area",
    preview: "Security camera detected movement at perimeter.",
    device: "Security Camera",
    time: "Today · 07:30",
    read: true,
    desc: "The garden security camera detected significant pixel-level motion at 07:30 (frame-diff score: 42). A 22-second clip was automatically recorded and saved to local storage.",
  },
  {
    id: 7,
    type: "device",
    title: "AC Unit offline — no heartbeat received",
    preview: "AC Unit failed to respond to 3 consecutive pings.",
    device: "AC Unit",
    time: "Today · 06:00",
    read: true,
    desc: "The AC Unit stopped responding to MQTT heartbeat requests at 06:00. After 3 missed heartbeats (60-second interval), the system marked the device as offline. Manual power check recommended.",
  },
  {
    id: 8,
    type: "system",
    title: "Daily energy report generated",
    preview: "Total consumption: 4.2 kWh — within normal range.",
    device: "System",
    time: "Today · 03:00",
    read: true,
    desc: "The scheduled daily energy report was generated at 03:00 covering Yesterday. Total energy consumed: 4.2 kWh across all active devices. Highest consumer: AC Unit (2.1 kWh). Report saved to /reports/energy_daily.",
  },
  {
    id: 9,
    type: "alert",
    title: "Light level dropped — auto-light triggered",
    preview: "Lux dropped below 50 — Living Room light activated.",
    device: "Light Sensor",
    time: "Yesterday · 18:45",
    read: true,
    desc: 'The ambient light sensor recorded a lux level of 38 at 18:45, falling below the configured threshold of 50 lux. The automation rule "Evening Lighting" activated the Living Room Light automatically.',
  },
  {
    id: 10,
    type: "device",
    title: "Ceiling Fan auto-speed adjustment",
    preview: "Speed increased to High due to temperature spike.",
    device: "Ceiling Fan",
    time: "Yesterday · 14:22",
    read: true,
    desc: "The Ceiling Fan speed was automatically increased from Medium to High at 14:22 by the Auto Mode rule tied to the temperature sensor. Room temperature had reached 32°C, triggering the escalation rule.",
  },
  {
    id: 11,
    type: "intrusion",
    title: "Front door left open — 10 minute alert",
    preview: "Door servo angle remained at 90° for over 10 minutes.",
    device: "Front Door",
    time: "Yesterday · 12:10",
    read: true,
    desc: 'The smart lock servo position remained at 90° (open) for 10 minutes without a close command being issued. This triggered the "door left open" alert. No manual intervention was recorded during this period.',
  },
  {
    id: 12,
    type: "system",
    title: "MQTT broker reconnected after dropout",
    preview: "Connection restored — 4-minute outage from 11:02–11:06.",
    device: "MQTT Broker",
    time: "Yesterday · 11:06",
    read: true,
    desc: "The MQTT broker connection was interrupted at 11:02 and re-established at 11:06, a 4-minute outage. During this window, 3 device commands were queued and delivered upon reconnection. Root cause: ISP-side packet loss.",
  },
  {
    id: 13,
    type: "alert",
    title: "Temperature normalised after alert",
    preview: "Temp returned to 27.1°C — below warning threshold.",
    device: "Temp Sensor",
    time: "Yesterday · 10:15",
    read: true,
    desc: "Following the temperature alert at 09:42, the ceiling fan successfully reduced the Living Room temperature to 27.1°C by 10:15. The alert state was automatically cleared and the system returned to normal monitoring mode.",
  },
  {
    id: 14,
    type: "device",
    title: "Security Camera recording started",
    preview: "Auto-record triggered by motion detection event.",
    device: "Security Camera",
    time: "Yesterday · 09:38",
    read: true,
    desc: "The Security Camera began recording at 09:38 in response to the IR sensor motion trigger (Event #2). Recording lasted 22 seconds and captured 4.1 MB of footage. File saved as clip_motion_0938.webm.",
  },
  {
    id: 15,
    type: "system",
    title: 'Automation rule "Night Mode" executed',
    preview: "Lights and fan turned off at 23:00 by schedule.",
    device: "Automation Engine",
    time: "Yesterday · 23:00",
    read: true,
    desc: "The scheduled Night Mode automation rule executed at 23:00 as configured. Actions performed: Living Room Light OFF, Bedroom Light OFF, Ceiling Fan OFF, Security Camera set to continuous recording mode.",
  },
  {
    id: 16,
    type: "alert",
    title: "Humidity alert cleared — back to normal",
    preview: "Humidity at 61% — well within safe operating range.",
    device: "Humidity Sensor",
    time: "2 days ago · 20:30",
    read: true,
    desc: "The humidity alert that was triggered earlier in the day has been cleared. Humidity has stabilised at 61% following opening of windows as suggested by the system recommendation notice.",
  },
  {
    id: 17,
    type: "device",
    title: "Living Room Light colour changed",
    preview: "RGB changed to #2563EB via app — by Jane Doe.",
    device: "Living Room Light",
    time: "2 days ago · 19:45",
    read: true,
    desc: "User Jane Doe (App session, IP 192.168.1.12) changed the Living Room Light colour to #2563EB (Blue) via the Device Control interface. Previous colour: #FFFFFF. Command acknowledged by MQTT in 12ms.",
  },
  {
    id: 18,
    type: "intrusion",
    title: "Perimeter sensor activated — Zone 2",
    preview: "Hallway IR sensor triggered — no authorised entry logged.",
    device: "IR Sensor Z2",
    time: "2 days ago · 03:20",
    read: true,
    desc: "The Zone 2 (Hallway) PIR sensor was triggered at 03:20. No door unlock event preceded this trigger, and no authorised access was logged. Camera footage was reviewed — likely a pet movement or insect interference.",
  },
  {
    id: 19,
    type: "system",
    title: "System backup completed successfully",
    preview: "Config + history backup uploaded to cloud storage.",
    device: "System",
    time: "2 days ago · 02:00",
    read: true,
    desc: "The nightly system backup completed at 02:00. Contents: device configuration, automation rules, 7-day sensor history, and alert log. Backup size: 1.8 MB. Destination: S3-compatible cloud bucket (encrypted at rest).",
  },
  {
    id: 20,
    type: "device",
    title: "Bedroom Light Auto Mode enabled",
    preview: "Manual control disabled — schedule now governs power.",
    device: "Bedroom Light",
    time: "2 days ago · 08:00",
    read: true,
    desc: "Auto Mode was enabled for the Bedroom Light by user Jane Doe at 08:00. The device will now follow the configured automation schedule: ON at sunset, OFF at 22:00. Manual power toggle has been disabled until Auto Mode is turned off.",
  },
  {
    id: 21,
    type: "alert",
    title: "Light sensor disconnected briefly",
    preview: "Sensor offline for 2 minutes — data gap recorded.",
    device: "Light Sensor",
    time: "3 days ago · 06:33",
    read: true,
    desc: "The ambient light sensor went offline for approximately 2 minutes (06:33–06:35), likely due to a Wi-Fi channel congestion event. A data gap of 2 minutes is recorded in the sensor history. The sensor reconnected automatically.",
  },
  {
    id: 22,
    type: "system",
    title: "New user session started",
    preview: "Jane Doe logged in from Chrome — 192.168.1.12.",
    device: "Auth Service",
    time: "3 days ago · 08:30",
    read: true,
    desc: "A new authenticated session was created for user Jane Doe (role: Administrator) at 08:30 from browser Chrome 122 on macOS. Source IP: 192.168.1.12 (local network). Session token expires in 24 hours.",
  },
  {
    id: 23,
    type: "device",
    title: "Front Door auto-locked by schedule",
    preview: "Servo closed to 0° at 23:05 — Night Mode rule.",
    device: "Front Door",
    time: "3 days ago · 23:05",
    read: true,
    desc: 'The automation rule "Auto Lock at Night" triggered at 23:05 and closed the Front Door servo to 0° (locked position). The previous state was 0° (already closed), so no physical actuation was required — state confirmed via servo feedback.',
  },
  {
    id: 24,
    type: "intrusion",
    title: "Motion alert — Living Room entrance",
    preview: "Camera + IR sensor both triggered simultaneously.",
    device: "Multi-sensor",
    time: "3 days ago · 15:30",
    read: true,
    desc: "A simultaneous trigger from both the living room PIR sensor and the security camera was recorded at 15:30. Cross-sensor confirmation increases confidence in a genuine intrusion event. A 34-second recording was captured.",
  },
  {
    id: 25,
    type: "alert",
    title: "Temperature spike detected — rapid rise",
    preview: "Temp rose 4°C in 8 minutes — possible HVAC fault.",
    device: "Temp Sensor",
    time: "4 days ago · 13:00",
    read: true,
    desc: "A rapid temperature increase of 4°C (from 26°C to 30°C) was detected over an 8-minute window at 13:00. The rate of change exceeded the anomaly detection threshold. This may indicate HVAC failure or an external heat source. Ceiling Fan escalated to High speed automatically.",
  },
  {
    id: 26,
    type: "system",
    title: "Alert threshold updated for Temperature",
    preview: "New threshold: 18°C–34°C — saved by Jane Doe.",
    device: "System Config",
    time: "4 days ago · 09:00",
    read: true,
    desc: "User Jane Doe updated the temperature alert thresholds via the Environment screen at 09:00. Previous thresholds: 20°C–32°C. New thresholds: 18°C–34°C. The change was applied immediately and the chart was updated to reflect the new warning and alert lines.",
  },
  {
    id: 27,
    type: "device",
    title: "AC Unit set to 24°C",
    preview: "Target temperature adjusted from 26°C to 24°C via app.",
    device: "AC Unit",
    time: "4 days ago · 20:10",
    read: true,
    desc: "User Jane Doe adjusted the AC Unit target temperature from 26°C to 24°C at 20:10 via the Device Control screen. The command was delivered via MQTT to the Yolo:Bit MCU and acknowledged in 18ms. Cooling mode remains active.",
  },
  {
    id: 28,
    type: "system",
    title: "Weekly performance report generated",
    preview: "System uptime: 99.3% — 2 device errors this week.",
    device: "System",
    time: "5 days ago · 00:00",
    read: true,
    desc: "The weekly system performance report was generated covering the past 7 days. Key metrics: system uptime 99.3% (downtime: ~28 mins), device errors: 2 (AC Unit offline, Light Sensor dropout), total alerts: 14, intrusion events: 4, avg. temperature: 26.8°C, avg. humidity: 58.2%.",
  },
];

/* ══ State ═══════════════════════════════ */
const NS = {
  notifications: RAW_NOTIFS.map((n) => ({ ...n })),
  typeFilter: "all",
  readFilter: "all",
  selectedIds: new Set(),
  currentPage: 1,
  pageSize: 10,
};

/* ── Helpers ── */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

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

/* ══ Filtering ═══════════════════════════ */
function getFiltered() {
  return NS.notifications.filter((n) => {
    const typeOk = NS.typeFilter === "all" || n.type === NS.typeFilter;
    const readOk =
      NS.readFilter === "all" ||
      (NS.readFilter === "unread" && !n.read) ||
      (NS.readFilter === "read" && n.read);
    return typeOk && readOk;
  });
}

function getPage(list) {
  const start = (NS.currentPage - 1) * NS.pageSize;
  return list.slice(start, start + NS.pageSize);
}

/* ══ Counts ══════════════════════════════ */
function updateCounts() {
  const unreadTotal = NS.notifications.filter((n) => !n.read).length;

  $("cnt-all").textContent = NS.notifications.length;
  $("cnt-alert").textContent = NS.notifications.filter(
    (n) => n.type === "alert",
  ).length;
  $("cnt-intrusion").textContent = NS.notifications.filter(
    (n) => n.type === "intrusion",
  ).length;
  $("cnt-device").textContent = NS.notifications.filter(
    (n) => n.type === "device",
  ).length;
  $("cnt-system").textContent = NS.notifications.filter(
    (n) => n.type === "system",
  ).length;

  // Update sidebar badge
  if (window.SidebarNav) window.SidebarNav.setBadge(unreadTotal);
}

/* ══ Render List ═════════════════════════ */
function renderList() {
  const filtered = getFiltered();
  const pageItems = getPage(filtered);
  const container = $("notif-list");
  const emptyEl = $("empty-state");

  if (!container) return;

  if (pageItems.length === 0) {
    container.innerHTML = "";
    emptyEl?.classList.add("visible");
  } else {
    emptyEl?.classList.remove("visible");
    container.innerHTML = pageItems.map((n, i) => renderItem(n, i)).join("");
    bindItemEvents();
  }

  updateCounts();
  renderPagination(filtered.length);
  updateBulkBar();
}

function renderItem(n, i) {
  const meta = TYPE_META[n.type];
  const selected = NS.selectedIds.has(n.id);

  return `
  <div class="notif-item type-${n.type} ${n.read ? "" : "unread"} ${selected ? "selected" : ""}"
       data-id="${n.id}" style="animation-delay:${i * 0.03}s">

    <div class="notif-checkbox ${selected ? "checked" : ""}" data-cb-id="${n.id}">
      ${selected ? '<i class="fa-solid fa-check"></i>' : ""}
    </div>

    <div class="notif-icon">
      <i class="${meta.icon}" style="color:${meta.iconColor};"></i>
    </div>

    <div class="notif-body">
      <div class="notif-title-row">
        <span class="notif-title">${n.title}</span>
        <span class="notif-type-badge ${meta.badge}">${meta.label}</span>
      </div>
      <div class="notif-preview">${n.preview}</div>
      <div class="notif-meta">
        ${n.device ? `<span class="notif-device"><i class="fa-solid fa-microchip" style="font-size:8px;"></i> ${n.device}</span>` : ""}
        <span class="notif-time"><i class="fa-regular fa-clock" style="font-size:9px;margin-right:3px;"></i>${n.time}</span>
        <div class="notif-unread-dot"></div>
      </div>
    </div>

    <div class="notif-actions">
      <button class="btn-mark-read" data-mr-id="${n.id}" title="Mark as read">
        <i class="fa-solid fa-check"></i> Read
      </button>
    </div>
  </div>`;
}

/* ══ Item Events ═════════════════════════ */
function bindItemEvents() {
  // Click item → open modal
  $$(".notif-item").forEach((el) => {
    el.addEventListener("click", function (e) {
      if (e.target.closest(".notif-checkbox, .btn-mark-read")) return;
      openModal(+this.dataset.id);
    });
  });

  // Checkbox toggle
  $$(".notif-checkbox").forEach((cb) => {
    cb.addEventListener("click", function (e) {
      e.stopPropagation();
      const id = +this.dataset.cbId;
      if (NS.selectedIds.has(id)) NS.selectedIds.delete(id);
      else NS.selectedIds.add(id);
      renderList();
    });
  });

  // Mark single as read
  $$(".btn-mark-read").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      const id = +this.dataset.mrId;
      markRead([id]);
    });
  });
}

/* ══ Pagination ══════════════════════════ */
function renderPagination(totalFiltered) {
  const totalPages = Math.max(1, Math.ceil(totalFiltered / NS.pageSize));
  NS.currentPage = Math.min(NS.currentPage, totalPages);

  const start = (NS.currentPage - 1) * NS.pageSize + 1;
  const end = Math.min(NS.currentPage * NS.pageSize, totalFiltered);

  $("page-info").textContent = `Page ${NS.currentPage} of ${totalPages}`;
  $("pag-summary").textContent =
    `Showing ${totalFiltered ? start : 0}–${end} of ${totalFiltered}`;
  $("btn-prev").disabled = NS.currentPage <= 1;
  $("btn-next").disabled = NS.currentPage >= totalPages;
  $("btn-load-more").style.display = NS.currentPage < totalPages ? "" : "none";

  // Page number buttons
  const btnWrap = $("page-btns");
  if (!btnWrap) return;
  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    if (
      totalPages > 6 &&
      i > 2 &&
      i < totalPages - 1 &&
      Math.abs(i - NS.currentPage) > 1
    ) {
      if (i === 3 || i === totalPages - 2)
        html += `<span class="page-ellipsis">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i === NS.currentPage ? "active" : ""}" data-pg="${i}">${i}</button>`;
  }
  btnWrap.innerHTML = html;
  btnWrap.querySelectorAll(".page-btn").forEach((b) => {
    b.addEventListener("click", () => {
      NS.currentPage = +b.dataset.pg;
      renderList();
    });
  });
}

$("btn-prev").addEventListener("click", () => {
  NS.currentPage--;
  renderList();
});
$("btn-next").addEventListener("click", () => {
  NS.currentPage++;
  renderList();
});
$("btn-load-more").addEventListener("click", () => {
  NS.currentPage++;
  renderList();
});

/* ══ Bulk Action Bar ═════════════════════ */
function updateBulkBar() {
  const bar = $("bulk-bar");
  const hasSelected = NS.selectedIds.size > 0;
  bar?.classList.toggle("visible", hasSelected);
  $("bulk-count").textContent = `${NS.selectedIds.size} selected`;

  // All-select checkbox state
  const pageItems = getPage(getFiltered());
  const pageIds = new Set(pageItems.map((n) => n.id));
  const allSelected =
    pageIds.size > 0 && [...pageIds].every((id) => NS.selectedIds.has(id));
  const cb = $("bulk-checkbox");
  const icon = cb?.querySelector("i");
  cb?.classList.toggle("checked", allSelected);
  if (icon) icon.style.display = allSelected ? "" : "none";
}

$("bulk-select-all")?.addEventListener("click", () => {
  const pageItems = getPage(getFiltered());
  const pageIds = pageItems.map((n) => n.id);
  const allSelected = pageIds.every((id) => NS.selectedIds.has(id));
  if (allSelected) pageIds.forEach((id) => NS.selectedIds.delete(id));
  else pageIds.forEach((id) => NS.selectedIds.add(id));
  renderList();
});

$("btn-mark-all-read")?.addEventListener("click", () => {
  const ids = [...NS.selectedIds];
  markRead(ids);
  NS.selectedIds.clear();
  toast(
    `${ids.length} notification${ids.length > 1 ? "s" : ""} marked as read`,
    "success",
  );
  renderList();
});

$("btn-delete-read")?.addEventListener("click", () => {
  const ids = [...NS.selectedIds];
  const readIds = ids.filter(
    (id) => NS.notifications.find((n) => n.id === id)?.read,
  );
  if (readIds.length === 0) {
    toast("Select read notifications to delete", "warning");
    return;
  }
  NS.notifications = NS.notifications.filter((n) => !readIds.includes(n.id));
  readIds.forEach((id) => NS.selectedIds.delete(id));
  toast(
    `${readIds.length} notification${readIds.length > 1 ? "s" : ""} deleted`,
    "info",
  );
  renderList();
});

$("btn-clear-selection")?.addEventListener("click", () => {
  NS.selectedIds.clear();
  renderList();
});

/* ══ Mark Read ═══════════════════════════ */
function markRead(ids) {
  ids.forEach((id) => {
    const n = NS.notifications.find((n) => n.id === id);
    if (n) n.read = true;
    NS.selectedIds.delete(id);
  });
  renderList();
  if (ids.length === 1) toast("Marked as read", "success");
}

/* ══ Filter Handlers ═════════════════════ */
function initFilters() {
  $$("[data-type]").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$("[data-type]").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      NS.typeFilter = this.dataset.type;
      NS.currentPage = 1;
      NS.selectedIds.clear();
      renderList();
    });
  });

  $$("[data-read]").forEach((btn) => {
    btn.addEventListener("click", function () {
      $$("[data-read]").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      NS.readFilter = this.dataset.read;
      NS.currentPage = 1;
      NS.selectedIds.clear();
      renderList();
    });
  });
}

/* ══ Modal ═══════════════════════════════ */
function openModal(id) {
  const n = NS.notifications.find((n) => n.id === id);
  if (!n) return;

  const meta = TYPE_META[n.type];

  // Populate
  $("modal-icon").style.background = meta.iconBg;
  $("modal-icon").style.border = "2.5px solid #000";
  $("modal-icon-i").className = meta.icon;
  $("modal-icon-i").style.color = meta.iconColor;
  $("modal-title").textContent = n.title;
  $("modal-badge").className = `modal-badge ${meta.badge}`;
  $("modal-badge").textContent = meta.label;
  $("modal-time").textContent = n.time;
  $("modal-device").textContent = n.device || "N/A";
  $("modal-type").textContent = meta.label;
  $("modal-severity").textContent = SEVERITY[n.type];
  $("modal-desc").textContent = n.desc;

  const navBtn = $("modal-nav-btn");
  navBtn.href = meta.navHref;
  $("modal-nav-label").textContent = meta.navLabel;

  $("modal-read-status").style.display = n.read ? "flex" : "none";

  // Auto-mark as read on open
  if (!n.read) {
    n.read = true;
    setTimeout(() => {
      $("modal-read-status").style.display = "flex";
      renderList();
    }, 600);
  }

  $("modal-overlay").classList.add("open");
}

function closeModal() {
  $("modal-overlay").classList.remove("open");
  renderList();
}

$("modal-close")?.addEventListener("click", closeModal);
$("btn-modal-close-footer")?.addEventListener("click", closeModal);
$("modal-overlay")?.addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ══ Toast ════════════════════════════════ */
let toastTimer = null;
function toast(msg, type = "success") {
  const el = $("ntf-toast");
  const msgEl = $("ntf-toast-msg");
  const icon = $("ntf-toast-icon");
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  const icons = {
    success: "fa-solid fa-circle-check",
    error: "fa-solid fa-circle-xmark",
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-triangle-exclamation",
  };
  el.className = `ntf-toast ${type}`;
  if (msgEl) msgEl.textContent = msg;
  if (icon) icon.className = icons[type] || icons.success;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add("show")),
  );
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ══ Init ════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  renderList();
});
