import { ClinicDashboard } from "./ui/ClinicDashboard";

export const metadata = {
  title: "QishloqMed AI — Mobile clinic workspace",
  description: "Clinician-supervised diagnostic coordination for remote communities in Uzbekistan.",
};

export default function Home() {
  return <ClinicDashboard />;
}
