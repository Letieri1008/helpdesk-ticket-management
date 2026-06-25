import { ExternalLink, Shield } from "lucide-react";

function AdminAccessCard() {
  return (
    <article className="admin-access-card panel-card">
      <div className="admin-access-icon">
        <Shield size={18} />
      </div>

      <div className="admin-access-copy">
        <h3>Django Admin</h3>
        <p>
          Access the administrative panel to manage users, categories, tickets
          and comments.
        </p>
      </div>

      <a
        className="secondary-button"
        href="http://127.0.0.1:8000/admin/"
        target="_blank"
        rel="noreferrer"
      >
        <span>Open Django Admin</span>
        <ExternalLink size={16} />
      </a>
    </article>
  );
}

export default AdminAccessCard;
