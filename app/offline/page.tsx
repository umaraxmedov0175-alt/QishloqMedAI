export const metadata = { title: "Offline | QishloqMed AI" };

export default function OfflinePage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-card">
          <span className="synthetic">OFFLINE-SAFE SHELL</span>
          <h1>Connection unavailable</h1>
          <p>
            Previously saved demo records remain in browser-local storage and
            will not be shown on this public fallback page.
          </p>
          <Link className="btn primary" href="/">
            Try again
          </Link>
        </div>
      </section>
    </main>
  );
}
import Link from "next/link";
