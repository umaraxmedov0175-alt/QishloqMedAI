"use client";

import { useLanguage } from "@/lib/i18n";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();
  return (
    <main className="empty" style={{ padding: "15vh 20px" }}>
      <h1>{t("errorTitle")}</h1>
      <p>{t("errorNotice")}</p>
      <button className="btn primary" onClick={reset}>
        {t("tryAgain")}
      </button>
    </main>
  );
}
