import { ArrowLeft, MessageSquarePlus, Pencil, Save, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageState from "../components/PageState";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "../components/TicketBadges";
import { formatLabel } from "../utils/ticketPresentation";
import {
  createTicketComment,
  getCategories,
  getCurrentUser,
  getTicketById,
  getTicketComments,
  getTicketHistory,
  getUsers,
  updateTicket,
} from "../services/api";

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatError(error, fallbackMessage) {
  if (!error?.data) {
    return fallbackMessage;
  }

  const firstField = Object.values(error.data)[0];
  return Array.isArray(firstField) ? firstField[0] : fallbackMessage;
}

function TicketDetailPage() {
  const { id } = useParams();
  const currentUser = getCurrentUser();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
    assigned_to: "",
  });

  const canManageTicket =
    currentUser?.role === "agent" || currentUser?.role === "admin";

  const loadTicketDetail = useCallback(async function loadTicketDetail() {
    setIsLoading(true);
    setError("");

    try {
      const [ticketData, commentData, historyData, categoryData, userData] = await Promise.all([
        getTicketById(id),
        getTicketComments(id),
        getTicketHistory(id),
        getCategories(),
        canManageTicket ? getUsers() : Promise.resolve([]),
      ]);

      setTicket(ticketData);
      setComments(commentData);
      setHistory(historyData);
      setCategories(categoryData);
      setUsers(userData);
      setEditForm({
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        category: String(ticketData.category),
        assigned_to: ticketData.assigned_to ? String(ticketData.assigned_to) : "",
      });
    } catch {
      setError("Could not load ticket details from the API.");
    } finally {
      setIsLoading(false);
    }
  }, [canManageTicket, id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadTicketDetail, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadTicketDetail]);

  const canComment = ticket && !["closed", "cancelled"].includes(ticket.status);
  const canEditTicket = ticket && !["closed", "cancelled"].includes(ticket.status);
  const assignableUsers = users.filter((user) =>
    ["admin", "agent"].includes(user.role)
  );

  return (
    <section className="page-section page-enter">
      <div className="page-title-row page-title-stack-mobile">
        <div>
          <Link to="/tickets" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to tickets</span>
          </Link>
          <h2>
            {ticket ? `Ticket #${ticket.id} - ${ticket.title}` : `Ticket #${id}`}
          </h2>
          <p>
            {ticket
              ? "Detailed context, ownership and comments for this ticket."
              : "Loading ticket details from the API."}
          </p>
        </div>

        {ticket ? (
          <div className="ticket-actions">
            <button
              className="secondary-button"
              type="button"
              disabled={!canEditTicket}
              onClick={() => {
                if (isEditing && ticket) {
                  setEditForm({
                    title: ticket.title,
                    description: ticket.description,
                    priority: ticket.priority,
                    category: String(ticket.category),
                    assigned_to: ticket.assigned_to
                      ? String(ticket.assigned_to)
                      : "",
                  });
                }

                setIsEditing((current) => !current);
              }}
            >
              {isEditing ? <X size={16} /> : <Pencil size={16} />}
              <span>{isEditing ? "Cancel edit" : "Edit ticket"}</span>
            </button>

            {canManageTicket ? (
              <label className="status-select">
                <span>Status</span>
                <select
                  value={ticket.status}
                  disabled={isUpdatingStatus}
                  onChange={async (event) => {
                    setIsUpdatingStatus(true);
                    setError("");

                    try {
                      await updateTicket(ticket.id, { status: event.target.value });
                      await loadTicketDetail();
                    } catch (requestError) {
                      setError(
                        formatError(requestError, "Could not update ticket status.")
                      );
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <TicketStatusBadge status={ticket.status} />
          </div>
        ) : null}
      </div>

      {error ? (
        <PageState type="error" title="Ticket action failed" message={error} compact />
      ) : null}

      <div className="detail-grid">
        <div className="panel-card detail-summary">
          <div className="detail-meta-grid">
            <div>
              <span>Priority</span>
              {ticket ? (
                <TicketPriorityBadge priority={ticket.priority} />
              ) : (
                <strong>Loading...</strong>
              )}
            </div>
            <div>
              <span>Category</span>
              <strong>{ticket?.category_detail?.name || "No category"}</strong>
            </div>
            <div>
              <span>Assigned To</span>
              <strong>{ticket?.assigned_to_username || "Unassigned"}</strong>
            </div>
            <div>
              <span>Requester</span>
              <strong>{ticket?.created_by_name || "Unknown requester"}</strong>
            </div>
            <div>
              <span>Created</span>
              <strong>
                {ticket?.created_at
                  ? new Date(ticket.created_at).toLocaleString("pt-BR")
                  : "Loading..."}
              </strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>
                {ticket?.updated_at
                  ? new Date(ticket.updated_at).toLocaleString("pt-BR")
                  : "Loading..."}
              </strong>
            </div>
            <div>
              <span>Closed</span>
              <strong>
                {ticket?.closed_at
                  ? new Date(ticket.closed_at).toLocaleString("pt-BR")
                  : "Not closed"}
              </strong>
            </div>
          </div>

          <div className="detail-description">
            <h3>Description</h3>
            <p>{ticket?.description || "No description available for this ticket."}</p>
          </div>

          {isEditing ? (
            <form
              className="ticket-edit-form"
              onSubmit={async (event) => {
                event.preventDefault();

                if (!editForm.title.trim() || !editForm.description.trim() || !editForm.category) {
                  setError("Fill in title, description and category before saving.");
                  return;
                }

                setIsSavingEdit(true);
                setError("");

                try {
                  const payload = {
                    title: editForm.title,
                    description: editForm.description,
                    priority: editForm.priority,
                    category: Number(editForm.category),
                    ...(canManageTicket
                      ? {
                          assigned_to: editForm.assigned_to
                            ? Number(editForm.assigned_to)
                            : null,
                        }
                      : {}),
                  };

                  await updateTicket(ticket.id, payload);
                  setIsEditing(false);
                  await loadTicketDetail();
                } catch (requestError) {
                  setError(formatError(requestError, "Could not save ticket changes."));
                } finally {
                  setIsSavingEdit(false);
                }
              }}
            >
              <div className="form-grid">
                <label className="form-grid-full">
                  <span>Title</span>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="form-grid-full">
                  <span>Description</span>
                  <textarea
                    rows="5"
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Category</span>
                  <select
                    value={editForm.category}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Priority</span>
                  <select
                    value={editForm.priority}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        priority: event.target.value,
                      }))
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>

                {canManageTicket ? (
                  <label className="form-grid-full">
                    <span>Assigned To</span>
                    <select
                      value={editForm.assigned_to}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          assigned_to: event.target.value,
                        }))
                      }
                    >
                      <option value="">Unassigned</option>
                      {assignableUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} - {formatLabel(user.role)}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>

              <div className="assignee-strip">
                <div className="mini-avatar">
                  <UserRound size={14} />
                </div>
                <div>
                  <span>Current responsible</span>
                  <strong>{ticket?.assigned_to_name || "Unassigned"}</strong>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSavingEdit}
                >
                  <Save size={16} />
                  <span>{isSavingEdit ? "Saving..." : "Save changes"}</span>
                </button>
              </div>
            </form>
          ) : null}
        </div>

        <aside className="detail-side-column">
          <div className="panel-card detail-comments">
            <div className="panel-card-header">
              <h3>Status timeline</h3>
            </div>

            <div className="timeline-list">
              {isLoading ? (
                <PageState type="loading" title="Loading timeline" compact />
              ) : history.length ? (
                history.map((entry) => (
                  <article key={entry.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>
                        {entry.from_status
                          ? `${formatLabel(entry.from_status)} to ${formatLabel(
                              entry.to_status
                            )}`
                          : formatLabel(entry.to_status)}
                      </strong>
                      <p>
                        {entry.actor_name || "System"} -{" "}
                        {new Date(entry.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <PageState
                  type="empty"
                  title="No status history"
                  message="Status changes will appear here."
                  compact
                />
              )}
            </div>
          </div>

          <div className="panel-card detail-comments">
            <div className="panel-card-header">
              <h3>Comments</h3>
            </div>

          <div className="comment-list">
            {isLoading ? (
              <PageState type="loading" title="Loading comments" compact />
            ) : comments.length ? (
              comments.map((comment) => (
                <article key={comment.id} className="comment-item">
                  <div className="comment-avatar">
                    <UserRound size={16} />
                  </div>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <strong>{comment.author_name || "Unknown author"}</strong>
                      <span>{new Date(comment.created_at).toLocaleString("pt-BR")}</span>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                </article>
              ))
            ) : (
              <PageState
                type="empty"
                title="No comments yet"
                message="Internal updates and customer replies will appear here."
                compact
              />
            )}
          </div>

          <form
            className="comment-form"
            onSubmit={async (event) => {
              event.preventDefault();

              if (!currentUser) {
                setError("You need to be signed in to add comments.");
                return;
              }

              if (!commentContent.trim()) {
                setError("Write a comment before submitting.");
                return;
              }

              setIsSubmitting(true);
              setError("");

              try {
                await createTicketComment(id, {
                  content: commentContent,
                });
                setCommentContent("");
                await loadTicketDetail();
              } catch (requestError) {
                setError(formatError(requestError, "Could not add the comment."));
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <label htmlFor="comment" className="comment-label">
              Add a comment
            </label>
            <textarea
              id="comment"
              rows="5"
              placeholder="Write a new update for this ticket..."
              value={commentContent}
              disabled={!canComment}
              onChange={(event) => setCommentContent(event.target.value)}
            />
            {!canComment ? (
              <p className="form-hint">
                Closed or cancelled tickets do not accept new comments.
              </p>
            ) : null}
            <button
              className="primary-button"
              type="submit"
              disabled={isSubmitting || !canComment}
            >
              <MessageSquarePlus size={16} />
              <span>{isSubmitting ? "Saving..." : "Add Comment"}</span>
            </button>
          </form>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default TicketDetailPage;
