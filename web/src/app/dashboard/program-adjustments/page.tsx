import { redirect } from "next/navigation";
import { ProgramAdjustmentsView } from "@/components/dashboard/views/ProgramAdjustmentsView";
import { getSession } from "@/lib/auth";

export default async function ProgramAdjustmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <ProgramAdjustmentsView isAdmin={session.role === "admin"} />;
}
