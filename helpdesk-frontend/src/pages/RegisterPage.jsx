import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

function formatError(error) {
  if (!error?.data) {
    return "Could not create the account right now.";
  }

  const firstField = Object.values(error.data)[0];
  return Array.isArray(firstField)
    ? firstField[0]
    : "Could not create the account right now.";
}

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: "customer",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="auth-page page-enter">
      <form
        className="auth-form auth-form-minimal"
        onSubmit={async (event) => {
          event.preventDefault();

          if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.password.trim() ||
            !formData.confirmPassword.trim()
          ) {
            setError("Fill in all fields before creating your account.");
            return;
          }

          if (formData.password !== formData.confirmPassword) {
            setError("Password and confirm password must match.");
            return;
          }

          setIsSubmitting(true);
          setError("");

          try {
            await registerUser({
              role: formData.role,
              name: formData.name,
              email: formData.email,
              password: formData.password,
            });
            navigate("/dashboard");
          } catch (requestError) {
            setError(formatError(requestError));
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
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
            <option value="customer">Customer</option>
            <option value="agent">Agent</option>
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
            placeholder="you@example.com"
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

        <label>
          <span>Confirm password</span>
          <input
            type="password"
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                confirmPassword: event.target.value,
              }))
            }
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          type="submit"
          className="primary-button auth-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="auth-footer auth-footer-minimal">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
