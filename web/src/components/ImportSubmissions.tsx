"use client";

import { useState } from "react";

export function ImportSubmissions({
  campaigns,
}: {
  campaigns: { id: string; label: string }[];
}) {
  const [periodId, setPeriodId] = useState(campaigns[0]?.id ?? "");
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState("");

  async function handleImport() {
    setMessage("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setMessage("Invalid JSON.");
      return;
    }

    const submissions = Array.isArray(parsed) ? parsed : [parsed];

    const res = await fetch("/api/submissions/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodId, submissions }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error?.toString() ?? "Import failed.");
      return;
    }
    setMessage(`Imported ${data.imported}, skipped ${data.skipped} duplicates.`);
    setJsonText("");
  }

  if (campaigns.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-[#1e3a5f]">Import JSON submissions</h2>
      <p className="mt-1 text-sm text-slate-600">
        Paste one submission object or an array (same format as the original HTML form export).
      </p>
      <label
        htmlFor="import-period-select"
        className="mt-4 block text-xs font-semibold uppercase text-slate-500"
      >
        Reporting period
      </label>
      <select
        id="import-period-select"
        name="period"
        value={periodId}
        onChange={(e) => setPeriodId(e.target.value)}
        className="mt-1 block w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={8}
        placeholder='{ "respondent": { ... }, "activities": [ ... ] }'
        className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
      />
      <button
        type="button"
        onClick={handleImport}
        className="mt-3 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white"
      >
        Import to database
      </button>
      {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
    </section>
  );
}
