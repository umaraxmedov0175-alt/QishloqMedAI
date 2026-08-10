import { requireDemoRole } from "@/lib/demo-session";

export default async function OperationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireDemoRole("dispatcher");
  return children;
}
