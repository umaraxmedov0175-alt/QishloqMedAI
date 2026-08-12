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
}

export function SidebarNav({ role, activePath }: SidebarNavProps) {
  const { language, setLanguage } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

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
          { href: "/central", label: language === "uz" ? "Shifokor Ko'rigi" : "Clinician Review", icon: "🩺" },
          { href: "/hospital/outbreak", label: language === "uz" ? "Hududiy Shifoxonalar" : "Regional Hospitals", icon: "🏥" },
        ];
      case "nurse":
        return [
          { href: "/mobile", label: language === "uz" ? "Mobil Klinika" : "Mobile Clinic", icon: "📋" },
          { href: "/offline", label: language === "uz" ? "Oflayn Navbat" : "Offline Queue", icon: "⚡" },
        ];
      case "dispatcher":
        return [
          { href: "/dispatcher", label: language === "uz" ? "Live Dispetcher GIS" : "Live GIS Dispatch", icon: "🏢" },
          { href: "/dispatcher/radar", label: language === "uz" ? "Outbreak Radar" : "Outbreak Radar", icon: "☣️" },
          { href: "/operations", label: language === "uz" ? "Logistika Paneli" : "Logistics Hub", icon: "📊" },
          { href: "/hospital/outbreak", label: language === "uz" ? "Shifoxona Resurslari" : "Hospital Beds", icon: "🏥" },
        ];
      case "patient":
        return [
          { href: "/patient", label: language === "uz" ? "Bemor Portali" : "Patient Portal", icon: "📱" },
          { href: "/patient/report", label: language === "uz" ? "Arizalar Tizimi" : "Medical Requests", icon: "📝" },
        ];
    }
  };

  const navItems = getNavItems();
  const roleLabel = {
    doctor: language === "uz" ? "Shifokor REJIM" : "CLINICIAN MODE",
    nurse: language === "uz" ? "Hamshira REJIM" : "NURSE MODE",
    dispatcher: language === "uz" ? "Dispetcher REJIM" : "DISPATCH MODE",
    patient: language === "uz" ? "Bemor REJIM" : "PATIENT MODE",
  }[role];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-white flex flex-col justify-between transition-all duration-300 shrink-0 z-30 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <TomirLogo variant="glass" size="sm" />
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              {roleLabel}
            </span>
          </div>
        )}
        {collapsed && <TomirLogo variant="glass" size="sm" />}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer border-0 bg-transparent text-xs"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "⏩" : "⏪"}
        </button>
      </div>

      {/* Middle Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? "bg-emerald-700 text-white shadow-sm font-bold"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Utilities */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* Language Switcher */}
        {!collapsed && (
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-slate-400 text-[11px] font-mono">Til / Lang</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
              className="bg-slate-800 text-slate-200 text-xs px-2 py-1 rounded border border-slate-700 font-medium outline-none cursor-pointer"
            >
              <option value="uz">{"Oʻzbekcha"}</option>
              <option value="en">English</option>
            </select>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              {role[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="truncate">
                <b className="text-white block text-[11px] truncate">Tomir Demo User</b>
                <span className="text-[10px] text-emerald-400 font-mono">Online</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1 border-0 bg-transparent cursor-pointer text-xs transition"
              title="Sign out"
            >
              🚪
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
