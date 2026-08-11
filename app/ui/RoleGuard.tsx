"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessRoute, getDefaultRoleRoute, normalizeRole, type Role } from "@/lib/authorization";
import { TomirLogo } from "./TomirLogo";

interface RoleGuardProps {
  requiredRole: Role;
  children: ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Read session role from cookie
    const cookies = document.cookie.split(";").map((c) => c.trim().split("="));
    const roleCookie = cookies.find(([name]) => name === "qm_demo_role")?.[1];
    const userRole = normalizeRole(roleCookie);

    if (!userRole) {
      queueMicrotask(() => {
        setIsAuthorized(false);
        router.replace("/?auth=required");
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

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <TomirLogo variant="glass" size="md" />
          <div className="text-xs text-slate-400 font-mono animate-pulse mt-2">
            🔒 ESHIK RBAC XAVFSIZLIK TEKSHIRUVI...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
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
