import { useCallback, useEffect, useState } from "react";
import { createCategory, getCategories, getTicketResults } from "../services/api";

function formatError(error, fallbackMessage) {
  if (!error?.data) {
    return fallbackMessage;
  }

  const firstField = Object.values(error.data)[0];
  return Array.isArray(firstField) ? firstField[0] : fallbackMessage;
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const loadCategories = useCallback(async function loadCategories() {
    setIsLoading(true);
    setError("");

    try {
      const [categoryData, ticketData] = await Promise.all([
        getCategories(),
        getTicketResults({ page_size: 50 }),
      ]);
      setCategories(categoryData);
      setTickets(ticketData);
    } catch {
      setError("Could not load categories from the API.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadCategories, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadCategories]);

  const categoriesWithCount = categories.map((category) => ({
    ...category,
    count: tickets.filter((ticket) => ticket.category === category.id).length,
  }));

  return (
    <section className="page-section page-enter">
      <div className="page-title-row page-title-stack-mobile">
        <div>
          <h2>Categories</h2>
          <p>Organize support demand with clear operational buckets.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() => setIsFormVisible((current) => !current)}
        >
          {isFormVisible ? "Close form" : "+ New Category"}
        </button>
      </div>

      {isFormVisible ? (
        <form
          className="panel-card inline-form"
          onSubmit={async (event) => {
            event.preventDefault();

            if (!formData.name.trim()) {
              setError("Category name is required.");
              return;
            }

            setIsSubmitting(true);
            setError("");

            try {
              await createCategory(formData);
              setFormData({
                name: "",
                description: "",
              });
              setIsFormVisible(false);
              await loadCategories();
            } catch (requestError) {
              setError(
                formatError(requestError, "Could not create the category.")
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input
                type="text"
                placeholder="Hardware"
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <label className="form-grid-full">
              <span>Description</span>
              <textarea
                rows="4"
                placeholder="Describe what this category covers."
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create category"}
            </button>
          </div>
        </form>
      ) : null}

      {error && !isFormVisible ? (
        <div className="panel-card feedback-card error-card">{error}</div>
      ) : null}

      <div className="category-grid">
        {isLoading ? (
          <div className="panel-card feedback-card">Loading categories...</div>
        ) : categoriesWithCount.length ? (
          categoriesWithCount.map((category) => (
            <article key={category.id} className="panel-card category-card">
              <div className="category-pill">{category.count} tickets</div>
              <h3>{category.name}</h3>
              <p>{category.description || "No description provided for this category."}</p>
            </article>
          ))
        ) : (
          <div className="panel-card feedback-card">
            No categories available yet. Create the first one to start opening
            tickets.
          </div>
        )}
      </div>
    </section>
  );
}

export default CategoriesPage;
