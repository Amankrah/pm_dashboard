"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { FACULTIES } from "@/lib/constants";

// --- localStorage-backed sender name, synced via useSyncExternalStore so we
// avoid the lint rule that forbids setState inside an effect. The custom
// "nkabom-sender-changed" event is what we dispatch ourselves to re-render
// after writing in the same tab; the standard "storage" event only fires
// from OTHER tabs.

const SENDER_NAME_EVENT = "nkabom-sender-changed";

function subscribeSenderName(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(SENDER_NAME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SENDER_NAME_EVENT, callback);
  };
}

function getStoredSenderName(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SENDER_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerSenderName(): string {
  return "";
}

function writeStoredSenderName(value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value === null) {
      window.localStorage.removeItem(SENDER_NAME_KEY);
    } else {
      window.localStorage.setItem(SENDER_NAME_KEY, value);
    }
    window.dispatchEvent(new Event(SENDER_NAME_EVENT));
  } catch {
    // localStorage blocked; ignore
  }
}

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

type Toast = {
  id: number;
  tone: "success" | "info" | "error";
  text: string;
};

type Filter = "all" | "pending" | "submitted";

const SENDER_NAME_KEY = "nkabom.senderName";
const SIGN_OFF_TITLE = "Academic Lead, Nkabom Collaborative";

export function CampaignManager({
  initialCampaigns,
  initialSelectedId,
  initialInvites,
  senderEmail,
  defaultSenderName,
}: {
  initialCampaigns: Campaign[];
  initialSelectedId: string;
  initialInvites: Invite[];
  senderEmail: string;
  defaultSenderName: string;
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [invites, setInvites] = useState<Invite[]>(initialInvites);
  const [label, setLabel] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteFaculty, setInviteFaculty] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [editingSender, setEditingSender] = useState(false);
  const [senderDraft, setSenderDraft] = useState(defaultSenderName);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sender display name comes from localStorage (per-browser override) and
  // falls back to the server-derived default. useSyncExternalStore is the
  // React-blessed way to read an external sync store without a setState-in-
  // effect lint warning, and it handles SSR via getServerSenderName.
  const storedSenderName = useSyncExternalStore(
    subscribeSenderName,
    getStoredSenderName,
    getServerSenderName,
  );
  const senderName =
    storedSenderName && storedSenderName.trim()
      ? storedSenderName
      : defaultSenderName;

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedId) ?? null,
    [campaigns, selectedId],
  );

  const stats = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const totalInvites = campaigns.reduce(
      (n, c) => n + c._count.invites,
      0,
    );
    const totalSubmitted = campaigns.reduce(
      (n, c) => n + c._count.submissions,
      0,
    );
    return { totalCampaigns, totalInvites, totalSubmitted };
  }, [campaigns]);

  const filteredInvites = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invites.filter((inv) => {
      if (filter === "pending" && inv.submittedAt) return false;
      if (filter === "submitted" && !inv.submittedAt) return false;
      if (!q) return true;
      const hay = [inv.fullName, inv.email, inv.faculty]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [invites, filter, query]);

  function pushToast(tone: Toast["tone"], text: string) {
    const id = ++toastIdRef.current;
    setToasts((list) => [...list, { id, tone, text }]);
    setTimeout(() => {
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 3200);
  }

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
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setLoading(false);
    if (!res.ok) {
      pushToast("error", "Could not create campaign. Admin access required.");
      return;
    }
    setLabel("");
    pushToast("success", "Reporting period created.");
    await refreshCampaigns();
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setLoading(true);
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
      pushToast("error", "Could not create invite. Admin access required.");
      return;
    }
    setInviteEmail("");
    setInviteName("");
    setInviteFaculty("");
    pushToast("success", "Shareable link created.");
    await refreshInvites(selectedId);
  }

  async function copyLink(inv: Invite) {
    try {
      await navigator.clipboard.writeText(inv.link);
      setCopiedId(inv.id);
      pushToast("success", "Link copied to clipboard.");
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedId(null), 2000);
    } catch {
      pushToast("error", "Copy failed. Select the URL manually.");
    }
  }

  function buildMailto(inv: Invite) {
    if (!inv.email) return "";
    const periodLabel = selectedCampaign?.label ?? "the current reporting period";
    const greeting = inv.fullName
      ? `Dear ${inv.fullName.trim()},`
      : "Dear colleague,";

    const lines = [
      greeting,
      "",
      "I hope this message finds you well.",
      "",
      `As part of the Nkabom Collaborative, we are mapping faculty activities across the four strategic pillars to coordinate engagement with our partner institutions in Ghana. Please complete the brief form (about 5 to 10 minutes) for ${periodLabel} at the link below:`,
      "",
      inv.link,
      "",
      "Your responses help us harmonize work across McGill faculties. If you need a new link or have any questions, please reply directly to this message.",
      "",
      "Best regards,",
      senderName,
      SIGN_OFF_TITLE,
      "McGill University",
    ];
    const subject = `Nkabom Faculty Activity Mapping: ${periodLabel}`;
    const body = lines.join("\r\n");
    return (
      "mailto:" +
      encodeURIComponent(inv.email) +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function saveSenderName() {
    const next = senderDraft.trim();
    if (!next) {
      pushToast("error", "Display name cannot be empty.");
      return;
    }
    writeStoredSenderName(next);
    setEditingSender(false);
    pushToast("success", "Display name saved on this browser.");
  }

  function cancelSenderEdit() {
    setSenderDraft(senderName);
    setEditingSender(false);
  }

  function resetSenderName() {
    writeStoredSenderName(null);
    setSenderDraft(defaultSenderName);
    pushToast("info", "Display name reset to the default.");
  }

  return (
    <div className="space-y-6">
      <StatsStrip
        campaigns={stats.totalCampaigns}
        links={stats.totalInvites}
        submitted={stats.totalSubmitted}
      />

      <SectionCard
        number={1}
        accent="blue"
        title="New reporting period"
        subtitle="A reporting period groups all submissions during a window. For example, an academic year or a quarter."
      >
        <form
          onSubmit={createCampaign}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Academic Year 2025-26"
            required
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={loading || !label.trim()}
            className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create period
          </button>
        </form>
      </SectionCard>

      <SectionCard
        number={2}
        accent="green"
        title="Generate faculty form link"
        subtitle="A new shareable URL is created each time. Add a name and email to pre-fill the form and to enable the Email action."
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="campaign-select"
              className="mb-1.5 block text-sm font-semibold text-[#1e293b]"
            >
              Reporting period
            </label>
            <select
              id="campaign-select"
              name="campaign"
              value={selectedId}
              onChange={(e) => handleCampaignChange(e.target.value)}
              className="input"
            >
              {campaigns.length === 0 ? (
                <option value="">Create a period first…</option>
              ) : (
                campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c._count.submissions} submissions,{" "}
                    {c._count.invites} links)
                  </option>
                ))
              )}
            </select>
          </div>

          <form
            onSubmit={createInvite}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <label
                htmlFor="invite-name"
                className="mb-1.5 block text-sm font-semibold text-[#1e293b]"
              >
                Faculty member name
              </label>
              <input
                id="invite-name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Dr. Kwame Mensah"
                className="input"
              />
              <p className="mt-1 text-xs text-slate-500">
                Optional. Pre-fills the form and personalises the email.
              </p>
            </div>
            <div>
              <label
                htmlFor="invite-email"
                className="mb-1.5 block text-sm font-semibold text-[#1e293b]"
              >
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="username@mcgill.ca"
                className="input"
              />
              <p className="mt-1 text-xs text-slate-500">
                Optional. Required to enable the Email action below.
              </p>
            </div>
            <div>
              <label
                htmlFor="invite-faculty"
                className="mb-1.5 block text-sm font-semibold text-[#1e293b]"
              >
                Faculty
              </label>
              <select
                id="invite-faculty"
                value={inviteFaculty}
                onChange={(e) => setInviteFaculty(e.target.value)}
                className="input"
              >
                <option value="">Select faculty…</option>
                {FACULTIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Optional. Pre-fills the form.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !selectedId}
              className="sm:col-span-2 lg:col-span-3 inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a6b44] px-5 py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusIcon />
              Generate shareable link
            </button>
          </form>
        </div>
      </SectionCard>

      <SectionCard
        number={3}
        accent="amber"
        title="Sender identity for invite emails"
        subtitle="When you click Email on a link, your mail client opens with a pre-filled message signed with your name. This setting stays on this browser only."
      >
        <div className="rounded-lg border border-slate-200 bg-[#fafcff] p-4">
          {editingSender ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label
                  htmlFor="sender-name"
                  className="mb-1.5 block text-sm font-semibold text-[#1e293b]"
                >
                  Display name
                </label>
                <input
                  id="sender-name"
                  value={senderDraft}
                  onChange={(e) => setSenderDraft(e.target.value)}
                  placeholder="e.g. Ebenezer Miezah Kwofie"
                  className="input"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveSenderName}
                  className="rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelSenderEdit}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Signing as
                </p>
                <p className="mt-0.5 text-base font-semibold text-[#1e3a5f]">
                  {senderName}
                </p>
                <p className="text-xs text-slate-500">
                  {senderEmail} · {SIGN_OFF_TITLE}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSenderDraft(senderName);
                    setEditingSender(true);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Edit
                </button>
                {senderName !== defaultSenderName && (
                  <button
                    type="button"
                    onClick={resetSenderName}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1e3a5f]">
              Invite links
              {selectedCampaign && (
                <span className="ml-2 text-xs font-normal text-slate-500">
                  {selectedCampaign.label}
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredInvites.length} of {invites.length}{" "}
              {invites.length === 1 ? "link" : "links"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or email"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:border-[#2563a8] focus:outline-none focus:ring-2 focus:ring-[#2563a8]/20 sm:w-56"
              />
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
            </div>
            <FilterPills value={filter} onChange={setFilter} />
          </div>
        </div>

        {filteredInvites.length === 0 ? (
          <EmptyState hasAny={invites.length > 0} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredInvites.map((inv) => (
              <InviteRow
                key={inv.id}
                invite={inv}
                copied={copiedId === inv.id}
                busy={busyId === inv.id}
                onCopy={() => copyLink(inv)}
                onEmail={() => {
                  if (!inv.email) {
                    pushToast(
                      "info",
                      "Add an email when generating the link to enable Email.",
                    );
                    return;
                  }
                  setBusyId(inv.id);
                  window.location.href = buildMailto(inv);
                  setTimeout(() => setBusyId(null), 800);
                }}
                onOpen={() => window.open(inv.link, "_blank", "noopener")}
              />
            ))}
          </ul>
        )}
      </section>

      <ToastViewport toasts={toasts} />
    </div>
  );
}

function StatsStrip({
  campaigns,
  links,
  submitted,
}: {
  campaigns: number;
  links: number;
  submitted: number;
}) {
  const pct = links > 0 ? Math.round((submitted / links) * 100) : 0;
  const items = [
    {
      label: "Reporting periods",
      value: campaigns,
      border: "border-l-[#1e3a5f]",
      text: "text-[#1e3a5f]",
    },
    {
      label: "Total links generated",
      value: links,
      border: "border-l-[#2563a8]",
      text: "text-[#2563a8]",
    },
    {
      label: "Submitted",
      value: `${submitted}${links > 0 ? ` (${pct}%)` : ""}`,
      border: "border-l-[#15803d]",
      text: "text-[#15803d]",
    },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ring-1 ring-slate-200 ${s.border}`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {s.label}
          </p>
          <p className={`mt-1 text-2xl font-extrabold ${s.text}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

const ACCENTS: Record<
  "blue" | "green" | "amber",
  { badge: string; bar: string }
> = {
  blue: { badge: "bg-[#1e3a5f] text-white", bar: "bg-[#2563a8]" },
  green: { badge: "bg-[#1a6b44] text-white", bar: "bg-[#1a6b44]" },
  amber: { badge: "bg-[#a05c00] text-white", bar: "bg-[#a05c00]" },
};

function SectionCard({
  number,
  accent,
  title,
  subtitle,
  children,
}: {
  number: number;
  accent: keyof typeof ACCENTS;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-stretch border-b border-slate-200">
        <span aria-hidden="true" className={`w-1 ${a.bar}`} />
        <div className="flex flex-1 items-center gap-3 px-6 py-4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${a.badge}`}
            aria-hidden="true"
          >
            {number}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold leading-snug text-[#1e3a5f]">
              {title}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function FilterPills({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (f: Filter) => void;
}) {
  const opts: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "submitted", label: "Submitted" },
  ];
  return (
    <fieldset className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      <legend className="sr-only">Filter invites</legend>
      {opts.map((o) => {
        const active = value === o.id;
        return (
          <label
            key={o.id}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-white text-[#1e3a5f] shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-[#1e3a5f]"
            }`}
          >
            <input
              type="radio"
              name="invite-filter"
              value={o.id}
              checked={active}
              onChange={() => onChange(o.id)}
              className="sr-only"
            />
            {o.label}
          </label>
        );
      })}
    </fieldset>
  );
}

function InviteRow({
  invite,
  copied,
  busy,
  onCopy,
  onEmail,
  onOpen,
}: {
  invite: Invite;
  copied: boolean;
  busy: boolean;
  onCopy: () => void;
  onEmail: () => void;
  onOpen: () => void;
}) {
  const submitted = Boolean(invite.submittedAt);
  const hasEmail = Boolean(invite.email);

  return (
    <li className="group transition-colors hover:bg-slate-50/60">
      <div className="grid items-center gap-3 px-6 py-4 md:grid-cols-[1.4fr_1.6fr_auto_auto]">
        <div className="min-w-0">
          {invite.fullName ? (
            <p className="truncate text-sm font-semibold text-[#1e3a5f]">
              {invite.fullName}
            </p>
          ) : (
            <p className="truncate text-sm font-medium italic text-slate-400">
              No name on file
            </p>
          )}
          <p className="truncate text-xs text-slate-500">
            {invite.email ? (
              <a
                href={`mailto:${invite.email}`}
                className="hover:text-[#2563a8] hover:underline"
              >
                {invite.email}
              </a>
            ) : (
              <span className="italic">No email</span>
            )}
            {invite.faculty && (
              <span className="ml-1 text-slate-400">· {invite.faculty}</span>
            )}
          </p>
        </div>

        <div className="min-w-0">
          <button
            type="button"
            onClick={onCopy}
            title="Click to copy"
            className="block w-full truncate rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left font-mono text-[11.5px] text-slate-600 transition-colors hover:border-[#2563a8] hover:bg-[#eef3fa] hover:text-[#1e3a5f]"
          >
            {invite.link}
          </button>
        </div>

        <StatusBadge submitted={submitted} />

        <div className="flex items-center justify-end gap-1.5">
          <ActionButton
            onClick={onCopy}
            label={copied ? "Copied" : "Copy"}
            tone={copied ? "success" : "default"}
            icon={copied ? <CheckIcon /> : <CopyIcon />}
          />
          <ActionButton
            onClick={onEmail}
            label="Email"
            icon={<MailIcon />}
            disabled={!hasEmail || submitted || busy}
            title={
              !hasEmail
                ? "Add an email to enable"
                : submitted
                  ? "Already submitted"
                  : "Open your mail client with a draft"
            }
          />
          <ActionButton
            onClick={onOpen}
            label="Open"
            icon={<ExternalIcon />}
            title="Open this invite in a new tab"
          />
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ submitted }: { submitted: boolean }) {
  if (submitted) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
}

function ActionButton({
  onClick,
  label,
  icon,
  tone = "default",
  disabled = false,
  title,
}: {
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  tone?: "default" | "success";
  disabled?: boolean;
  title?: string;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563a8]/40";
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : disabled
        ? "border-slate-200 bg-white text-slate-400 cursor-not-allowed"
        : "border-slate-200 bg-white text-slate-700 hover:border-[#2563a8] hover:bg-[#eef3fa] hover:text-[#1e3a5f]";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${styles}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function EmptyState({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <LinkIcon />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#1e3a5f]">
        {hasAny ? "No links match this filter" : "No invite links yet"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {hasAny
          ? "Try a different filter or clear the search."
          : "Generate the first link above to share with a faculty member."}
      </p>
    </div>
  );
}

function ToastViewport({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((t) => {
        const tone =
          t.tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : t.tone === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-slate-200 bg-white text-slate-800";
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto rounded-lg border px-4 py-2.5 text-sm font-medium shadow-md ring-1 ring-black/5 ${tone}`}
          >
            {t.text}
          </div>
        );
      })}
    </div>
  );
}

// --- icons (inline SVG, no emoji) ---

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#64748b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 1 0-7.07-7.07l-1.72 1.72" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 1 0 7.07 7.07l1.72-1.72" />
    </svg>
  );
}
