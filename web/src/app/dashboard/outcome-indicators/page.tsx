import { redirect } from "next/navigation";
import { OutcomeIndicatorsView } from "@/components/dashboard/views/OutcomeIndicatorsView";
import { getSession } from "@/lib/auth";

export default async function OutcomeIndicatorsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <OutcomeIndicatorsView isAdmin={session.role === "admin"} />;
}
