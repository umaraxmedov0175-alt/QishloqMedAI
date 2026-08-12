"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <main className="empty" style={{ padding: "15vh 20px" }}>
      <h1>{t("notFoundTitle")}</h1>
      <p>{t("notFoundNotice")}</p>
      <Link className="btn primary" href="/">
        {t("returnHome")}
      </Link>
    </main>
  );
}
