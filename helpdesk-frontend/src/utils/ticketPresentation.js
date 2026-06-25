export function formatLabel(value = "") {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getStatusTone(status) {
  if (status === "open") return "status-open";
  if (status === "in_progress") return "status-progress";
  if (status === "resolved") return "status-resolved";
  if (status === "closed") return "status-closed";
  if (status === "cancelled") return "status-cancelled";
  return "neutral";
}

export function getPriorityTone(priority) {
  if (priority === "low") return "priority-low";
  if (priority === "medium") return "priority-medium";
  if (priority === "high") return "priority-high";
  if (priority === "critical") return "priority-critical";
  return "neutral";
}
