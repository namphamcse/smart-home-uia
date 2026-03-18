/* ─────────────────────────────────────────
   Smart Home UIA — Security JS
───────────────────────────────────────── */

/* ══ State ═══════════════════════════════ */
const SEC = {
  camActive: false,
  motionEnabled: false,
  recording: false,
  motionDetected: false,
  recSeconds: 0,
  recTimer: null,
  triggerCount: 7,
  stream: null,
  mediaRecorder: null,
  recordedChunks: [],
  prevFrame: null,
  motionTimeout: null,
  snapshotCount: 0,
  lastUpdate: Date.now(),
};

/* ── Helpers ── */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ══ Clock ═══════════════════════════════ */
function tickClock() {
  const now = new Date();
  const ts = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const el = $("nav-clock");
  if (el) el.textContent = ts;
  const hts = $("hud-ts");
  if (hts)
    hts.textContent = now.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
}
setInterval(tickClock, 1000);
tickClock();

/* ══ Camera ══════════════════════════════ */
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false,
    });

    SEC.stream = stream;
    SEC.camActive = true;

    const video = $("cam-video");
    video.srcObject = stream;
    await video.play();

    // Hide placeholder
    $("cam-placeholder").style.display = "none";

    // Update badges
    const badge = $("live-badge");
    badge.classList.remove("offline");
    $("live-badge-text").textContent = "LIVE";

    // Update control button
    $("btn-toggle-cam").classList.add("active");
    $("btn-toggle-cam").querySelector("i").className = "fa-solid fa-video";
    $("cam-btn-label").textContent = "Camera On";

    // Status bar
    $("ssb-cam-led").className = "ssb-led online";
    $("ssb-cam-val").textContent = "1080p Active";
    $("ctrl-status-text").textContent = "Camera active";

    // Resize canvas
    resizeCanvas();

    toast("Camera started", "success");
  } catch (err) {
    toast("Camera access denied — check browser permissions", "error");
    console.warn("Camera error:", err);
  }
}

function stopCamera() {
  if (SEC.stream) {
    SEC.stream.getTracks().forEach((t) => t.stop());
    SEC.stream = null;
  }
  SEC.camActive = false;

  const video = $("cam-video");
  video.srcObject = null;

  $("cam-placeholder").style.display = "";
  $("live-badge").classList.add("offline");
  $("live-badge-text").textContent = "OFFLINE";

  $("btn-toggle-cam").classList.remove("active");
  $("btn-toggle-cam").querySelector("i").className = "fa-solid fa-video-slash";
  $("cam-btn-label").textContent = "Camera Off";

  $("ssb-cam-led").className = "ssb-led offline";
  $("ssb-cam-val").textContent = "Disconnected";
  $("ctrl-status-text").textContent = "Camera off";

  // Stop motion + recording if active
  if (SEC.motionEnabled) disableMotion();
  if (SEC.recording) stopRecording();

  toast("Camera stopped", "info");
}

$("btn-toggle-cam").addEventListener("click", () => {
  if (SEC.camActive) stopCamera();
  else startCamera();
});

$("btn-allow-cam").addEventListener("click", startCamera);

/* ══ Fullscreen ══════════════════════════ */
$("btn-fullscreen").addEventListener("click", () => {
  const panel = $("stream-panel");
  if (!document.fullscreenElement) {
    panel.requestFullscreen?.() || panel.webkitRequestFullscreen?.();
    $("btn-fullscreen").querySelector("i").className = "fa-solid fa-compress";
  } else {
    document.exitFullscreen?.();
    $("btn-fullscreen").querySelector("i").className = "fa-solid fa-expand";
  }
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    $("btn-fullscreen").querySelector("i").className = "fa-solid fa-expand";
  }
  resizeCanvas();
});

/* ══ Snapshot ════════════════════════════ */
$("btn-snapshot").addEventListener("click", () => {
  if (!SEC.camActive) {
    toast("Enable camera first", "warning");
    return;
  }

  const video = $("cam-video");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext("2d").drawImage(video, 0, 0);

  // Flash effect
  const flash = $("snapshot-flash");
  flash.classList.add("snap");
  setTimeout(() => flash.classList.remove("snap"), 150);

  // Download
  SEC.snapshotCount++;
  canvas.toBlob(
    (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `snapshot_${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    },
    "image/jpeg",
    0.92,
  );

  toast(`Snapshot #${SEC.snapshotCount} saved`, "success");
});

/* ══ Canvas resize ═══════════════════════ */
function resizeCanvas() {
  const panel = $("stream-panel");
  const canvas = $("cam-canvas");
  if (!canvas || !panel) return;
  canvas.width = panel.clientWidth;
  canvas.height = panel.clientHeight;
}

window.addEventListener("resize", resizeCanvas);

/* ══ Motion Detection ════════════════════ */
$("btn-motion").addEventListener("click", () => {
  if (!SEC.camActive) {
    toast("Enable camera first", "warning");
    return;
  }
  SEC.motionEnabled ? disableMotion() : enableMotion();
});

function enableMotion() {
  SEC.motionEnabled = true;
  $("btn-motion").classList.add("active");
  $("motion-btn-label").textContent = "Motion: ON";
  $("ssb-motion-val").textContent = "Detection ON";
  $("mc-icon").className = "mc-icon watching";
  $("mc-label").textContent = "IR Sensor: Watching";
  $("mc-status").className = "mc-status watching";
  $("mc-status").textContent = "Watching";
  toast("Motion detection enabled", "success");
  requestAnimationFrame(motionLoop);
}

function disableMotion() {
  SEC.motionEnabled = false;
  SEC.prevFrame = null;
  $("btn-motion").classList.remove("active");
  $("motion-btn-label").textContent = "Motion Detect";
  $("ssb-motion-val").textContent = "Detection OFF";
  $("mc-icon").className = "mc-icon";
  $("mc-icon").querySelector("i").className = "fa-solid fa-eye-slash";
  $("mc-label").textContent = "IR Sensor: Disabled";
  $("mc-status").className = "mc-status disabled";
  $("mc-status").textContent = "Disabled";
  // Clear canvas
  const ctx = $("cam-canvas")?.getContext("2d");
  if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  toast("Motion detection disabled", "info");
}

/* ── Motion detection loop (frame diff) ── */
let lastMotionCheck = 0;

function motionLoop(ts) {
  if (!SEC.motionEnabled) return;
  if (!SEC.camActive) return;

  const video = $("cam-video");
  if (!video || video.readyState < 2) {
    requestAnimationFrame(motionLoop);
    return;
  }

  // Rate-limit to ~10fps for perf
  if (ts - lastMotionCheck < 100) {
    requestAnimationFrame(motionLoop);
    return;
  }
  lastMotionCheck = ts;

  // Off-screen canvas for analysis
  const W = 160,
    H = 90; // small resolution for diff
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const ctx2 = off.getContext("2d");
  ctx2.drawImage(video, 0, 0, W, H);

  const curr = ctx2.getImageData(0, 0, W, H);

  if (SEC.prevFrame) {
    let diff = 0;
    const len = curr.data.length;
    for (let i = 0; i < len; i += 4) {
      diff +=
        Math.abs(curr.data[i] - SEC.prevFrame[i]) +
        Math.abs(curr.data[i + 1] - SEC.prevFrame[i + 1]) +
        Math.abs(curr.data[i + 2] - SEC.prevFrame[i + 2]);
    }
    const score = diff / (W * H * 3);

    if (score > 18) {
      // threshold for motion
      triggerMotion(score);
    } else if (SEC.motionDetected) {
      clearMotion();
    }

    // Draw motion overlay if active
    drawMotionOverlay(score);
  }

  SEC.prevFrame = curr.data.slice();
  requestAnimationFrame(motionLoop);
}

function triggerMotion(score) {
  if (SEC.motionDetected) return;
  SEC.motionDetected = true;
  SEC.triggerCount++;

  // Update UI
  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  $("mc-icon").className = "mc-icon detecting";
  $("mc-icon").querySelector("i").className = "fa-solid fa-person-running";
  $("mc-label").textContent = "IR Sensor: Motion!";
  $("mc-status").className = "mc-status detecting";
  $("mc-status").textContent = "DETECTING";
  $("mc-count").textContent = SEC.triggerCount;
  $("mc-last").textContent = now;
  $("mc-sub").textContent = `Last triggered: ${now}`;

  // Flash border
  const flash = $("motion-flash");
  flash.classList.add("active");
  setTimeout(() => flash.classList.remove("active"), 400);

  // Add intrusion alert
  addIntrusionAlert("Motion detected by camera", "camera");

  // Auto-record if not already
  if (!SEC.recording) startRecording();

  // Clear after 3s
  SEC.motionTimeout = setTimeout(clearMotion, 3000);
}

function clearMotion() {
  SEC.motionDetected = false;
  $("mc-icon").className = "mc-icon watching";
  $("mc-icon").querySelector("i").className = "fa-solid fa-eye";
  $("mc-label").textContent = "IR Sensor: Watching";
  $("mc-status").className = "mc-status watching";
  $("mc-status").textContent = "Watching";
}

function drawMotionOverlay(score) {
  const canvas = $("cam-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (score < 5) return;

  // Intensity bar
  const barW = Math.min((score / 60) * 120, 120);
  const alpha = Math.min(score / 60, 1);
  ctx.fillStyle = `rgba(239,68,68,${alpha * 0.9})`;
  ctx.fillRect(12, canvas.height - 28, barW, 6);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(12, canvas.height - 28, 120, 6);
  ctx.fillStyle = "rgba(255,255,255,.6)";
  ctx.font = "bold 9px Space Grotesk";
  ctx.fillText("MOTION", 14, canvas.height - 33);
}

/* ══ Recording ═══════════════════════════ */
$("btn-record").addEventListener("click", () => {
  if (!SEC.camActive) {
    toast("Enable camera first", "warning");
    return;
  }
  SEC.recording ? stopRecording() : startRecording();
});

function startRecording() {
  if (SEC.recording) return;
  if (!SEC.stream) return;

  try {
    const options = { mimeType: "video/webm;codecs=vp9" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/webm";
    }

    SEC.mediaRecorder = new MediaRecorder(SEC.stream, options);
    SEC.recordedChunks = [];

    SEC.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) SEC.recordedChunks.push(e.data);
    };

    SEC.mediaRecorder.onstop = () => saveRecording();
    SEC.mediaRecorder.start(200);
    SEC.recording = true;
    SEC.recSeconds = 0;

    // UI
    $("rec-badge").classList.add("active");
    $("btn-record").classList.add("record");
    $("rec-btn-label").textContent = "Stop Rec";
    $("ctrl-timer").classList.add("active");

    // Timer
    SEC.recTimer = setInterval(() => {
      SEC.recSeconds++;
      const m = String(Math.floor(SEC.recSeconds / 60)).padStart(2, "0");
      const s = String(SEC.recSeconds % 60).padStart(2, "0");
      $("ctrl-timer").textContent = `${m}:${s}`;
    }, 1000);
  } catch (err) {
    toast("Recording not supported in this browser", "error");
    console.warn(err);
  }
}

function stopRecording() {
  if (!SEC.recording) return;
  SEC.recording = false;

  SEC.mediaRecorder?.stop();

  clearInterval(SEC.recTimer);
  $("rec-badge").classList.remove("active");
  $("btn-record").classList.remove("record");
  $("rec-btn-label").textContent = "Start Rec";
  $("ctrl-timer").classList.remove("active");
  $("ctrl-timer").textContent = "00:00";
}

function saveRecording() {
  const blob = new Blob(SEC.recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const dur = SEC.recSeconds;
  const size = (blob.size / (1024 * 1024)).toFixed(1);
  const ts = new Date();
  const time = ts.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Add to video history
  prependVideoItem({
    url,
    name: `clip_${ts.getTime()}.webm`,
    time,
    dur: `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, "0")}`,
    size: `${size} MB`,
  });

  toast(`Recording saved — ${dur}s, ${size}MB`, "success");
}

/* ══ Intrusion Alerts ════════════════════ */
const ALERTS = [
  {
    id: 1,
    msg: "Motion detected at Front Door (Zone 1)",
    source: "ir",
    time: "09:42",
    resolved: false,
  },
  {
    id: 2,
    msg: "Camera motion triggered — garden area",
    source: "camera",
    time: "09:38",
    resolved: false,
  },
  {
    id: 3,
    msg: "IR sensor activated — Hallway",
    source: "ir",
    time: "08:55",
    resolved: false,
  },
  {
    id: 4,
    msg: "Perimeter breach detected (Zone 2)",
    source: "ir",
    time: "07:12",
    resolved: true,
  },
  {
    id: 5,
    msg: "Motion alert — Living Room entrance",
    source: "camera",
    time: "03:20",
    resolved: true,
  },
];

let alertIdCounter = ALERTS.length + 1;

function renderAlerts() {
  const list = $("alert-list");
  if (!list) return;
  list.innerHTML = ALERTS.map(
    (a, i) => `
    <div class="alert-item" data-alert-id="${a.id}" style="animation-delay:${i * 0.04}s">
      <div class="alert-dot ${a.resolved ? "handled" : "new"}"></div>
      <div class="alert-body">
        <div class="alert-msg">${a.msg}</div>
        <div class="alert-meta">
          <span class="alert-time">${a.time}</span>
          <span class="alert-source ${a.source === "camera" ? "src-camera" : "src-ir"}">${a.source === "camera" ? "Camera" : "IR Sensor"}</span>
        </div>
      </div>
      <button class="btn-resolve ${a.resolved ? "resolved" : ""}" data-id="${a.id}" onclick="resolveAlert(${a.id})">
        ${a.resolved ? "✓ Done" : "Resolve"}
      </button>
    </div>
  `,
  ).join("");

  // Update unresolved count badge
  const unresolved = ALERTS.filter((a) => !a.resolved).length;
  const badge = $("unresolved-count");
  if (badge) {
    badge.textContent = unresolved > 0 ? `${unresolved} NEW` : "All Clear";
    badge.style.background = unresolved > 0 ? "var(--error)" : "var(--success)";
  }
}

function resolveAlert(id) {
  const alert = ALERTS.find((a) => a.id === id);
  if (!alert || alert.resolved) return;
  alert.resolved = true;
  renderAlerts();
  toast("Alert marked as resolved", "success");
}

function addIntrusionAlert(msg, source) {
  const now = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  ALERTS.unshift({
    id: alertIdCounter++,
    msg,
    source,
    time: now,
    resolved: false,
  });
  if (ALERTS.length > 10) ALERTS.pop();
  renderAlerts();
  toast(`⚠ ${msg}`, "error");
}

// Expose globally for inline onclick
window.resolveAlert = resolveAlert;

/* ══ Video History ═══════════════════════ */
const SEED_VIDEOS = [
  {
    name: "clip_motion_0942.webm",
    time: "09:42",
    dur: "0:22",
    size: "4.1 MB",
    url: null,
  },
  {
    name: "clip_motion_0838.webm",
    time: "08:38",
    dur: "0:15",
    size: "2.8 MB",
    url: null,
  },
  {
    name: "clip_motion_0320.webm",
    time: "03:20",
    dur: "0:34",
    size: "6.3 MB",
    url: null,
  },
  {
    name: "clip_schedule_0000.webm",
    time: "00:00",
    dur: "8:00",
    size: "89.2 MB",
    url: null,
  },
];

function renderVideoHistory() {
  const list = $("video-list");
  if (!list) return;
  list.innerHTML = SEED_VIDEOS.map(
    (v, i) => `
    <div class="video-item" style="animation-delay:${i * 0.05}s">
      <div class="video-thumb">
        <i class="fa-solid fa-film"></i>
      </div>
      <div class="video-meta">
        <div class="video-name">${v.name}</div>
        <div class="video-info">${v.time} &nbsp;·&nbsp; ${v.dur} &nbsp;·&nbsp; ${v.size}</div>
      </div>
      <div class="video-actions">
        ${
          v.url
            ? `
          <button class="vid-btn play-btn" onclick="playVideo('${v.url}')" title="Play">
            <i class="fa-solid fa-play"></i>
          </button>
          <a class="vid-btn" href="${v.url}" download="${v.name}" title="Download">
            <i class="fa-solid fa-download"></i>
          </a>
        `
            : `
          <button class="vid-btn" style="opacity:.35;cursor:not-allowed" title="No file">
            <i class="fa-solid fa-play"></i>
          </button>
          <button class="vid-btn" style="opacity:.35;cursor:not-allowed" title="No file">
            <i class="fa-solid fa-download"></i>
          </button>
        `
        }
      </div>
    </div>
  `,
  ).join("");
}

function prependVideoItem(v) {
  SEED_VIDEOS.unshift(v);
  if (SEED_VIDEOS.length > 10) SEED_VIDEOS.pop();
  renderVideoHistory();
}

window.playVideo = function (url) {
  const win = window.open("", "_blank");
  win.document.write(`
    <html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
      <video src="${url}" controls autoplay style="max-width:100%;max-height:100%;"></video>
    </body></html>`);
};

/* ══ Status bar update ═══════════════════ */
setInterval(() => {
  const el = $("ssb-update");
  if (el) {
    const secs = Math.floor((Date.now() - SEC.lastUpdate) / 1000);
    el.textContent = secs < 10 ? "Updated just now" : `Updated ${secs}s ago`;
  }
  SEC.lastUpdate = Date.now();
}, 5000);

/* ══ Simulate IR trigger ══════════════════ */
setInterval(() => {
  if (!SEC.motionEnabled) return;
  if (Math.random() < 0.04) {
    // ~4% chance every 5s
    addIntrusionAlert("IR sensor activated — Front Door zone", "ir");
    SEC.triggerCount++;
    const now = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    $("mc-count").textContent = SEC.triggerCount;
    $("mc-last").textContent = now;
    $("mc-sub").textContent = `Last triggered: ${now}`;
  }
}, 5000);

/* ══ Toast ════════════════════════════════ */
let toastTimer = null;
function toast(msg, type = "success") {
  const el = $("sec-toast");
  const msgEl = $("sec-toast-msg");
  const icon = $("sec-toast-icon");
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  const icons = {
    success: "fa-solid fa-circle-check",
    error: "fa-solid fa-triangle-exclamation",
    info: "fa-solid fa-circle-info",
    warning: "fa-solid fa-circle-exclamation",
  };
  el.className = `sec-toast ${type}`;
  if (msgEl) msgEl.textContent = msg;
  if (icon) icon.className = icons[type] || icons.success;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => el.classList.add("show")),
  );
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ══ Init ════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  renderAlerts();
  renderVideoHistory();
  resizeCanvas();
  toast('Click "Enable Camera" to start live feed', "info");
});
