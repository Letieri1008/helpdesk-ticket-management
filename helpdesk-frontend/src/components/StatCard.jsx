function StatCard({ title, value, subtitle, trend, tone, icon: Icon }) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      {Icon ? (
        <span className="stat-card-icon">
          <Icon size={18} />
        </span>
      ) : null}

      <div className="stat-card-copy">
        <span>{title}</span>
        <strong>{value}</strong>
      </div>

      <div className="stat-card-footer">
        <small>{subtitle}</small>
        {trend ? (
          <span className={`trend trend-${trend.direction}`}>{trend.label}</span>
        ) : null}
      </div>
    </article>
  );
}

export default StatCard;
