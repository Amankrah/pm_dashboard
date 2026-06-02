import { redirect } from "next/navigation";
import { AnalyticsProvider } from "@/components/dashboard/AnalyticsProvider";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <AnalyticsProvider>
      <DashboardShell email={session.email} role={session.role}>
        {children}
      </DashboardShell>
    </AnalyticsProvider>
  );
}
