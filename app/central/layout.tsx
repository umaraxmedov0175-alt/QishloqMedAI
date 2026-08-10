import { requireDemoRole } from "@/lib/demo-session";

export default async function CentralLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireDemoRole("specialist");
  return children;
}
