"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeTag } from "@/components/dashboard/ThemeTag";

type Row = {
  id: string;
  fullName: string;
  faculty: string;
  periodLabel: string;
  reportKey: string | null;
  activityCount: number;
  themes: string[];
  crossPillar: boolean;
  submittedAt: string;
};

export function SubmissionsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="rounded-[10px] bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        No submissions yet. Generate an invite link under{" "}
        <Link
          href="/dashboard/campaigns"
          className="font-semibold text-[#2563a8] hover:underline"
        >
          Campaigns and Links
        </Link>{" "}
        and share it with a faculty member.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#1e3a5f] text-xs uppercase text-white">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Faculty</th>
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Activities</th>
            <th className="px-4 py-3">Pillars</th>
            <th className="px-4 py-3 whitespace-nowrap">Submitted</th>
            <th className="sr-only px-4 py-3">View</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const href = `/dashboard/submissions/${s.id}`;
            return (
              <tr
                key={s.id}
                onClick={() => router.push(href)}
                className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-[#eef3fa]"
                title="Open submission"
              >
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={href}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#1e3a5f] hover:underline"
                  >
                    {s.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs">{s.faculty}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {s.reportKey && (
                    <span className="mr-2 inline-block rounded-md bg-[#fff4dc] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#7a4300] ring-1 ring-[#f5d597]">
                      {s.reportKey}
                    </span>
                  )}
                  <span className="text-xs text-slate-600">
                    {s.periodLabel}
                  </span>
                </td>
                <td className="px-4 py-3">{s.activityCount}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.themes.map((t) => (
                      <ThemeTag key={t} theme={t} />
                    ))}
                  </div>
                  {s.crossPillar && (
                    <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-800">
                      cross-pillar
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {s.submittedAt}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    aria-hidden="true"
                    className="text-slate-400 group-hover:text-[#1e3a5f]"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="inline-block"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
