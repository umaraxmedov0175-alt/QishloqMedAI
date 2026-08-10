"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function OfflinePage() {
  const { t } = useLanguage();
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-card">
          <span className="synthetic">{t("offlineShellBadge")}</span>
          <h1>{t("offlineShellTitle")}</h1>
          <p>{t("offlineShellNotice")}</p>
          <Link className="btn primary" href="/">
            {t("tryAgain")}
          </Link>
        </div>
      </section>
    </main>
  );
}
