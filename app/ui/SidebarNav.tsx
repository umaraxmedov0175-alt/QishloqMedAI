"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { TomirLogo } from "./TomirLogo";
import type { Role } from "@/lib/authorization";

interface SidebarNavProps {
  role: Role;
  activePath?: string;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export function SidebarNav({ role, activePath, onToggleCollapse }: SidebarNavProps) {
  const { language, setLanguage, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    onToggleCollapse?.(next);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      document.cookie = "qm_demo_role=; Path=/; Max-Age=0";
      sessionStorage.removeItem("qm_demo_role");
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  const getNavItems = () => {
    switch (role) {
      case "doctor":
        return [
          { href: "/central", label: t("navClinicianReview"), icon: "🩺" },
          { href: "/anatomy", label: t("nav3dAnatomy"), icon: "🧍" },
          { href: "/hospital/outbreak", label: t("navRegionalHospitals"), icon: "🏥" },
        ];
      case "nurse":
        return [
          { href: "/mobile", label: t("navMobileClinic"), icon: "📋" },
          { href: "/anatomy", label: t("nav3dAnatomy"), icon: "🧍" },
          { href: "/offline", label: t("navOfflineQueue"), icon: "⚡" },
        ];
      case "dispatcher":
        return [
          { href: "/dispatcher", label: t("navLiveGisDispatch"), icon: "🏢" },
          { href: "/dispatcher/radar", label: t("navOutbreakRadar"), icon: "☣️" },
          { href: "/operations", label: t("navLogisticsHub"), icon: "📊" },
          { href: "/hospital/outbreak", label: t("navHospitalBeds"), icon: "🏥" },
        ];
      case "patient":
        return [
          { href: "/patient", label: t("navPatientPortal"), icon: "📱" },
          { href: "/patient/report", label: t("navMedicalRequests"), icon: "📝" },
        ];
    }
  };

  const navItems = getNavItems();
  const roleLabel = {
    doctor: t("roleSpecialist"),
    nurse: t("roleMobileNurse"),
    dispatcher: t("roleDispatcher"),
    patient: t("patientPortalTitle"),
  }[role];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-slate-900 border-r border-slate-800 text-white flex flex-col justify-between transition-all duration-300 z-40 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Brand Header */}
      {collapsed ? (
        <div className="h-16 flex items-center justify-center border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-emerald-600/80 text-white transition duration-150 cursor-pointer border border-slate-700 text-xs shadow-sm"
            title="Expand Sidebar (⏩)"
            aria-label="Expand Sidebar"
          >
            ⏩
          </button>
        </div>
      ) : (
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <TomirLogo variant="glass" size="sm" />
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
              {roleLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition duration-150 cursor-pointer border-0 bg-transparent text-xs shrink-0"
            title="Collapse Sidebar (⏪)"
            aria-label="Collapse Sidebar"
          >
            ⏪
          </button>
        </div>
      )}

      {/* Middle Navigation Links */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = activePath === item.href;
          if (collapsed) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center w-10 h-10 mx-auto rounded-xl text-base transition duration-150 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title={item.label}
              >
                <span>{item.icon}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition duration-150 ${
                isActive
                  ? "bg-emerald-700 text-white shadow-sm font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <span className="text-base leading-none shrink-0">{item.icon}</span>
              <span className="truncate whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Utilities */}
      <div className="p-3 border-t border-slate-800 space-y-2 overflow-hidden shrink-0">
        {collapsed ? (
          <div className="flex items-center justify-center py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-emerald-600/30 hover:bg-red-500/30 border border-emerald-500/40 text-emerald-300 hover:text-red-300 flex items-center justify-center font-bold text-xs transition duration-150 cursor-pointer"
              title="Tomir Demo User (Click to Sign out)"
              aria-label="Sign out"
            >
              {role[0].toUpperCase()}
            </button>
          </div>
        ) : (
          <>
            {/* Language Switcher */}
            <div className="flex items-center justify-between px-2 text-xs">
              <span className="text-slate-400 text-[11px] font-mono">{t("language")}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "uz" | "en" | "ru")}
                className="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 font-medium outline-none cursor-pointer"
              >
                <option value="uz">🇺🇿 Oʻzbekcha</option>
                <option value="en">🇬🇧 English</option>
                <option value="ru">🇷🇺 Русский</option>
              </select>
            </div>

            {/* User Card & Logout */}
            <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {role[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <b className="text-white block text-[11px] truncate">QishloqMed User</b>
                  <span className="text-[10px] text-emerald-400 font-mono">● Online</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 p-1 border-0 bg-transparent cursor-pointer text-xs transition duration-150 shrink-0"
                title={t("logout")}
              >
                🚪
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
