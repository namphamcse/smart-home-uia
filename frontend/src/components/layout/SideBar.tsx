import "./SideBar.css";
import { useAuth } from "../../services/AuthProvider";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
const USER_ITEMS = [
  {
    id: "dashboard",
    icon: "fa-solid fa-house",
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    id: "devices",
    icon: "fa-solid fa-sliders",
    label: "Devices",
    href: "/devices",
  },
  {
    id: "environment",
    icon: "fa-solid fa-chart-line",
    label: "Environment",
    href: "/environment",
  },
  {
    id: "security",
    icon: "fa-solid fa-shield-halved",
    label: "Security",
    href: "/security",
  },
  {
    id: "notifications",
    icon: "fa-solid fa-bell",
    label: "Notifications",
    href: "/notifications",
    badge: true,
  },
];

const ADMIN_ITEMS = [
  {
    id: "automation",
    icon: "fa-solid fa-bolt",
    label: "Automation",
    href: "/automation",
    adminTag: true,
  },
  {
    id: "management",
    icon: "fa-solid fa-gear",
    label: "Management",
    href: "/management",
    adminTag: true,
  },
];

export default function SideBar({
  active,
  setActive,
}: {
  active: boolean;
  setActive: (active: boolean) => void;
}) {
  const location = useLocation();
  const { user, handleLogout } = useAuth();
  const [activeItem, setActiveItem] = useState<string>(location.pathname.split('/')[1] || 'dashboard');
  const [dropDownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const avatarUrl = user?.user_metadata?.picture;
  useEffect(() => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    setActiveItem(path);
  }, [location.pathname]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav
      className={`app-sidebar ${active ? "" : "minimized"}`}
      id="app-sidebar"
    >
      <button className="sb-logo" onClick={() => setActive(!active)}>
        <div className="sb-logo-mark">S</div>
        <div className="sb-logo-text">
          Smart Home UIA
          <span>Intelligent Living</span>
        </div>
      </button>

      <div className="sb-nav">
        <div className="sb-section-label">Navigation</div>
        {USER_ITEMS.map((item) => (
          <Link
            to={item.href}
            className={`sb-item${item.id === activeItem ? " active" : ""}`}
            key={item.id}
            onClick={() => setActiveItem(item.id)}
          >
            <div className="sb-item-icon">
              <i className={item.icon}></i>
            </div>
            <span className="sb-item-label">{item.label}</span>
            {item.badge && <span className="sb-badge">3</span>}
          </Link>
        ))}
        <div className="sb-section-label">Admin</div>
        {ADMIN_ITEMS.map((item) => (
          <Link
            to={item.href}
            className={`sb-item${item.id === activeItem ? " active" : ""}`}
            key={item.id}
            onClick={() => setActiveItem(item.id)}
          >
            <div className="sb-item-icon">
              <i className={item.icon}></i>
            </div>
            <span className="sb-item-label">{item.label}</span>
            {item.adminTag && <span className="sb-admin-tag">Admin</span>}
          </Link>
        ))}
      </div>

      <div className="sb-footer">
        <div
          className={`sb-dropdown ${dropDownOpen ? "open" : ""}`}
          id="sb-dropdown"
          ref={dropdownRef}
        >
          <a href="#" className="sb-dd-item" id="dd-profile">
            <i className="fa-solid fa-user"></i>
            Edit Profile
          </a>
          <div
            className="sb-dd-item logout"
            id="dd-logout"
            onClick={(e) => {
              handleLogout(e);
            }}
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            Sign Out
          </div>
        </div>

        <div
          className={`sb-user-chip ${dropDownOpen ? "open" : ""}`}
          id="sb-user-chip"
          ref={profileRef}
          onClick={() => setDropdownOpen(!dropDownOpen)}
        >
          <div className="sb-avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="User Avatar"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="avatar-fallback">
                {user?.user_metadata?.full_name?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <div className="sb-user-info">
            <div className="sb-user-name">
              {user?.user_metadata?.full_name || user?.email}
            </div>
            <div className="sb-user-role">{user?.role}</div>
          </div>
          <i className="fa-solid fa-chevron-up sb-chevron"></i>
        </div>
      </div>
    </nav>
  );
}
