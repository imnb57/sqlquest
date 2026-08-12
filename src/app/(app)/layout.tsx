import { AppShell, DefaultRail } from "@/components/layout/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell rail={<DefaultRail />}>{children}</AppShell>;
}
