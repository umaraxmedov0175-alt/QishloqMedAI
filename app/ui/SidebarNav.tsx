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
  const { language, setLanguage } = useLanguage();
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
          { href: "/central", label: language === "uz" ? "Shifokor Ko'rigi" : "Clinician Review", icon: "🩺" },
          { href: "/anatomy", label: language === "uz" ? "3D Anatomiya Ishi" : "3D Anatomy Work", icon: "🧍" },
          { href: "/hospital/outbreak", label: language === "uz" ? "Hududiy Shifoxonalar" : "Regional Hospitals", icon: "🏥" },
        ];
      case "nurse":
        return [
          { href: "/mobile", label: language === "uz" ? "Mobil Klinika" : "Mobile Clinic", icon: "📋" },
          { href: "/anatomy", label: language === "uz" ? "3D Anatomiya Ishi" : "3D Anatomy Work", icon: "🧍" },
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
      className={`fixed top-0 left-0 h-screen bg-[#070E1B] border-r border-white/[0.06] text-white flex flex-col justify-between transition-all duration-300 z-40 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Brand Header */}
      {collapsed ? (
        <div className="h-16 flex items-center justify-center border-b border-white/[0.06] shrink-0">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/60 hover:bg-sky-600/60 text-white transition duration-150 cursor-pointer border border-white/10 text-xs shadow-sm"
            title="Expand Sidebar (⏩)"
            aria-label="Expand Sidebar"
          >
            ⏩
          </button>
        </div>
      ) : (
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <TomirLogo variant="glass" size="sm" />
            <span className="text-[10px] font-mono font-bold bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded border border-sky-500/25 whitespace-nowrap">
              {roleLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition duration-150 cursor-pointer border-0 bg-transparent text-xs shrink-0"
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
                    ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/20 font-bold"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
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
                  ? "bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-sm shadow-sky-500/20 font-bold"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <span className="text-base leading-none shrink-0">{item.icon}</span>
              <span className="truncate whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Utilities */}
      <div className="p-3 border-t border-white/[0.06] space-y-2 overflow-hidden shrink-0">
        {collapsed ? (
          <div className="flex items-center justify-center py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-9 h-9 rounded-full bg-sky-600/20 hover:bg-red-500/20 border border-sky-500/30 text-sky-300 hover:text-red-300 flex items-center justify-center font-bold text-xs transition duration-150 cursor-pointer"
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
              <span className="text-slate-400 text-[11px] font-mono">Til / Lang</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
                className="bg-slate-800/60 text-slate-200 text-xs px-2 py-1 rounded border border-white/10 font-medium outline-none cursor-pointer"
              >
                <option value="uz">{"Oʻzbekcha"}</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* User Card & Logout */}
            <div className="flex items-center justify-between p-2 bg-white/[0.04] rounded-xl border border-white/[0.06] text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-sky-600/20 border border-sky-500/30 text-sky-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {role[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <b className="text-white block text-[11px] truncate">Tomir Demo User</b>
                  <span className="text-[10px] text-sky-400 font-mono">Online</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 p-1 border-0 bg-transparent cursor-pointer text-xs transition duration-150 shrink-0"
                title="Sign out"
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
