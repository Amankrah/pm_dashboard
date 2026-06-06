import { redirect } from "next/navigation";
import { CampaignManager } from "@/components/CampaignManager";
import { getSession } from "@/lib/auth";
import { listCampaigns, listInvitesForPeriod } from "@/lib/campaigns-data";

const KNOWN_SENDER_NAMES: Record<string, string> = {
  "ebenezer.kwofie@mcgill.ca": "Ebenezer Miezah Kwofie",
};

function titleCase(s: string) {
  return s
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const campaigns = await listCampaigns();
  const initialSelectedId = campaigns[0]?.id ?? "";
  const initialInvites = initialSelectedId
    ? await listInvitesForPeriod(initialSelectedId)
    : [];

  const local = session.email.split("@")[0] ?? session.email;
  const defaultSenderName = KNOWN_SENDER_NAMES[session.email] ?? titleCase(local);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          Campaigns and form links
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a reporting period, then generate a unique URL for each
          faculty member. They open the link in a browser, complete the form,
          and submit directly to the database.
        </p>
      </div>
      <CampaignManager
        initialCampaigns={campaigns}
        initialSelectedId={initialSelectedId}
        initialInvites={initialInvites}
        senderEmail={session.email}
        defaultSenderName={defaultSenderName}
      />
    </div>
  );
}
