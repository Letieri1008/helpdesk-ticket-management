import { Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PageState from "../components/PageState";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "../components/TicketBadges";
import {
  createTicket,
  getCategories,
  getCurrentUser,
  getTickets,
} from "../services/api";

const filters = ["All", "Open", "In Progress", "Resolved", "Closed", "Cancelled"];
const PAGE_SIZE = 8;

function formatError(error, fallbackMessage) {
  if (!error?.data) {
    return fallbackMessage;
  }

  const firstField = Object.values(error.data)[0];
  return Array.isArray(firstField) ? firstField[0] : fallbackMessage;
}

function getStatusValue(filter) {
  if (filter === "All") return "";
  return filter.toLowerCase().replaceAll(" ", "_");
}

function TicketsPage() {
  const currentUser = getCurrentUser();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ticketPage, setTicketPage] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openCreate) {
      const timeoutId = window.setTimeout(() => {
        setIsFormVisible(true);
        window.history.replaceState({}, "");
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [location.state]);

  const loadPageData = useCallback(async function loadPageData() {
    setIsLoading(true);
    setError("");

    try {
      const [ticketData, categoryData] = await Promise.all([
        getTickets({
          page: currentPage,
          page_size: PAGE_SIZE,
          search,
          status: getStatusValue(activeFilter),
          priority: priorityFilter === "all" ? "" : priorityFilter,
          category: categoryFilter === "all" ? "" : categoryFilter,
          ordering: sortOrder === "oldest" ? "created_at" : "-created_at",
        }),
        getCategories(),
      ]);

      setTickets(Array.isArray(ticketData) ? ticketData : ticketData.results);
      setTicketPage(
        Array.isArray(ticketData)
          ? { count: ticketData.length, next: null, previous: null }
          : {
              count: ticketData.count,
              next: ticketData.next,
              previous: ticketData.previous,
            }
      );
      setCategories(categoryData);

      if (categoryData.length) {
        setFormData((current) =>
          current.category
            ? current
            : {
                ...current,
                category: String(categoryData[0].id),
              }
        );
      }
    } catch {
      setError("Could not load tickets from the API.");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, categoryFilter, currentPage, priorityFilter, search, sortOrder]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadPageData, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadPageData]);

  const totalPages = Math.max(1, Math.ceil(ticketPage.count / PAGE_SIZE));

  const canAssignToSelf =
    currentUser?.role === "agent" || currentUser?.role === "admin";

  return (
    <section className="page-section page-enter">
      <div className="page-title-row page-title-stack-mobile">
        <div>
          <h2>My Tickets</h2>
          <p>Track requests, ownership and service progress in one queue.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => setIsFormVisible((current) => !current)}
        >
          {isFormVisible ? "Close form" : "New Ticket"}
        </button>
      </div>

      {isFormVisible ? (
        <form
          className="panel-card inline-form"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!currentUser) {
              setError("You need to be signed in to create tickets.");
              return;
            }

            if (
              !formData.title.trim() ||
              !formData.description.trim() ||
              !formData.category
            ) {
              setError("Fill in title, description and category.");
              return;
            }

            setIsSubmitting(true);
            setError("");

            try {
              const createdTicket = await createTicket({
                ...formData,
                category: Number(formData.category),
                ...(canAssignToSelf ? { assigned_to: currentUser.id } : {}),
              });

              setFormData({
                title: "",
                description: "",
                priority: "medium",
                category: categories[0] ? String(categories[0].id) : "",
              });
              setIsFormVisible(false);
              await loadPageData();
              navigate(`/tickets/${createdTicket.id}`);
            } catch (requestError) {
              setError(formatError(requestError, "Could not create the ticket."));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="form-grid">
            <label className="form-grid-full">
              <span>Title</span>
              <input
                type="text"
                placeholder="VPN access unavailable"
                value={formData.title}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </label>

            <label className="form-grid-full">
              <span>Description</span>
              <textarea
                rows="4"
                placeholder="Describe the issue in detail."
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              <span>Category</span>
              <select
                value={formData.category}
                onChange={(event) =>
                  setFormData((current) => ({
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
                value={formData.priority}
                onChange={(event) =>
                  setFormData((current) => ({
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
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting || !categories.length}
            >
              {isSubmitting ? "Creating..." : "Create ticket"}
            </button>
          </div>

          {!categories.length ? (
            <p className="form-hint">
              Create at least one category before opening tickets.
            </p>
          ) : null}
        </form>
      ) : null}

      <div className="toolbar-card">
        <label className="searchbar searchbar-compact">
          <Search size={18} strokeWidth={2.1} />
          <input
            type="search"
            placeholder="Search tickets"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
        </label>

        <div className="filter-group">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={
                activeFilter === filter
                  ? "filter-button active"
                  : "filter-button"
              }
              onClick={() => {
                setActiveFilter(filter);
                setCurrentPage(1);
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="filter-select-grid">
          <label>
            <span>Priority</span>
            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label>
            <span>Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Created</span>
            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </div>

      {error && !isFormVisible ? (
        <PageState
          type="error"
          title="Tickets could not be loaded"
          message={error}
          compact
        />
      ) : null}

      <div className="panel-card table-card">
        <div className="table-wrap">
          <table className="data-table tickets-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="table-feedback">
                    <PageState type="loading" title="Loading tickets" compact />
                  </td>
                </tr>
              ) : tickets.length ? (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="clickable-row"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <td>
                      <div className="ticket-title-cell">
                        <strong>#{ticket.id}</strong>
                        <span>{ticket.title}</span>
                      </div>
                    </td>
                    <td>{ticket.created_by_username || "Unknown requester"}</td>
                    <td>{ticket.category_detail?.name || "No category"}</td>
                    <td>
                      <TicketPriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td>{ticket.assigned_to_username || "Unassigned"}</td>
                    <td>
                      <button
                        className="table-action-button"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/tickets/${ticket.id}`);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="table-feedback">
                    <PageState
                      type="empty"
                      title="No tickets match this view"
                      message="Try adjusting the search or filters."
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-bar">
          <span>
            Page {currentPage} of {totalPages} - {ticketPage.count} tickets
          </span>
          <div>
            <button
              className="secondary-button"
              type="button"
              disabled={!ticketPage.previous || currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Previous
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={!ticketPage.next || currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TicketsPage;
