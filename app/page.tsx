import { ClinicDashboard } from "./ui/ClinicDashboard";

export const metadata = {
  title: "Tomir AI — Mobil klinika boshqaruv paneli",
  description: "O'zbekistonning masofaviy hududlari uchun shifokor nazoratidagi diagnostika va tibbiy koordinatsiya tizimi.",
};

export default function Home() {
  return <ClinicDashboard />;
}
