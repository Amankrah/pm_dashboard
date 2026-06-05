"use client";

import { useCallback, useEffect, useState } from "react";

type NotificationLog = {
  id: string;
  type: string;
  toAddress: string;
  ccAddress: string | null;
  subject: string;
  status: string;
  error: string | null;
  createdAt: string;
};

export function SettingsView({ isAdmin }: { isAdmin: boolean }) {
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [notifyTo, setNotifyTo] = useState<string[]>([]);
  const [notifyCc, setNotifyCc] = useState<string[]>([]);
  const [notifyRespondent, setNotifyRespondent] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setSmtpConfigured(data.smtpConfigured);
    setNotifyTo(data.notifyTo ?? []);
    setNotifyCc(data.notifyCc ?? []);
    setNotifyRespondent(data.notifyRespondent ?? false);
    setLogs(data.logs ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function sendTest() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/notifications/test", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Test failed.");
    } else {
      setMessage(
        data.status === "sent"
          ? "Test email sent to your login address."
          : data.error ?? "Test logged (check SMTP).",
      );
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-[#1e3a5f]">Notifications & email</h1>
        <p className="text-sm text-slate-600">
          Configure SMTP in <code className="text-xs">.env</code>. When a faculty member submits a form, the Academic Lead receives an email. Invite links can be emailed from Campaigns.
        </p>
      </div>

      <div className="rounded-[10px] bg-white p-6 shadow-sm">
        <h2 className="font-bold text-[#1e3a5f]">SMTP status</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">Status</span>
            <p className={`mt-1 font-semibold ${smtpConfigured ? "text-[#15803d]" : "text-amber-700"}`}>
              {smtpConfigured ? "Configured" : "Not configured. Notifications are logged only."}
            </p>
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">Notify on submit</span>
            <p className="mt-1">{notifyTo.join(", ") || "Not set"}</p>
            {notifyCc.length > 0 && (
              <p className="text-xs text-slate-500">CC: {notifyCc.join(", ")}</p>
            )}
          </div>
          <div>
            <span className="text-xs font-bold uppercase text-slate-500">Confirm to respondent</span>
            <p className="mt-1">{notifyRespondent ? "Yes (NOTIFY_RESPONDENT=true)" : "No"}</p>
          </div>
        </div>

        {!smtpConfigured && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Development mode</p>
            <p className="mt-1">
              Without SMTP, submissions still save to the database. Each notification is recorded below with status <strong>skipped</strong>.
            </p>
            <p className="mt-2 text-xs">
              Submissions notify <strong>ebenezer.kwofie@mcgill.ca</strong> by default
              (<code>NOTIFY_TO</code>). Configure <code>SMTP_HOST</code>, <code>SMTP_USER</code>,{" "}
              <code>SMTP_PASS</code> to send live emails.
            </p>
          </div>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={sendTest}
            disabled={loading || !smtpConfigured}
            className="mt-4 rounded-lg bg-[#1e3a5f] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Send test email to my address
          </button>
        )}
        {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
      </div>

      <div className="overflow-hidden rounded-[10px] bg-white shadow-sm">
        <div className="bg-[#1e3a5f] px-5 py-2.5 text-xs font-bold text-white">
          Recent notification log
        </div>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">To</th>
              <th className="px-4 py-2">Subject</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center italic text-slate-500">
                  No notifications yet. Submit a form or send a test email.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100">
                  <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-xs">{log.type}</td>
                  <td className="px-4 py-2 text-xs max-w-[140px] truncate">{log.toAddress}</td>
                  <td className="px-4 py-2 text-xs max-w-[200px] truncate">{log.subject}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        log.status === "sent"
                          ? "bg-green-100 text-green-800"
                          : log.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {log.status}
                    </span>
                    {log.error && (
                      <p className="mt-0.5 text-[10px] text-red-600 truncate max-w-[120px]" title={log.error}>
                        {log.error}
                      </p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
