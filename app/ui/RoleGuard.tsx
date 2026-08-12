"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessRoute, getDefaultRoleRoute, normalizeRole, type Role } from "@/lib/authorization";

interface RoleGuardProps {
  requiredRole: Role;
  children: ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Read session role from document.cookie or sessionStorage fallback
    const cookies = document.cookie.split(";").map((c) => c.trim().split("="));
    const rawCookie = cookies.find(([name]) => name === "qm_demo_role")?.[1];
    const sessionFallback = typeof window !== "undefined" ? sessionStorage.getItem("qm_demo_role") : null;
    const userRole = normalizeRole(rawCookie || sessionFallback);

    if (rawCookie && !sessionFallback) {
      try {
        sessionStorage.setItem("qm_demo_role", rawCookie);
      } catch {
        void 0;
      }
    }

    if (!userRole) {
      // Server middleware already validates HTTP requests.
      // Default to authorized on client if server let page load.
      queueMicrotask(() => {
        setIsAuthorized(true);
      });
      return;
    }

    if (userRole !== requiredRole && !canAccessRoute(userRole, pathname)) {
      queueMicrotask(() => {
        setIsAuthorized(false);
        const targetPath = getDefaultRoleRoute(userRole);
        router.replace(targetPath);
      });
      return;
    }

    queueMicrotask(() => setIsAuthorized(true));
  }, [pathname, requiredRole, router]);

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-red-500/40 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-3xl mx-auto border border-red-500/40">
            🚫
          </div>
          <h2 className="text-xl font-bold text-white">403 Forbidden - Access Restricted</h2>
          <p className="text-slate-300 text-xs leading-relaxed">
            Sizga ushbu tibbiy ish maydoniga kirish ruxsati berilmagan. Siz avtomatik ravishda oʻzingizning biriktirilgan tizmizga yoʻnaltirilasiz.
          </p>
          <button
            type="button"
            onClick={() => router.replace(getDefaultRoleRoute(requiredRole))}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
          >
            Oʻz ish maydonimga oʻtish
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
