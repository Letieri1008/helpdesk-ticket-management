import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Inbox,
  PlusCircle,
  TimerReset,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import ActivityItem from "../components/ActivityItem";
import PageState from "../components/PageState";
import StatCard from "../components/StatCard";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "../components/TicketBadges";
import { getCategories, getTicketComments, getTicketResults } from "../services/api";

function formatPercent(value, total) {
  if (!total) return "0.0% of total";
  return `${((value / total) * 100).toFixed(1)}% of total`;
}

function formatRelativeTime(dateString) {
  if (!dateString) return "No timestamp";

  const createdAt = new Date(dateString);
  const diffInHours = Math.max(0, (Date.now() - createdAt.getTime()) / 36e5);

  if (diffInHours < 1) {
    return `${Math.max(1, Math.round(diffInHours * 60))} min ago`;
  }

  if (diffInHours < 24) {
    return `${Math.round(diffInHours)} hrs ago`;
  }

  return `${Math.round(diffInHours / 24)} days ago`;
}

function formatAverageAge(tickets) {
  if (!tickets.length) return "n/a";

  const hours =
    tickets.reduce((total, ticket) => {
      const createdAt = new Date(ticket.created_at);
      return total + Math.max(0, (Date.now() - createdAt.getTime()) / 36e5);
    }, 0) / tickets.length;

  if (hours < 24) {
    return `${hours.toFixed(1)} hours`;
  }

  return `${(hours / 24).toFixed(1)} days`;
}

function DashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [commentsByTicket, setCommentsByTicket] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const [ticketData, categoryData] = await Promise.all([
          getTicketResults({ page_size: 50 }),
          getCategories(),
        ]);

        const commentsEntries = await Promise.all(
          ticketData.slice(0, 8).map(async (ticket) => {
            const comments = await getTicketComments(ticket.id);
            return [ticket.id, comments];
          })
        );

        if (!isMounted) return;

        setTickets(ticketData);
        setCategories(categoryData);
        setCommentsByTicket(Object.fromEntries(commentsEntries));
      } catch {
        if (!isMounted) return;
        setError("Could not load dashboard data from the API.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((ticket) => ticket.status === "open");
  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "in_progress"
  );
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "resolved");
  const closedTickets = tickets.filter((ticket) => ticket.status === "closed");
  const criticalTickets = tickets.filter((ticket) => ticket.priority === "critical");

  const stats = [
    {
      title: "Total Tickets",
      value: String(totalTickets),
      subtitle: "Tracked",
      trend: { label: `${categories.length} categories`, direction: "neutral" },
      tone: "slate",
      icon: FolderKanban,
    },
    {
      title: "Open Tickets",
      value: String(openTickets.length),
      subtitle: "Current",
      trend: { label: formatPercent(openTickets.length, totalTickets), direction: "neutral" },
      tone: "blue",
      icon: Inbox,
    },
    {
      title: "In Progress",
      value: String(inProgressTickets.length),
      subtitle: "Active",
      trend: {
        label: formatPercent(inProgressTickets.length, totalTickets),
        direction: "neutral",
      },
      tone: "amber",
      icon: TimerReset,
    },
    {
      title: "Resolved",
      value: String(resolvedTickets.length),
      subtitle: "Completed",
      trend: {
        label: formatPercent(resolvedTickets.length, totalTickets),
        direction: "neutral",
      },
      tone: "mint",
      icon: CheckCircle2,
    },
    {
      title: "Critical",
      value: String(criticalTickets.length),
      subtitle: "Priority",
      trend: {
        label: formatPercent(criticalTickets.length, totalTickets),
        direction: "neutral",
      },
      tone: "red",
      icon: AlertTriangle,
    },
  ];

  const agentRows = Object.values(
    tickets.reduce((accumulator, ticket) => {
      const agentName = ticket.assigned_to_username || "Unassigned";

      if (!accumulator[agentName]) {
        accumulator[agentName] = {
          agent: agentName,
          tickets: [],
        };
      }

      accumulator[agentName].tickets.push(ticket);
      return accumulator;
    }, {})
  )
    .map(({ agent, tickets: agentTickets }) => {
      const resolvedCount = agentTickets.filter((ticket) =>
        ["resolved", "closed"].includes(ticket.status)
      ).length;
      const pendingCount = agentTickets.filter((ticket) =>
        ["open", "in_progress"].includes(ticket.status)
      ).length;

      return {
        agent,
        responseTime: formatAverageAge(agentTickets),
        resolutionRate: agentTickets.length
          ? `${Math.round((resolvedCount / agentTickets.length) * 100)} %`
          : "0 %",
        pendingCount,
      };
    })
    .sort((first, second) => second.pendingCount - first.pendingCount);

  const recentActivities = [
    ...tickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      sortDate: ticket.updated_at || ticket.created_at,
      icon: <PlusCircle size={18} />,
      title: `Ticket #${ticket.id}`,
      description: ticket.title,
      time: formatRelativeTime(ticket.updated_at || ticket.created_at),
      avatarClass: "activity-avatar-icon",
    })),
    ...Object.entries(commentsByTicket).flatMap(([ticketId, comments]) =>
      comments.map((comment) => ({
        id: `comment-${comment.id}`,
        sortDate: comment.updated_at || comment.created_at,
        icon: <Clock3 size={18} />,
        title: comment.author_username || "Comment",
        description: `Comment on ticket #${ticketId}`,
        time: formatRelativeTime(comment.updated_at || comment.created_at),
        avatarClass: "activity-avatar-icon",
      }))
    ),
  ]
    .sort((first, second) => new Date(second.sortDate) - new Date(first.sortDate))
    .slice(0, 5);

  const recentTickets = [...tickets]
    .sort((first, second) => new Date(second.created_at) - new Date(first.created_at))
    .slice(0, 5);

  const resolutionRate = totalTickets
    ? Math.round(
        ((resolvedTickets.length + closedTickets.length) / totalTickets) * 100
      )
    : 0;

  return (
    <section className="page-section page-enter">
      <div className="page-title-row page-title-stack-mobile">
        <div>
          <h2>Dashboard</h2>
          <p>Operational health, ticket volume and agent workload.</p>
        </div>

        <span className="page-kicker">Live workspace</span>
      </div>

      <div className="section-heading">
        <h3>Ticket status</h3>
      </div>

      {error ? (
        <PageState
          type="error"
          title="Dashboard unavailable"
          message={error}
          compact
        />
      ) : null}

      <div className="stats-grid">
        {stats.map((item) => (
          <StatCard key={item.title} {...item} />
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main-column">
          <div className="panel-card table-card">
            <div className="panel-card-header">
              <h3>Agent Performance</h3>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agent</th>
                    <th>Avg Response Time</th>
                    <th>Resolution Rate</th>
                    <th>Pending Tickets</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="table-feedback">
                        <PageState type="loading" title="Loading agent metrics" compact />
                      </td>
                    </tr>
                  ) : agentRows.length ? (
                    agentRows.map((agentRow) => (
                      <tr key={agentRow.agent}>
                        <td>
                          <div className="table-person">
                            <span className="mini-avatar">
                              <UserRound size={14} />
                            </span>
                            <span>{agentRow.agent}</span>
                          </div>
                        </td>
                        <td>{agentRow.responseTime}</td>
                        <td>{agentRow.resolutionRate}</td>
                        <td>{agentRow.pendingCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="table-feedback">
                        <PageState
                          type="empty"
                          title="No assigned tickets yet"
                          message="Assign a ticket to start seeing workload data."
                          compact
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel-card table-card">
            <div className="panel-card-header">
              <h3>Tickets Details</h3>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket no</th>
                    <th>Customer</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="table-feedback">
                        Loading tickets...
                      </td>
                    </tr>
                  ) : recentTickets.length ? (
                    recentTickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>#{ticket.id}</td>
                        <td>{ticket.created_by_username || "Unknown requester"}</td>
                        <td>
                          <TicketPriorityBadge priority={ticket.priority} />
                        </td>
                        <td>
                          <div className="table-person">
                            <span className="mini-avatar">
                              <UserRound size={14} />
                            </span>
                            <span>{ticket.assigned_to_username || "Unassigned"}</span>
                          </div>
                        </td>
                        <td>
                          <TicketStatusBadge status={ticket.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="table-feedback">
                        <PageState
                          type="empty"
                          title="No recent tickets"
                          message="New support requests will appear here."
                          compact
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <aside className="dashboard-side-column">
          <div className="panel-card">
            <div className="panel-card-header">
              <h3>Recent activity</h3>
            </div>

            <div className="activity-list">
              {isLoading ? (
                <PageState type="loading" title="Loading activity" compact />
              ) : recentActivities.length ? (
                recentActivities.map((item) => (
                  <ActivityItem key={item.id} {...item} />
                ))
              ) : (
                <PageState
                  type="empty"
                  title="No recent activity"
                  message="Comments and ticket updates will show up here."
                  compact
                />
              )}
            </div>
          </div>

          <div className="panel-card resolution-card">
            <div className="panel-card-header">
              <h3>Resolution Rate</h3>
            </div>

            <div className="resolution-score-block">
              <strong className="resolution-score">{resolutionRate} %</strong>
            </div>

            <div className="resolution-bar" aria-hidden="true">
              <span className="resolution-high" />
              <span className="resolution-medium" />
              <span className="resolution-low" />
            </div>

            <div className="resolution-legend">
              <span>
                <i className="legend-dot legend-high" />
                High
              </span>
              <span>
                <i className="legend-dot legend-low" />
                Low
              </span>
              <span>
                <i className="legend-dot legend-medium" />
                Medium
              </span>
            </div>

            <div className="resolution-meta">
              <div className="resolution-meta-item">
                <span className="resolution-meta-value">{categories.length}</span>
                <span className="resolution-meta-label">categories</span>
              </div>

              <div className="resolution-meta-item resolution-meta-item-right">
                <span className="resolution-meta-value">{totalTickets}</span>
                <span className="resolution-meta-label">tickets tracked</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default DashboardPage;
