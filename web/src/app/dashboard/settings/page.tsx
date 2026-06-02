import { SettingsView } from "@/components/dashboard/views/SettingsView";
import { getSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await getSession();
  return <SettingsView isAdmin={session?.role === "admin"} />;
}
