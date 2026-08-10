import { requireDemoRole } from "@/lib/demo-session";

export default async function MobileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireDemoRole("mobile_nurse");
  return children;
}
