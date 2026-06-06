"use client";

import { useEffect, useState } from "react";

type Info = {
  signedInAs: string;
  role: string;
  allowedCount: number;
  appUrl: string;
};

export function SettingsView({
  email,
  isAdmin,
}: {
  email: string;
  isAdmin: boolean;
}) {
  const [info, setInfo] = useState<Info | null>(null);

  useEffect(() => {
    fetch("/api/system/info")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setInfo(d))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-[#1e3a5f]">Account and system</h1>
        <p className="mt-1 text-sm text-slate-600">
          Account, allowlist, and how outbound email is handled in this
          deployment.
        </p>
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-[#1e3a5f]">Signed in</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Your dashboard session.
          </p>
        </div>
        <div className="grid gap-4 px-6 py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Email
            </p>
            <p className="mt-1 font-semibold text-[#1e3a5f]">{email}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Role
            </p>
            <p className="mt-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                  isAdmin
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-100 text-slate-700 ring-slate-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isAdmin ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                {isAdmin ? "Admin" : "Viewer"}
              </span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Allowlisted users
            </p>
            <p className="mt-1 font-semibold">
              {info ? info.allowedCount : "…"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Manage by editing <code className="text-[11px]">ALLOWED_EMAILS</code>{" "}
              in <code className="text-[11px]">web/.env</code> on the server,
              then running{" "}
              <code className="text-[11px]">npx prisma db seed</code>.
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Public app URL
            </p>
            <p className="mt-1 font-mono text-xs text-slate-700">
              {info ? info.appUrl : "…"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Used to build invite links. Set via{" "}
              <code className="text-[11px]">NEXT_PUBLIC_APP_URL</code>.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-[#1e3a5f]">
            How outbound email works here
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            The dashboard does not run its own mail server.
          </p>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm leading-relaxed text-slate-700">
          <p>
            This deployment uses your <strong>McGill Outlook</strong> for every
            outbound message. When you click <strong>Email</strong> next to an
            invite link, the dashboard composes a draft and opens it in your
            default mail client. You review and send from your own account, so
            replies thread back to your inbox and McGill&apos;s authentication
            signs the message.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              What this means
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e3a5f]" />
                <span>
                  No SMTP credentials are stored or required on the server.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e3a5f]" />
                <span>
                  Submission alerts are <em>not</em> auto-emailed. New
                  submissions appear in real time under{" "}
                  <a
                    href="/dashboard/submissions"
                    className="font-semibold text-[#2563a8] hover:underline"
                  >
                    Submissions
                  </a>
                  .
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e3a5f]" />
                <span>
                  Invite emails are sent from your Outlook via{" "}
                  <a
                    href="/dashboard/campaigns"
                    className="font-semibold text-[#2563a8] hover:underline"
                  >
                    Campaigns and form links
                  </a>
                  . The sender name shown in the body comes from the &quot;Sender
                  identity&quot; card on that page.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
