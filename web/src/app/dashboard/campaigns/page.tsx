import { CampaignManager } from "@/components/CampaignManager";
import { listCampaigns, listInvitesForPeriod } from "@/lib/campaigns-data";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();
  const initialSelectedId = campaigns[0]?.id ?? "";
  const initialInvites = initialSelectedId
    ? await listInvitesForPeriod(initialSelectedId)
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Campaigns & form links</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a reporting period, then generate a unique URL for each faculty member.
          They open the link in a browser, complete the form, and submit directly to the
          database.
        </p>
      </div>
      <CampaignManager
        initialCampaigns={campaigns}
        initialSelectedId={initialSelectedId}
        initialInvites={initialInvites}
      />
    </div>
  );
}
