import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-product-panel">
        <div className="auth-product-brand">
          <span className="brand-mark">HD</span>
          <strong>HelpDesk</strong>
        </div>
        <div>
          <h1>Service operations, organized.</h1>
          <p>
            A clean workspace for ticket intake, ownership and operational
            visibility.
          </p>
        </div>
      </section>

      <section className="auth-card auth-card-minimal">
        <div className="auth-brand auth-brand-centered">
          <h1>
            <span>Help</span>Desk
          </h1>
          <p>Sign in to your support workspace</p>
        </div>

        <Outlet />
      </section>
    </main>
  );
}

export default AuthLayout;
