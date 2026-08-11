"use client";

/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities */
import { useEffect, useState } from "react";
import {
  addDispatchItem,
  getDispatchItems,
  subscribeToDispatchUpdates,
  type DispatchItem,
} from "@/lib/realtime-dispatcher";
import { useLanguage } from "@/lib/i18n";

export default function PatientReportPage() {
  const { language, setLanguage } = useLanguage();

  // Form State
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"Ayol" | "Erkak">("Ayol");
  const [village, setVillage] = useState("G'us");
  const [district, setDistrict] = useState("Urgut");
  const [region, setRegion] = useState("Samarqand");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [spo2, setSpo2] = useState("95");
  const [heartRate, setHeartRate] = useState("84");
  const [bp, setBp] = useState("120/80");
  const [tempC, setTempC] = useState("36.8");

  // GPS Coordinates State
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 39.4089,
    lng: 67.2458,
  });
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "success" | "fallback">("idle");

  // Submitted Request Tracking State
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<DispatchItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  // Detect GPS Location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  // Listen for real-time status updates on submitted request
  useEffect(() => {
    if (!submittedRequestId) return;

    queueMicrotask(() => {
      const items = getDispatchItems();
      const found = items.find((i) => i.id === submittedRequestId || i.patientCode === submittedRequestId);
      if (found) setActiveRequest(found);
    });

    const unsubscribe = subscribeToDispatchUpdates((newItems) => {
      const updated = newItems.find((i) => i.id === submittedRequestId || i.patientCode === submittedRequestId);
      if (updated) setActiveRequest(updated);
    });

    return () => unsubscribe();
  }, [submittedRequestId]);

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("fallback");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoStatus("success");
      },
      () => {
        setGeoStatus("fallback");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !chiefComplaint.trim()) {
      setNotice(language === "uz" ? "Iltimos, ism-familiya va shifokorga murojaat sababini kiriting!" : "Please enter full name and chief complaint!");
      return;
    }

    setIsSubmitting(true);
    const parsedSpo2 = Number(spo2) || 96;
    const parsedBp = bp.split("/");
    const systolicBp = Number(parsedBp[0]) || 120;
    const diastolicBp = Number(parsedBp[1]) || 80;

    let computedTriage: "emergency" | "urgent" | "priority" | "routine" = "routine";
    if (parsedSpo2 < 90 || chiefComplaint.toLowerCase().includes("nafas qisishi") || chiefComplaint.toLowerCase().includes("og'riq")) {
      computedTriage = "emergency";
    } else if (parsedSpo2 < 94 || Number(tempC) > 38.5) {
      computedTriage = "urgent";
    }

    try {
      // POST to API and sync locally
      const payload = {
        patientCode: `QM-2027-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName,
        age: Number(age) || 40,
        sex,
        village,
        district,
        region,
        lat: coords.lat,
        lng: coords.lng,
        chiefComplaint,
        symptomSummary: chiefComplaint,
        vitals: {
          spo2: parsedSpo2,
          heartRate: Number(heartRate) || 80,
          systolicBp,
          diastolicBp,
          tempC: Number(tempC) || 36.6,
        },
        triage: computedTriage,
        status: "unassigned" as const,
      };

      const newItem = addDispatchItem(payload);
      setSubmittedRequestId(newItem.id);
      setActiveRequest(newItem);
      setNotice(language === "uz" ? "✅ Tibbiy yordam so'rovingiz dispetcherga muvaffaqiyatli yuborildi!" : "✅ Assistance request submitted successfully!");

      // Optional backend API fetch
      void fetch("/api/dispatcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setNotice(language === "uz" ? "Yuborishda xatolik yuz berdi. Qayta urinib ko'ring." : "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-12">
      {/* Top Header */}
      <header className="h-16 px-6 bg-[#063C32] text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 font-bold text-lg text-white no-underline">
            <span className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-sm">+</span>
            <span>Tomir AI</span>
          </a>
          <span className="text-xs text-emerald-200/80 font-medium pl-3 border-l border-emerald-800/60 hidden md:inline-block">
            📱 Bemor va Hamshira Murojaat Portali
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/dispatcher"
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 text-xs font-semibold rounded-lg border border-emerald-400/30 transition flex items-center gap-1.5"
          >
            <span>🗺️</span>
            <span>Dispetcher Xaritasi</span>
          </a>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "uz" | "en")}
            className="px-2.5 py-1 bg-emerald-950/60 text-emerald-100 text-xs rounded border border-emerald-700/50 font-medium"
          >
            <option value="uz">{"O'zbekcha"}</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full uppercase tracking-wider">
            TEZKOR TIBBIY YORDAM VA MOBIL KLINIKA CHAQIRUV PORTALI
          </span>
          <h1 className="text-3xl font-serif font-bold text-slate-900 mt-2 mb-1">
            Tibbiy Yordam So'rovini Yuborish
          </h1>
          <p className="text-slate-500 text-xs max-w-xl mx-auto">
            Qishloq hududlarida yashovchi bemorlar hamda dala hamshiralari uchun tezkori va avtomatik geolokatsiyali tibbiy triage tizimi.
          </p>
        </div>

        {/* Live Status Tracker for Active Request */}
        {activeRequest && (
          <div className="mb-8 bg-white border-2 border-emerald-600 rounded-2xl p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">YUBORILGAN SO'ROV HOLATI</span>
                <b className="text-lg font-serif font-bold text-slate-900">{activeRequest.patientName} ({activeRequest.patientCode})</b>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {activeRequest.status === "unassigned"
                    ? "⏳ Dispetcherga Yetib Bordi"
                    : activeRequest.status === "reviewing"
                      ? "👁️ Dispetcher Ko'rib Chiqmoqda"
                      : activeRequest.status === "dispatched"
                        ? "🚑 Mobil Avtobus Yo'lga Chiqdi!"
                        : activeRequest.status === "teleconsult_scheduled"
                          ? "💻 Telemaslahat Rejalashtirildi!"
                          : "✅ Yordam Ko'rsatildi"}
                </span>
              </div>
            </div>

            {/* Stepper Status Bar */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold mb-4">
              <div className={`p-3 rounded-xl border transition ${activeRequest.status !== "unassigned" ? "bg-emerald-700 text-white border-emerald-700" : "bg-emerald-50 border-emerald-300 text-emerald-900"}`}>
                <span>1. Yuborildi</span>
              </div>
              <div className={`p-3 rounded-xl border transition ${activeRequest.status === "reviewing" || activeRequest.status === "dispatched" || activeRequest.status === "teleconsult_scheduled" ? "bg-emerald-700 text-white border-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                <span>2. Triage Ko'rik</span>
              </div>
              <div className={`p-3 rounded-xl border transition ${activeRequest.status === "dispatched" || activeRequest.status === "teleconsult_scheduled" || activeRequest.status === "resolved" ? "bg-emerald-700 text-white border-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                <span>3. Avtobus / Telemaslahat</span>
              </div>
            </div>

            {activeRequest.assignedVehicle && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                <b>🚑 Biriktirilgan transport:</b> {activeRequest.assignedVehicle}
              </div>
            )}

            {activeRequest.assignedDoctor && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 font-medium mt-2">
                <b>💻 Biriktirilgan shifokor:</b> {activeRequest.assignedDoctor}
              </div>
            )}
          </div>
        )}

        {/* Notice Message */}
        {notice && (
          <div className="mb-6 p-4 bg-emerald-100 border border-emerald-300 text-emerald-950 font-semibold text-xs rounded-xl shadow-xs">
            {notice}
          </div>
        )}

        {/* Interactive Incident Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Section 1: Geolocation Auto-Detect */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <b className="text-sm font-bold text-slate-900 block">📍 Geolokatsiya (GPS Koordinatalar)</b>
                <span className="text-xs text-slate-500">Dispetcher xaritasiga bemor manzilini avtomatik uzatish</span>
              </div>

              <button
                type="button"
                onClick={detectLocation}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <span>📡 GPSni Yangilash</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-slate-800">
                Lat: <b>{coords.lat.toFixed(5)}</b>, Lng: <b>{coords.lng.toFixed(5)}</b>
              </div>
              <span className="text-slate-600">
                {geoStatus === "locating"
                  ? "🔄 GPS koordinatalar aniqlanmoqda..."
                  : geoStatus === "success"
                    ? "🟢 GPS joylashuvi aniq tayinlandi."
                    : "🟡 Standart Urgut tumani koordinatasi tanlandi."}
              </span>
            </div>

            {/* Manual Coordinate adjustment inputs if GPS is fallback */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="field mt-0">
                <label htmlFor="geo-latitude" className="text-[11px] font-bold text-slate-700">Kenglik (Latitude)</label>
                <input
                  id="geo-latitude"
                  type="number"
                  step="0.0001"
                  value={coords.lat}
                  onChange={(e) => setCoords({ ...coords, lat: parseFloat(e.target.value) || 39.4089 })}
                  className="text-xs bg-white border border-slate-200 rounded-lg p-2"
                />
              </div>
              <div className="field mt-0">
                <label htmlFor="geo-longitude" className="text-[11px] font-bold text-slate-700">Uzunlik (Longitude)</label>
                <input
                  id="geo-longitude"
                  type="number"
                  step="0.0001"
                  value={coords.lng}
                  onChange={(e) => setCoords({ ...coords, lng: parseFloat(e.target.value) || 67.2458 })}
                  className="text-xs bg-white border border-slate-200 rounded-lg p-2"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Patient Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              👤 Bemor Ma'lumotlari
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field mt-0">
                <label htmlFor="patientName">Bemor F.I.Sh. (Ism va Familiya) *</label>
                <input
                  id="patientName"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Masalan: Dilnoza Karimova"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="field mt-0">
                  <label htmlFor="age">Yoshi *</label>
                  <input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="67"
                    required
                  />
                </div>
                <div className="field mt-0">
                  <label htmlFor="sex">Jinsi</label>
                  <select id="sex" value={sex} onChange={(e) => setSex(e.target.value as "Ayol" | "Erkak")}>
                    <option value="Ayol">Ayol</option>
                    <option value="Erkak">Erkak</option>
                  </select>
                </div>
              </div>

              <div className="field mt-0">
                <label htmlFor="village">Qishloq / Mahalla *</label>
                <input
                  id="village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="G'us"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="field mt-0">
                  <label htmlFor="district">Tuman *</label>
                  <input
                    id="district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Urgut"
                    required
                  />
                </div>
                <div className="field mt-0">
                  <label htmlFor="region">Viloyat</label>
                  <input
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Samarqand"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Complaint & Vitals */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              🩺 Shikoyat va Vital Ko'rsatkichlar
            </h3>

            <div className="field mt-0">
              <label htmlFor="chiefComplaint">Asosiy Shikoyat va Simptomlar *</label>
              <textarea
                id="chiefComplaint"
                rows={3}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Nafas qisishi, ko'krakda bosim, isitma yoki bosh og'rig'ini batafsil yozing..."
                required
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="field mt-0">
                <label htmlFor="spo2" className="flex justify-between">
                  <span>Kislorod SpO₂</span>
                  <span className="unit-badge">%</span>
                </label>
                <input
                  id="spo2"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className={Number(spo2) < 90 ? "border-red-500 bg-red-50" : ""}
                />
              </div>

              <div className="field mt-0">
                <label htmlFor="heartRate" className="flex justify-between">
                  <span>Puls</span>
                  <span className="unit-badge">bpm</span>
                </label>
                <input id="heartRate" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} />
              </div>

              <div className="field mt-0">
                <label htmlFor="bp" className="flex justify-between">
                  <span>Qon bosimi</span>
                  <span className="unit-badge">mmHg</span>
                </label>
                <input id="bp" value={bp} onChange={(e) => setBp(e.target.value)} />
              </div>

              <div className="field mt-0">
                <label htmlFor="tempC" className="flex justify-between">
                  <span>Harorat</span>
                  <span className="unit-badge">°C</span>
                </label>
                <input id="tempC" value={tempC} onChange={(e) => setTempC(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚨</span>
              <span>{isSubmitting ? "Dispetcherga Yuborilmoqda..." : "Dispetcher Xaritasiga Yuborish"}</span>
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
