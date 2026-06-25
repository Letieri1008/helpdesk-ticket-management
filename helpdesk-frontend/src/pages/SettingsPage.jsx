import { useCallback, useEffect, useState } from "react";
import { createUser, getUsers } from "../services/api";

function formatError(error) {
  if (!error?.data) {
    return "Could not save the new user right now.";
  }

  const firstField = Object.values(error.data)[0];
  return Array.isArray(firstField)
    ? firstField[0]
    : "Could not save the new user right now.";
}

function formatRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function SettingsPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    role: "agent",
    name: "",
    email: "",
    password: "",
  });

  const loadUsers = useCallback(async function loadUsers() {
    setIsLoadingUsers(true);

    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError("Could not load registered people from the API.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadUsers, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadUsers]);

  return (
    <section className="page-section page-enter">
      <div className="page-title-row">
        <div>
          <h2>Settings</h2>
          <p>Operational shortcuts, people access and integration context.</p>
        </div>
      </div>

      <div className="settings-grid settings-grid-wide">
        <article className="panel-card settings-card">
          <div className="panel-card-header">
            <h3>Register People</h3>
          </div>

          <form
            className="inline-form"
            onSubmit={async (event) => {
              event.preventDefault();

              if (
                !formData.name.trim() ||
                !formData.email.trim() ||
                !formData.password.trim()
              ) {
                setError("Fill in all user fields before saving.");
                return;
              }

              setIsSubmitting(true);
              setError("");

              try {
                await createUser(formData);
                setFormData({
                  role: "agent",
                  name: "",
                  email: "",
                  password: "",
                });
                await loadUsers();
              } catch (requestError) {
                setError(formatError(requestError));
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="form-grid">
              <label>
                <span>Type</span>
                <select
                  value={formData.role}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                >
                  <option value="agent">Agent</option>
                  <option value="customer">Customer</option>
                </select>
              </label>

              <label>
                <span>Name</span>
                <input
                  type="text"
                  placeholder="Bruce Wayne"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  placeholder="employee@example.com"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
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
                {isSubmitting ? "Saving..." : "Create user"}
              </button>
            </div>
          </form>
        </article>

        <article className="panel-card settings-card">
          <div className="panel-card-header">
            <h3>Registered People</h3>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan="3" className="table-feedback">
                      Loading people...
                    </td>
                  </tr>
                ) : users.length ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{formatRole(user.role)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="table-feedback">
                      No people registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

      </div>
    </section>
  );
}

export default SettingsPage;
