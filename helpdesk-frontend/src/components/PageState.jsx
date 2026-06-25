import { AlertCircle, Inbox, Loader2 } from "lucide-react";

const stateConfig = {
  empty: {
    icon: Inbox,
    title: "Nothing here yet",
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
  },
  loading: {
    icon: Loader2,
    title: "Loading",
  },
};

function PageState({ type = "empty", title, message, compact = false }) {
  const config = stateConfig[type] || stateConfig.empty;
  const Icon = config.icon;

  return (
    <div className={compact ? "page-state page-state-compact" : "page-state"}>
      <span className={`page-state-icon page-state-icon-${type}`}>
        <Icon size={compact ? 18 : 22} className={type === "loading" ? "spin" : ""} />
      </span>
      <div>
        <strong>{title || config.title}</strong>
        {message ? <p>{message}</p> : null}
      </div>
    </div>
  );
}

export default PageState;
