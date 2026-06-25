import { Bell, Search, UserRound } from "lucide-react";
import { getCurrentUser } from "../services/api";

function Header() {
  const currentUser = getCurrentUser();
  const displayName = currentUser?.name || "Guest User";
  const role = currentUser?.role
    ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)
    : "User";

  return (
    <header className="topbar">
      <label className="searchbar">
        <Search size={18} strokeWidth={2.2} />
        <input type="search" placeholder="Search" />
      </label>

      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <Bell size={18} strokeWidth={2.1} />
          <span className="notification-dot" />
        </button>

        <div className="user-chip">
          <div className="user-avatar">
            <UserRound size={18} />
          </div>
          <div>
            <strong>{displayName}</strong>
            <span>{role} - {currentUser?.email || "User"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
