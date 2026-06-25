import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

function formatError(error) {
  if (error instanceof TypeError) {
    return "Backend offline. Start Django with: python manage.py runserver";
  }

  if (!error?.data) {
    return "Could not sign in right now.";
  }

  if (error.data.detail) {
    return error.data.detail;
  }

  const firstField = Object.values(error.data)[0];
  return Array.isArray(firstField) ? firstField[0] : "Could not sign in right now.";
}

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    usernameOrEmail: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="auth-page page-enter">
      <form
        className="auth-form auth-form-minimal"
        onSubmit={async (event) => {
          event.preventDefault();

          if (!formData.usernameOrEmail.trim() || !formData.password.trim()) {
            setError("Fill in login and password before continuing.");
            return;
          }

          setIsSubmitting(true);
          setError("");

          try {
            await loginUser(formData);
            navigate("/dashboard");
          } catch (requestError) {
            setError(formatError(requestError));
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        <label>
          <span>Login</span>
          <input
            type="text"
            placeholder="admin or email"
            value={formData.usernameOrEmail}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                usernameOrEmail: event.target.value,
              }))
            }
          />
        </label>

        <label>
          <span>Password</span>
          <input
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                password: event.target.value,
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
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="auth-helper">
        Demo access: <strong>admin</strong> / <strong>123</strong>
      </p>
    </div>
  );
}

export default LoginPage;
