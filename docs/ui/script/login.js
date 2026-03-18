/* ─────────────────────────────────────────
   Smart Home UIA — Auth JS
───────────────────────────────────────── */

// ── Toast helper ──────────────────────────
function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " error" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger reflow then show
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("show"));
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

// ── Validate terms checkbox ────────────────
function validateTerms(checkboxId, errorId) {
  const checkbox = document.getElementById(checkboxId);
  const errorEl = document.getElementById(errorId);
  if (!checkbox || !errorEl) return true;

  if (!checkbox.checked) {
    errorEl.classList.add("visible");
    checkbox.focus();
    return false;
  }

  errorEl.classList.remove("visible");
  return true;
}

// ── Simulate Google OAuth click ────────────
function handleGoogleAuth(btnId, checkboxId, errorId, mode) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener("click", function (e) {
    e.preventDefault();

    // If terms checkbox present, validate first
    if (checkboxId && !validateTerms(checkboxId, errorId)) return;

    // Loading state
    btn.classList.add("loading");
    const originalText = btn.querySelector(".btn-label");
    if (originalText) originalText.textContent = "Redirecting…";

    // Simulate redirect delay (replace with real OAuth URL in production)
    setTimeout(() => {
      showToast(
        mode === "login"
          ? "Redirecting to Google Sign-In…"
          : "Redirecting to Google Sign-Up…",
      );

      // In a real app: window.location.href = '/auth/google';
      setTimeout(() => {
        // Redirect sang dashboard
        window.location.href = "./dashboard.html";
      }, 2000);
    }, 600);
  });
}

// ── Terms checkbox live feedback ───────────
function bindCheckboxFeedback(checkboxId, errorId) {
  const checkbox = document.getElementById(checkboxId);
  const errorEl = document.getElementById(errorId);
  if (!checkbox || !errorEl) return;

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) errorEl.classList.remove("visible");
  });
}

// ── Init ──────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Detect current page
  const path = window.location.pathname;
  const isRegister = path.includes("register");

  if (isRegister) {
    handleGoogleAuth("btn-google", "terms-cb", "terms-error-msg", "register");
    bindCheckboxFeedback("terms-cb", "terms-error-msg");
  } else {
    handleGoogleAuth("btn-google", "terms-cb", "terms-error-msg", "login");
    bindCheckboxFeedback("terms-cb", "terms-error-msg");
  }
});
