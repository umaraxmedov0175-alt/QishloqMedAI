"use client";

export type RoleType = "mobile_nurse" | "specialist" | "dispatcher" | "patient";

interface RoleWorldShiftProps {
  currentRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  language?: "uz" | "en";
  className?: string;
}

export function RoleWorldShift({
  currentRole,
  onRoleChange,
  language = "uz",
  className = "",
}: RoleWorldShiftProps) {
  const roles: {
    id: RoleType;
    icon: string;
    labelUz: string;
    labelEn: string;
    descUz: string;
    descEn: string;
    bgGradient: string;
    accentColor: string;
    badgeBg: string;
  }[] = [
    {
      id: "mobile_nurse",
      icon: "🩺",
      labelUz: "Mobil Hamshira",
      labelEn: "Field Nurse",
      descUz: "Quyoshli va offline masofaviy qishloq ko'rigi",
      descEn: "High-contrast offline rural intake workspace",
      bgGradient: "from-emerald-950 via-slate-900 to-navy-950",
      accentColor: "text-emerald-400 border-emerald-500/40",
      badgeBg: "bg-emerald-500/20 text-emerald-300",
    },
    {
      id: "specialist",
      icon: "🛡️",
      labelUz: "Markaziy Vrach",
      labelEn: "Regional Specialist",
      descUz: "Toshkent markaziy klinik qaror va AI tasdiqlash",
      descEn: "Central clinical review and AI decision support",
      bgGradient: "from-purple-950 via-slate-900 to-navy-950",
      accentColor: "text-purple-400 border-purple-500/40",
      badgeBg: "bg-purple-500/20 text-purple-300",
    },
    {
      id: "dispatcher",
      icon: "🏢",
      labelUz: "Dispetcherlik & Radar",
      labelEn: "Dispatcher & Radar",
      descUz: "Real-vaqt GIS xarita va regional Outbreak Radar",
      descEn: "Real-time GIS logistics and epidemic outbreak radar",
      bgGradient: "from-blue-950 via-slate-900 to-navy-950",
      accentColor: "text-blue-400 border-blue-500/40",
      badgeBg: "bg-blue-500/20 text-blue-300",
    },
    {
      id: "patient",
      icon: "👤",
      labelUz: "Bemor Portali",
      labelEn: "Patient Portal",
      descUz: "Bemor shaxsiy tibbiy xona va muloqot",
      descEn: "Personal medical portal and direct messaging",
      bgGradient: "from-teal-950 via-slate-900 to-navy-950",
      accentColor: "text-teal-400 border-teal-500/40",
      badgeBg: "bg-teal-500/20 text-teal-300",
    },
  ];

  const activeRoleConfig = roles.find((r) => r.id === currentRole) || roles[0];

  return (
    <div
      className={`relative rounded-2xl border border-slate-700/80 p-5 backdrop-blur-xl bg-gradient-to-r ${activeRoleConfig.bgGradient} transition-all duration-700 shadow-2xl ${className}`}
    >
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none transition-all duration-700" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeRoleConfig.icon}</span>
            <h3 className="text-lg font-serif font-bold text-white">
              {language === "uz" ? activeRoleConfig.labelUz : activeRoleConfig.labelEn}
            </h3>
            <span
              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border border-slate-700 ${activeRoleConfig.badgeBg}`}
            >
              {language === "uz" ? "DUNYO QIYOFASI ALSHUVI" : "WORLD PERSPECTIVE MORPH"}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            {language === "uz" ? activeRoleConfig.descUz : activeRoleConfig.descEn}
          </p>
        </div>

        <span className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800">
          ⚡ WOW MOMENT 2: Cinematic Morphing
        </span>
      </div>

      {/* Interactive Role Perspective Switches */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {roles.map((r) => {
          const isActive = r.id === currentRole;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onRoleChange(r.id)}
              className={`p-3 rounded-xl text-left border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "bg-slate-900/90 text-white shadow-xl scale-[1.02] border-emerald-400"
                  : "bg-slate-900/40 text-slate-400 hover:text-white hover:bg-slate-900/70 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{r.icon}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <b className="text-xs font-bold block">
                {language === "uz" ? r.labelUz : r.labelEn}
              </b>
            </button>
          );
        })}
      </div>
    </div>
  );
}
