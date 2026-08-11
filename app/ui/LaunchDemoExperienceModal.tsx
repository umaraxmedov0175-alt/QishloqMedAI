"use client";
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from "react";
import { TomirLogo } from "./TomirLogo";
import { CarePulse } from "./CarePulse";
import { UzbekPatternSvg } from "./UzbekPatternSvg";

interface LaunchDemoExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: "uz" | "en";
}

export function LaunchDemoExperienceModal({
  isOpen,
  onClose,
  language = "uz",
}: LaunchDemoExperienceModalProps) {
  const [phase, setPhase] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const totalDuration = 50; // 50 seconds total automated story

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDuration) {
          setPhase(5);
          return totalDuration;
        }

        // Phase transitions
        if (next >= 35) setPhase(4);
        else if (next >= 20) setPhase(3);
        else if (next >= 10) setPhase(2);
        else setPhase(1);

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused]);

  if (!isOpen) return null;

  const handleSkip = () => {
    if (phase < 5) {
      const nextPhase = phase + 1;
      setPhase(nextPhase);
      if (nextPhase === 2) setElapsedSeconds(10);
      else if (nextPhase === 3) setElapsedSeconds(20);
      else if (nextPhase === 4) setElapsedSeconds(35);
      else if (nextPhase === 5) setElapsedSeconds(50);
    }
  };

  const handleReplay = () => {
    setPhase(1);
    setElapsedSeconds(0);
    setIsPaused(false);
  };

  const progressPercent = Math.min((elapsedSeconds / totalDuration) * 100, 100);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col text-white font-sans overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={language === "uz" ? "Tomir AI Avtomatik Demo Tajribasi" : "Tomir AI Automated Demo Experience"}
    >
      {/* Background Uzbek Islimi Ornament */}
      <UzbekPatternSvg className="absolute inset-0 w-full h-full text-emerald-400 opacity-5 pointer-events-none" />

      {/* Top Controller Bar */}
      <header className="relative z-20 px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TomirLogo variant="glass" size="sm" />
          <div className="border-l border-slate-800 pl-3">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              {language === "uz" ? "🎬 HAKATON DEMO NARRATIV MODE" : "🎬 HACKATHON DEMO NARRATIVE MODE"}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {language === "uz" ? `Bosqich ${phase}/5 · ${elapsedSeconds}s / ${totalDuration}s` : `Phase ${phase}/5 · ${elapsedSeconds}s / ${totalDuration}s`}
            </span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            {isPaused ? (language === "uz" ? "▶ Davom etish" : "▶ Resume") : (language === "uz" ? "⏸ Pauza" : "⏸ Pause")}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            {language === "uz" ? "⏭ Keyingi bosqich" : "⏭ Skip Phase"}
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            {language === "uz" ? "🔄 Qayta koʻrish" : "🔄 Replay"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            ✕ {language === "uz" ? "Yopish" : "Close"}
          </button>
        </div>
      </header>

      {/* Progress Bar Header */}
      <div className="w-full bg-slate-900 h-1.5 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 shadow-md shadow-emerald-500/50"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Narrative Cinema View */}
      <main className="relative z-10 flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col justify-center my-auto">
        {/* PHASE 1: Regional Emergency Signal (0-10s) */}
        {phase === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                1-BOSQICH · REGIONAL FAVQULODDA ISHORA
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-serif font-extrabold text-white leading-tight">
              {language === "uz"
                ? "Kegeyli Qishlogʻida Favqulodda Holat Aniqlandi"
                : "Emergency Beacon Detected in Kegeyli Village"}
            </h2>

            <p className="text-slate-300 text-base max-w-2xl">
              {language === "uz"
                ? "Bemor Tomir (67 yosh) oʻtkir nafas qisishi va koʻkrakda bosim bilan murojaat qildi. Tarmoq doirasi tashqarisida boʻlgan hududdan regional radar markaziga birinchi ishora yuborildi."
                : "Patient Tomir (67y) presented with acute chest tightness in an offline coverage zone. Initial signal received at regional radar center."}
            </p>

            <div className="p-6 bg-slate-900/90 border border-red-500/40 rounded-2xl flex items-center gap-6 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-3xl animate-bounce">
                🚨
              </div>
              <div>
                <b className="text-lg font-bold text-white block">QM-2608-014 · Kegeyli Tumani</b>
                <span className="text-xs text-red-400 font-mono font-semibold">
                  SpO₂ 91% (Pastroq) · Qon bosimi 168/96 mmHg · Urgut/Kegeyli Sektori
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: Mobile Diagnostic Dispatch (10-20s) */}
        {phase === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                2-BOSQICH · MOBIL KLINIKA DIAGNOSTIKA DISPETCHERLIGI
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-serif font-extrabold text-white leading-tight">
              {language === "uz"
                ? "Tomir-01 Mobil Diagnostik Klinikasi Safarbar Etildi"
                : "Tomir-01 Mobile Diagnostic Clinic Dispatched"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900/90 border border-emerald-500/40 rounded-2xl space-y-3">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                  🩺 BORTDIAGNOSTIKA TAHLILI
                </span>
                <div className="text-sm font-semibold text-slate-200">
                  <div>• Qonda troponin I musbat ⚠️</div>
                  <div>• Glukoza darajasi: 14.2 mmol/L</div>
                  <div>• Hemoglobin: 11.4 g/dL</div>
                  <div>• 12-tarmoqli raqamli EKG tasviri olindi</div>
                </div>
              </div>

              <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-center">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">
                  📍 GEO-PROXIMITY MARSHRUT
                </span>
                <b className="text-lg text-white">Toʻgʻridan-toʻgʻri Urgut Kasalxonasiga (4.2 km)</b>
                <span className="text-xs text-emerald-400 mt-1 font-mono">
                  Sinxronlash holati: SMS Mesh Payload Tayyor (62 bayt)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: AI Evidence Assembly (20-35s) */}
        {phase === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">
                3-BOSQICH · AI TIBBIY DALILLAR TAHLILI
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-white leading-tight">
              {language === "uz"
                ? "Tomir AI Triage Engine v2.4 Tahlili Yaratildi"
                : "Tomir AI Triage Engine v2.4 Assessment Generated"}
            </h2>

            {/* Live Care Pulse Component */}
            <CarePulse
              spo2={91}
              heartRate={104}
              systolicBp={168}
              diastolicBp={96}
              isCriticalOverride={true}
              label="Live Animated Telemetry Waveform"
            />

            <div className="p-5 bg-purple-950/40 border border-purple-500/40 rounded-2xl text-xs text-purple-200">
              <b className="text-sm font-bold text-white block mb-1">
                AI PROVENANCE: 92/100 FAVQULODDA TRIASH DARAJASI
              </b>
              <span>
                Oʻtkir miokard infarkti va kardiopulmonar xavf belgilari tasdiqlandi. Shifokor koʻrib chiqishi kutilmoqda.
              </span>
            </div>
          </div>
        )}

        {/* PHASE 4: Regional Specialist Approval (35-50s) */}
        {phase === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                4-BOSQICH · REGIONAL VRACH TASDIGʻI
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-white leading-tight">
              {language === "uz"
                ? "Toshkent va Urgut Mutaxassisi Qarirovini Yakunladi"
                : "Specialist Verification & Hospital Transport Approved"}
            </h2>

            <div className="p-6 bg-emerald-950/60 border-2 border-emerald-400 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-300 uppercase">
                    👨‍⚕️ Dr. Tomir Axmedov · Samarqand Viloyat Shoshilinch Markazi
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Klinik Xulosa va Gospitalizatsiya Tasdiqlandi
                  </h3>
                </div>

                <div className="px-4 py-2 bg-emerald-500 text-white font-mono font-extrabold text-sm rounded-xl shadow-lg uppercase tracking-wider animate-bounce">
                  ✓ APPROVED - CARE COORDINATED
                </div>
              </div>

              <p className="text-xs text-emerald-100 leading-relaxed border-t border-emerald-800/60 pt-3">
                "AI boshlangʻich tahlili toʻliq tasdiqlandi. Troponin I (+) va EKG oʻzgarishlari hisobga olinib, bemor zudlik bilan reanimatsiya brigadasiga topshirildi."
              </p>
            </div>
          </div>
        )}

        {/* PHASE 5: Conclusion & Workspace Navigation (50-60s) */}
        {phase === 5 && (
          <div className="space-y-6 animate-fade-in text-center max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center text-3xl mx-auto">
              🏁
            </div>

            <h2 className="text-3xl md:text-5xl font-serif font-extrabold text-white">
              {language === "uz"
                ? "Demo Tajriba Muvaffaqiyatli Yakunlandi!"
                : "Demo Experience Completed Successfully!"}
            </h2>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              {language === "uz"
                ? "Tomir AI masofaviy qishloq koʻrigidan to regional shifoxonagacha boʻlgan barcha klinik bosqichlarni real-vaqt rejimida avtomatik namoyish etdi."
                : "Tomir AI demonstrated seamless clinical orchestration from rural intake to regional hospital transport."}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleReplay}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              >
                🔄 {language === "uz" ? "Qayta tomosha qilish" : "Watch Again"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                ✨ {language === "uz" ? "Ish maydoniga qaytish" : "Return to Workspace"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
