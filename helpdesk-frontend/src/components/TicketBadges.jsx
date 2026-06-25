import Badge from "./Badge";
import {
  formatLabel,
  getPriorityTone,
  getStatusTone,
} from "../utils/ticketPresentation";

export function TicketStatusBadge({ status }) {
  return <Badge tone={getStatusTone(status)}>{formatLabel(status)}</Badge>;
}

export function TicketPriorityBadge({ priority }) {
  return <Badge tone={getPriorityTone(priority)}>{formatLabel(priority)}</Badge>;
}
