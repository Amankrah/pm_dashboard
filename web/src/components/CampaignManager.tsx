"use client";

import { useState } from "react";

type Campaign = {
  id: string;
  label: string;
  slug: string;
  status: string;
  _count: { submissions: number; invites: number };
};

type Invite = {
  id: string;
  token: string;
  email: string | null;
  fullName: string | null;
  faculty: string | null;
  submittedAt: string | null;
  link: string;
};

export function CampaignManager({
  initialCampaigns,
  initialSelectedId,
  initialInvites,
}: {
  initialCampaigns: Campaign[];
  initialSelectedId: string;
  initialInvites: Invite[];
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [label, setLabel] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteFaculty, setInviteFaculty] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshCampaigns() {
    const res = await fetch("/api/campaigns");
    if (!res.ok) return;
    const data = await res.json();
    setCampaigns(data.campaigns);
    let nextId = "";
    setSelectedId((prev) => {
      nextId = prev || data.campaigns[0]?.id || "";
      return nextId;
    });
    if (nextId) await refreshInvites(nextId);
  }

  async function refreshInvites(periodId: string) {
    if (!periodId) {
      setInvites([]);
      return;
    }
    const res = await fetch(`/api/campaigns/${periodId}/invites`);
    if (!res.ok) return;
    const data = await res.json();
    setInvites(data.invites);
  }

  function handleCampaignChange(id: string) {
    setSelectedId(id);
    void refreshInvites(id);
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage("Could not create campaign (admin only).");
      return;
    }
    setLabel("");
    setMessage("Campaign created.");
    await refreshCampaigns();
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/campaigns/${selectedId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail || undefined,
        fullName: inviteName || undefined,
        faculty: inviteFaculty || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setMessage("Could not create invite (admin only).");
      return;
    }
    const data = await res.json();
    setMessage(`Link created: ${data.invites[0]?.link}`);
    setInviteEmail("");
    setInviteName("");
    await refreshInvites(selectedId);
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setMessage("Link copied to clipboard.");
  }

  async function emailInvite(inviteId: string, email: string | null) {
    if (!email) {
      setMessage("Add an email when generating the link to send by email.");
      return;
    }
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/invites/${inviteId}/send`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not send email.");
      return;
    }
    setMessage(
      data.status === "sent"
        ? `Email sent to ${email}.`
        : data.error ?? "Email logged but SMTP may be off.",
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-[#1e3a5f]">New reporting period</h2>
        <form onSubmit={createCampaign} className="mt-4 flex flex-wrap gap-3">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Academic Year 2025–26"
            required
            className="min-w-[240px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white"
          >
            Create campaign
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-[#1e3a5f]">Generate faculty form link</h2>
        <div className="mt-4">
          <label
            htmlFor="campaign-select"
            className="text-xs font-semibold uppercase text-slate-500"
          >
            Campaign
          </label>
          <select
            id="campaign-select"
            name="campaign"
            value={selectedId}
            onChange={(e) => handleCampaignChange(e.target.value)}
            className="mt-1 block w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} ({c._count.submissions} submissions, {c._count.invites} links)
              </option>
            ))}
          </select>
        </div>
        <form onSubmit={createInvite} className="mt-4 grid gap-3 sm:grid-cols-3">
          <input
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Faculty name (optional prefill)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email (optional)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={inviteFaculty}
            onChange={(e) => setInviteFaculty(e.target.value)}
            placeholder="Faculty (optional)"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !selectedId}
            className="sm:col-span-3 rounded-lg bg-[#1a6b44] px-4 py-2 text-sm font-bold text-white"
          >
            Generate shareable link
          </button>
        </form>
      </section>

      {message && (
        <p className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-[#1e3a5f]">{message}</p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-[#1e3a5f]">Invite links</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Recipient</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-slate-500 italic">
                    No links yet for this campaign.
                  </td>
                </tr>
              ) : (
                invites.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      {inv.fullName || "-"}
                      <br />
                      <span className="text-xs text-slate-500">{inv.email || ""}</span>
                    </td>
                    <td className="py-3 pr-4">
                      {inv.submittedAt ? (
                        <span className="font-semibold text-[#15803d]">Submitted</span>
                      ) : (
                        <span className="text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyLink(inv.link)}
                          className="text-[#2563a8] font-semibold hover:underline"
                        >
                          Copy link
                        </button>
                        {!inv.submittedAt && inv.email && (
                          <button
                            type="button"
                            onClick={() => emailInvite(inv.id, inv.email)}
                            disabled={loading}
                            className="text-[#1a6b44] font-semibold hover:underline disabled:opacity-50"
                          >
                            Email link
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
