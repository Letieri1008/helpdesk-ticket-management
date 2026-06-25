import { UserRound } from "lucide-react";

function ActivityItem({ icon, title, description, time, avatarClass = "" }) {
  return (
    <div className="activity-item">
      <div className={`activity-avatar ${avatarClass}`}>
        {icon || <UserRound size={18} />}
      </div>

      <div className="activity-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <time>{time}</time>
    </div>
  );
}

export default ActivityItem;
