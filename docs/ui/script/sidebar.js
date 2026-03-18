/* ─────────────────────────────────────────
   Smart Home UIA — Sidebar Nav Component
   Usage: include sidebar.css + sidebar.js,
   add <div id="app-sidebar"></div> at top of body,
   wrap page content in <div class="page-shell">.
───────────────────────────────────────── */

(function () {
  /* ── Config ─────────────────────────── */
  const USER_ITEMS = [
    {
      id: "dashboard",
      icon: "fa-solid fa-house",
      label: "Dashboard",
      href: "dashboard.html",
    },
    {
      id: "devices",
      icon: "fa-solid fa-sliders",
      label: "Devices",
      href: "devices.html",
    },
    {
      id: "environment",
      icon: "fa-solid fa-chart-line",
      label: "Environment",
      href: "environment.html",
    },
    {
      id: "security",
      icon: "fa-solid fa-shield-halved",
      label: "Security",
      href: "security.html",
    },
    {
      id: "notifications",
      icon: "fa-solid fa-bell",
      label: "Notifications",
      href: "notifications.html",
      badge: true,
    },
  ];

  const ADMIN_ITEMS = [
    {
      id: "automation",
      icon: "fa-solid fa-bolt",
      label: "Automation",
      href: "automation.html",
      adminTag: true,
    },
    {
      id: "management",
      icon: "fa-solid fa-gear",
      label: "Management",
      href: "management.html",
      adminTag: true,
    },
  ];

  /* ── State ──────────────────────────── */
  const SidebarState = {
    unreadCount: 5,
    user: { name: "Trung4n", initials: "TA", role: "Administrator" },
    isAdmin: document.body.dataset.role === "admin",
    activeId: _detectActive(),
  };

  function _detectActive() {
    const path = window.location.pathname.split("/").pop() || "dashboard.html";
    const all = [...USER_ITEMS, ...ADMIN_ITEMS];
    const match = all.find((i) => i.href === path);
    return match ? match.id : "dashboard";
  }

  /* ── Render ─────────────────────────── */
  function render() {
    const mount = document.getElementById("app-sidebar");
    if (!mount) return;

    document.body.classList.add("has-sidebar");

    mount.innerHTML = `
      <nav class="app-sidebar">

        <!-- Logo -->
        <a href="dashboard.html" class="sb-logo">
          <div class="sb-logo-mark">S</div>
          <div class="sb-logo-text">
            Smart Home UIA
            <span>Intelligent Living</span>
          </div>
        </a>

        <!-- Nav items -->
        <div class="sb-nav">

          <div class="sb-section-label">Navigation</div>

          ${USER_ITEMS.map((item) => _renderItem(item)).join("")}

          ${
            SidebarState.isAdmin
              ? `
            <hr class="sb-divider">
            <div class="sb-section-label">Admin</div>
            ${ADMIN_ITEMS.map((item) => _renderItem(item)).join("")}
          `
              : ""
          }

        </div>

        <!-- User footer -->
        <div class="sb-footer">
          <div class="sb-dropdown" id="sb-dropdown">
            <a href="#" class="sb-dd-item" id="dd-profile">
              <i class="fa-solid fa-user"></i>
              Edit Profile
            </a>
            <a href="login.html" class="sb-dd-item logout" id="dd-logout">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
              Sign Out
            </a>
          </div>

          <div class="sb-user-chip" id="sb-user-chip">
            <div class="sb-avatar">${SidebarState.user.initials}</div>
            <div class="sb-user-info">
              <div class="sb-user-name">${SidebarState.user.name}</div>
              <div class="sb-user-role">${SidebarState.user.role}</div>
            </div>
            <i class="fa-solid fa-chevron-up sb-chevron"></i>
          </div>
        </div>

      </nav>
    `;

    _bindEvents();
    _updateBadge(SidebarState.unreadCount);
  }

  function _renderItem(item) {
    const isActive = SidebarState.activeId === item.id;
    const badge = item.badge
      ? `<div class="sb-badge" id="sb-notif-badge" style="${SidebarState.unreadCount === 0 ? "display:none" : ""}">${SidebarState.unreadCount}</div>`
      : "";
    const adminTag = item.adminTag
      ? `<span class="sb-admin-tag">Admin</span>`
      : "";

    return `
      <a href="${item.href}" class="sb-item${isActive ? " active" : ""}" data-id="${item.id}">
        <div class="sb-item-icon"><i class="${item.icon}"></i></div>
        <span class="sb-item-label">${item.label}</span>
        ${badge}${adminTag}
      </a>
    `;
  }

  /* ── Events ─────────────────────────── */
  function _bindEvents() {
    // User dropdown
    const chip = document.getElementById("sb-user-chip");
    const dropdown = document.getElementById("sb-dropdown");

    chip?.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = dropdown.classList.toggle("open");
      chip.classList.toggle("open", open);
    });

    // Close on outside click
    document.addEventListener("click", () => {
      dropdown?.classList.remove("open");
      chip?.classList.remove("open");
    });

    dropdown?.addEventListener("click", (e) => e.stopPropagation());

    // Logout
    document.getElementById("dd-logout")?.addEventListener("click", (e) => {
      e.preventDefault();
      _showToast("Signing out…", "info");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    });

    // Profile / password (placeholder)
    document.getElementById("dd-profile")?.addEventListener("click", (e) => {
      e.preventDefault();
      dropdown?.classList.remove("open");
      chip?.classList.remove("open");
      _showToast("Profile page coming soon", "info");
    });

    document.getElementById("dd-password")?.addEventListener("click", (e) => {
      e.preventDefault();
      dropdown?.classList.remove("open");
      chip?.classList.remove("open");
      _showToast("Password change coming soon", "info");
    });

    // Active state on nav click (instant feedback before navigation)
    document.querySelectorAll(".sb-item[data-id]").forEach((el) => {
      el.addEventListener("click", function () {
        document
          .querySelectorAll(".sb-item")
          .forEach((i) => i.classList.remove("active"));
        this.classList.add("active");
      });
    });
  }

  /* ── Public API ─────────────────────── */
  function _updateBadge(count) {
    SidebarState.unreadCount = count;
    const badge = document.getElementById("sb-notif-badge");
    if (!badge) return;
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }

  function _setUser(name, initials, role) {
    SidebarState.user = { name, initials, role };
    const nameEl = document.querySelector(".sb-user-name");
    const roleEl = document.querySelector(".sb-user-role");
    const avatEl = document.querySelector(".sb-avatar");
    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;
    if (avatEl) avatEl.textContent = initials;
  }

  function _showAdminItems(show = true) {
    SidebarState.isAdmin = show;
    render();
  }

  /* ── Toast helper ───────────────────── */
  function _showToast(msg, type = "success") {
    document.querySelector(".sb-toast")?.remove();
    const colors = {
      success: "#34D399",
      info: "#2563EB",
      error: "#EF4444",
      warning: "#F97316",
    };
    const el = document.createElement("div");
    el.className = "sb-toast";
    el.style.cssText = `
      position:fixed;bottom:20px;right:20px;
      background:${colors[type] || colors.success};
      border:3px solid #000;box-shadow:4px 4px 0 #000;
      padding:9px 16px;
      font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;color:#fff;
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

  /* ── Export ─────────────────────────── */
  window.SidebarNav = {
    init: render,
    setBadge: _updateBadge,
    setUser: _setUser,
    showAdmin: _showAdminItems,
    showToast: _showToast,
  };

  /* ── Auto-init ──────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
