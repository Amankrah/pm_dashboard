import { redirect } from "next/navigation";
import { OutputIndicatorsView } from "@/components/dashboard/views/OutputIndicatorsView";
import { getSession } from "@/lib/auth";

export default async function OutputIndicatorsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <OutputIndicatorsView isAdmin={session.role === "admin"} />;
}
