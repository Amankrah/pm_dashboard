import { redirect } from "next/navigation";
import { SettingsView } from "@/components/dashboard/views/SettingsView";
import { getSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <SettingsView email={session.email} isAdmin={session.role === "admin"} />
  );
}
