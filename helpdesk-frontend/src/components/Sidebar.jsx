import {
  BarChart3,
  ChevronLeft,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  SquareChartGantt,
  Ticket,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearCurrentUser } from "../services/api";

const mainItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/categories", label: "Categories", icon: FolderKanban },
  { to: "/settings", label: "Users & Settings", icon: Settings },
];

const secondaryItems = [
  { label: "Customers", icon: Users },
  { label: "Reports", icon: SquareChartGantt },
  { label: "Analytics", icon: BarChart3 },
];

function Sidebar({ isCollapsed, onToggle }) {
  const navigate = useNavigate();

  return (
    <aside className={isCollapsed ? "sidebar is-collapsed" : "sidebar"}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <h1>
            <span>Help</span>{isCollapsed ? "" : "Desk"}
          </h1>
        </div>

        <button
          className={isCollapsed ? "collapse-button is-collapsed" : "collapse-button"}
          type="button"
          aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          onClick={onToggle}
        >
          <ChevronLeft size={18} />
          <ChevronLeft size={18} className="collapse-button-icon" />
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          className="sidebar-create-button"
          type="button"
          onClick={() => navigate("/tickets", { state: { openCreate: true } })}
        >
          <Plus size={17} />
          <span className="nav-link-label">New Ticket</span>
        </button>

        {mainItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <Icon size={19} />
            <span className="nav-link-label">{label}</span>
          </NavLink>
        ))}

        {secondaryItems.map(({ label, icon: Icon }) => (
          <button key={label} className="nav-link nav-link-muted" type="button">
            <Icon size={19} />
            <span className="nav-link-label">{label}</span>
            <span className="nav-link-soon">Soon</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-link nav-link-logout"
          onClick={() => {
            clearCurrentUser();
            navigate("/login");
          }}
        >
          <LogOut size={19} />
          <span className="nav-link-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
