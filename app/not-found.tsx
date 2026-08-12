"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="card-glass p-8 max-w-md w-full space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center text-3xl mx-auto font-bold font-mono">
          404
        </div>
        <h1 className="text-2xl font-sans font-bold text-white">{t("notFoundTitle")}</h1>
        <p className="text-sm text-slate-400 leading-relaxed">{t("notFoundNotice")}</p>
        <Link
          href="/"
          className="inline-block w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-sky-600/20 no-underline"
        >
          {t("returnHome")}
        </Link>
      </div>
    </main>
  );
}
