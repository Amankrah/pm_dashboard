"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { NarrativeBlock } from "@/components/dashboard/NarrativeBlock";
import {
  CHALLENGE_PILLARS,
  PILLARS,
  PILLAR_META,
  type Pillar,
} from "@/lib/constants";
import {
  buildIndicatorRollup,
  buildPillarActivityRollup,
  INDICATOR_ROWS,
} from "@/lib/analytics/indicator-rollup";
import {
  outputIndicatorsByPillar,
  outputIndicatorMeta,
  OUTPUT_INDICATORS,
} from "@/lib/analytics/output-indicators";
import {
  OUTCOME_INDICATORS,
  outcomeIndicatorGroups,
} from "@/lib/analytics/outcome-indicators";
import type { FlatActivity, SubmissionRow } from "@/lib/analytics/types";

type Period = {
  id: string;
  label: string;
  reportKey: string;
  programYear: number;
  quarter: number;
  status: string;
};

type SelectedPeriod = Period & {
  startDate: string | null;
  endDate: string | null;
};

type ChallengeRow = {
  pillar: string;
  challenge: string;
  contributingFactor: string | null;
  responseApproach: string | null;
};

type StoryRow = {
  consent: boolean;
  participantName: string | null;
  programActivity: string;
  location: string | null;
  story: string;
  outcomes: string | null;
  photoUrl: string | null;
};

type SubmissionExtras = {
  id: string;
  fullName: string;
  faculty: string;
  lessonsLearned: string | null;
  otherInformation: string | null;
  challenges: ChallengeRow[];
  successStories: StoryRow[];
};

type Props = {
  periods: Period[];
  selected: SelectedPeriod;
  activities: FlatActivity[];
  submissionsForPeriod: SubmissionRow[];
  submissionsWithExtras: SubmissionExtras[];
  indicatorTargets: Partial<Record<string, number>>;
  outputs: {
    targets: Record<string, number>;
    entries: Record<string, { value: number; comments: string | null }>;
    cumulative: Record<string, number>;
  };
  outcomes: {
    targets: Record<string, number>;
    entries: Record<string, { value: number; comments: string | null }>;
    cumulative: Record<string, number>;
  };
  programAdjustments: {
    workplan: Array<{
      initialPlan: string;
      change: string;
      reason: string | null;
      implications: string | null;
    }>;
    risks: Array<{ description: string; response: string | null }>;
    upcomingActivities: string | null;
  };
  contactEmail: string;
};

const SCREEN_HIDDEN_IN_PRINT = "print:hidden";

function rowKey(pillar: string, indicator: string) {
  return `${pillar}::${indicator}`;
}

function fmtCount(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString();
}

function fmtPercent(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `${n}%`;
}

function fmtCurrency(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `$${n.toLocaleString()}`;
}

export function PartnerNarrativeReport({
  periods,
  selected,
  activities,
  submissionsForPeriod,
  submissionsWithExtras,
  indicatorTargets,
  outputs,
  outcomes,
  programAdjustments,
  contactEmail,
}: Props) {
  const router = useRouter();
  const reportKey = selected.reportKey;
  const ctx = useMemo(
    () => ({
      reportKey,
      programYear: selected.programYear,
      quarter: selected.quarter,
    }),
    [reportKey, selected.programYear, selected.quarter],
  );

  const rollup = useMemo(
    () =>
      buildIndicatorRollup(
        activities,
        ctx,
        indicatorTargets as Partial<
          Record<(typeof INDICATOR_ROWS)[number]["key"], number>
        >,
      ),
    [activities, ctx, indicatorTargets],
  );

  const pillarRollup = useMemo(
    () => buildPillarActivityRollup(activities, ctx),
    [activities, ctx],
  );

  // Activities for this period only, used in 1.1 and 1.3.
  const periodActivities = activities.filter(
    (a) => a.submission.periodReportKey === reportKey,
  );

  // Partner-type summary for Section 2.
  const partnerTypeCounts = new Map<string, number>();
  for (const a of periodActivities) {
    const t = a.partnerType ?? "Unknown";
    partnerTypeCounts.set(t, (partnerTypeCounts.get(t) ?? 0) + 1);
  }

  const allChallenges = submissionsWithExtras.flatMap((s) =>
    s.challenges.map((c) => ({ ...c, submitter: s.fullName, faculty: s.faculty })),
  );

  const allStories = submissionsWithExtras.flatMap((s) =>
    s.successStories.map((st) => ({
      ...st,
      submitter: s.fullName,
      faculty: s.faculty,
    })),
  );

  const aggregatedLessons = submissionsWithExtras
    .filter((s) => s.lessonsLearned && s.lessonsLearned.trim())
    .map((s) => ({
      fullName: s.fullName,
      faculty: s.faculty,
      lessonsLearned: s.lessonsLearned!,
    }));

  const aggregatedAdditional = submissionsWithExtras
    .filter((s) => s.otherInformation && s.otherInformation.trim())
    .map((s) => ({
      fullName: s.fullName,
      faculty: s.faculty,
      otherInformation: s.otherInformation!,
    }));

  return (
    <div className="space-y-5">
      {/* Print + screen hybrid stylesheet. Hides the dashboard chrome in
          print mode so the report fills the page edge-to-edge. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 1.5cm; }
          html, body { background: #fff !important; }
          aside, header.sticky { display: none !important; }
          main { padding: 0 !important; background: #fff !important; }
          .print-no-shadow { box-shadow: none !important; }
          .report-section { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* Toolbar (screen only) */}
      <div
        className={`flex flex-wrap items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200 ${SCREEN_HIDDEN_IN_PRINT}`}
      >
        <h1 className="text-lg font-bold text-[#1e3a5f]">
          Partner Narrative Report
        </h1>
        <label className="ml-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Period
          <select
            value={selected.id}
            onChange={(e) =>
              router.push(
                `/dashboard/reports/partner-narrative?periodId=${e.target.value}`,
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#1e3a5f]"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.reportKey} · {p.label}
                {p.status === "closed" ? " [closed]" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-[#1e3a5f] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Print or save PDF
        </button>
      </div>

      <article className="space-y-6 rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200 print-no-shadow print:p-0 print:shadow-none print:ring-0">
        {/* Cover */}
        <header className="report-section border-b-2 border-[#1e3a5f] pb-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Mastercard Foundation · Nkabom Collaborative
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#1e3a5f]">
            Periodic Narrative Report
          </h1>
          <p className="mt-1 text-sm text-slate-700">
            {selected.reportKey} · {selected.label}
            {selected.startDate && selected.endDate
              ? ` · ${selected.startDate} to ${selected.endDate}`
              : ""}
          </p>
        </header>

        {/* General information */}
        <section className="report-section">
          <SectionHeading number="1" title="General Information" />
          <table className="mt-3 w-full border-collapse text-sm">
            <tbody>
              <Row label="Organization Name" value="McGill University" />
              <Row
                label="Organization or Unit"
                value="Academic Lead Office, Nkabom Collaborative"
              />
              <Row label="Contact Person" value={contactEmail} />
              <Row label="Program" value="Nkabom Collaborative" />
              <Row
                label="Reporting Quarter"
                value={selected.reportKey}
                mono
              />
              <Row
                label="Reporting Period"
                value={
                  selected.startDate && selected.endDate
                    ? `${selected.startDate} to ${selected.endDate}`
                    : selected.label
                }
              />
            </tbody>
          </table>
        </section>

        {/* 1.1 Description of activities */}
        <section className="report-section">
          <SectionHeading number="1.1" title="Description of activities" />
          <p className="mt-2 text-xs text-slate-500">
            Synthesis narrative for the Secretariat. Edit below; the activity
            inventory underneath is auto-generated from faculty submissions.
          </p>
          <div className="mt-2">
            <NarrativeBlock
              reportKey={reportKey}
              id="description"
              placeholder="Summarise the main activities implemented this reporting period…"
              rows={6}
            />
          </div>
          {periodActivities.length > 0 && (
            <table className="mt-4 w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <Th>Activity</Th>
                  <Th>Type</Th>
                  <Th>Dates</Th>
                  <Th>Location</Th>
                  <Th>Partner</Th>
                  <Th>Pillars</Th>
                </tr>
              </thead>
              <tbody>
                {periodActivities.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100">
                    <Td>
                      <span className="font-semibold text-[#1e3a5f]">
                        {a.title}
                      </span>
                      <br />
                      <span className="text-xs text-slate-500">
                        {a.submission.faculty} · {a.submission.fullName}
                      </span>
                    </Td>
                    <Td>{a.activityType ?? "—"}</Td>
                    <Td>
                      {[a.startDate, a.endDate].filter(Boolean).join(" to ") || "—"}
                    </Td>
                    <Td>
                      {a.location ?? "—"}
                      {a.localeType && (
                        <span className="ml-1 text-xs text-slate-500">
                          ({a.localeType})
                        </span>
                      )}
                    </Td>
                    <Td>
                      {a.partnerInstitution ?? "—"}
                      {a.partnerType && (
                        <span className="ml-1 text-xs text-slate-500">
                          ({a.partnerType})
                        </span>
                      )}
                    </Td>
                    <Td>{a.themes.join(", ")}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 1.2 Overall Indicator Performance */}
        <section className="report-section">
          <SectionHeading number="1.2" title="Overall Indicator Performance" />
          <table className="mt-3 w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <Th>Indicator</Th>
                <Th align="right">Annual Target</Th>
                <Th align="right">Previous Qtr</Th>
                <Th align="right">Current Qtr</Th>
                <Th align="right">Cumulative (Year)</Th>
              </tr>
            </thead>
            <tbody>
              {rollup.rows.map((r) => (
                <tr key={r.key} className="border-b border-slate-100">
                  <Td>
                    <span
                      className={r.indent ? "pl-6 text-slate-700" : "font-semibold text-[#1e3a5f]"}
                    >
                      {r.label}
                    </span>
                  </Td>
                  <Td align="right">{fmtCount(r.annualTarget)}</Td>
                  <Td align="right">{fmtCount(r.previousQtr)}</Td>
                  <Td align="right">
                    <strong>{fmtCount(r.currentQtr)}</strong>
                  </Td>
                  <Td align="right">{fmtCount(r.cumulativeYtd)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 1.3 Programme Achievements by Pillar */}
        <section className="report-section">
          <SectionHeading number="1.3" title="Programme Achievements by Pillar" />
          {PILLARS.map((p) => {
            const pillarActs = periodActivities.filter((a) => a.themes.includes(p));
            const counts = pillarRollup.find((r) => r.pillar === p);
            return (
              <div key={p} className="mt-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white ${PILLAR_META[p].bgClass}`}
                  >
                    {PILLAR_META[p].abbr}
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#1e3a5f]">
                    Pillar — {p}
                  </h3>
                  <span className="ml-auto text-xs text-slate-500">
                    Activities this Qtr: <strong>{counts?.currentQtr ?? 0}</strong>{" "}
                    · Cumulative: <strong>{counts?.cumulativeYtd ?? 0}</strong>
                  </span>
                </div>
                <div className="mt-2">
                  <NarrativeBlock
                    reportKey={reportKey}
                    id={`achievements:${p}`}
                    placeholder={`Key achievements and results under ${p} this period…`}
                    rows={4}
                  />
                </div>
                {pillarActs.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-slate-700">
                    {pillarActs.map((a) => (
                      <li key={a.id}>
                        <span className="font-semibold">{a.title}</span>
                        {a.status && (
                          <span className="ml-1 text-xs text-slate-500">
                            · {a.status}
                          </span>
                        )}
                        {a.partnerInstitution && (
                          <span className="ml-1 text-xs text-slate-500">
                            · {a.partnerInstitution}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>

        {/* 1.4 Programme Challenges and Barriers */}
        <section className="report-section">
          <SectionHeading
            number="1.4"
            title="Programme Challenges and Barriers for Success"
          />
          {CHALLENGE_PILLARS.map((pillar) => {
            const rows = allChallenges.filter((c) => c.pillar === pillar);
            return (
              <div key={pillar} className="mt-4">
                <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-[#1e3a5f]">
                  {pillar}
                  {rows.length === 0 && (
                    <span className="ml-2 text-[11px] font-normal text-slate-400">
                      ☐ N/A
                    </span>
                  )}
                </h3>
                {rows.length > 0 && (
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <Th>#</Th>
                        <Th>Challenge</Th>
                        <Th>Contributing Factor</Th>
                        <Th>Response Approach</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c, idx) => (
                        <tr
                          key={`${c.submitter}-${idx}`}
                          className="border-b border-slate-100"
                        >
                          <Td>{idx + 1}</Td>
                          <Td>
                            <p className="whitespace-pre-line">{c.challenge}</p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {c.faculty} · {c.submitter}
                            </p>
                          </Td>
                          <Td>
                            <p className="whitespace-pre-line">
                              {c.contributingFactor ?? "—"}
                            </p>
                          </Td>
                          <Td>
                            <p className="whitespace-pre-line">
                              {c.responseApproach ?? "—"}
                            </p>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </section>

        {/* 1.5 Implementation Learning */}
        <section className="report-section">
          <SectionHeading number="1.5" title="Implementation Learning" />
          <div className="mt-2">
            <NarrativeBlock
              reportKey={reportKey}
              id="implementation-learning"
              placeholder="Synthesise key lessons learned across submissions…"
              rows={5}
            />
          </div>
          {aggregatedLessons.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Source lessons from faculty submissions
              </p>
              {aggregatedLessons.map((l) => (
                <div
                  key={l.fullName}
                  className="rounded border border-slate-200 bg-slate-50 p-3 text-sm"
                >
                  <p className="text-[11px] font-semibold text-[#1e3a5f]">
                    {l.faculty} · {l.fullName}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-slate-700">
                    {l.lessonsLearned}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 2 Program Updates */}
        <section className="report-section">
          <SectionHeading number="2" title="Program Updates" />
          <p className="mt-1 text-xs text-slate-500">
            Engagement with partners and stakeholders, including government,
            industry, community organisations, and academic institutions.
          </p>
          <div className="mt-2">
            <NarrativeBlock
              reportKey={reportKey}
              id="collaboration-update"
              placeholder="Describe partner engagement and key results…"
              rows={5}
            />
          </div>
          {partnerTypeCounts.size > 0 && (
            <table className="mt-3 w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <Th>Partner type</Th>
                  <Th align="right">Activities this quarter</Th>
                </tr>
              </thead>
              <tbody>
                {[...partnerTypeCounts.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([t, n]) => (
                    <tr key={t} className="border-b border-slate-100">
                      <Td>{t}</Td>
                      <Td align="right">{n}</Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 3 Program Adjustments */}
        <section className="report-section">
          <SectionHeading number="3" title="Program Adjustments" />

          <h3 className="mt-3 text-sm font-bold text-[#1e3a5f]">
            Workplan adjustments
          </h3>
          {programAdjustments.workplan.length === 0 ? (
            <p className="text-sm italic text-slate-500">☐ N/A</p>
          ) : (
            <table className="mt-2 w-full border-collapse text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <Th>Initial Plan</Th>
                  <Th>Change</Th>
                  <Th>Reason</Th>
                  <Th>Implications</Th>
                </tr>
              </thead>
              <tbody>
                {programAdjustments.workplan.map((w, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <Td>
                      <p className="whitespace-pre-line">{w.initialPlan}</p>
                    </Td>
                    <Td>
                      <p className="whitespace-pre-line">{w.change}</p>
                    </Td>
                    <Td>
                      <p className="whitespace-pre-line">{w.reason ?? "—"}</p>
                    </Td>
                    <Td>
                      <p className="whitespace-pre-line">
                        {w.implications ?? "—"}
                      </p>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="mt-4 text-sm font-bold text-[#1e3a5f]">Risks</h3>
          {programAdjustments.risks.length === 0 ? (
            <p className="text-sm italic text-slate-500">☐ N/A</p>
          ) : (
            <ul className="mt-2 list-disc space-y-2 pl-6 text-sm">
              {programAdjustments.risks.map((r, idx) => (
                <li key={idx}>
                  <p className="whitespace-pre-line text-slate-700">
                    {r.description}
                  </p>
                  {r.response && (
                    <p className="mt-1 text-xs text-slate-500">
                      <strong>Response:</strong> {r.response}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-4 text-sm font-bold text-[#1e3a5f]">
            Upcoming activities, dates, and events
          </h3>
          {programAdjustments.upcomingActivities ? (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
              {programAdjustments.upcomingActivities}
            </p>
          ) : (
            <p className="text-sm italic text-slate-500">
              Not yet provided. See Program Adjustments page.
            </p>
          )}
        </section>

        {/* 4 Output + Outcome */}
        <section className="report-section">
          <SectionHeading number="4" title="Outcome and Output Reporting" />

          <h3 className="mt-3 text-sm font-bold uppercase tracking-wide text-[#1e3a5f]">
            Output Level Progress
          </h3>
          {PILLARS.filter((p) =>
            OUTPUT_INDICATORS.some((m) => m.pillar === p),
          ).map((p) => (
            <div key={p} className="mt-3">
              <p className="mb-1 text-xs font-bold text-[#1e3a5f]">{p}</p>
              <OutputTable
                pillar={p}
                outputs={outputs}
              />
            </div>
          ))}

          <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-[#1e3a5f]">
            Outcome Level Progress
          </h3>
          <OutcomeMatrix outcomes={outcomes} />
        </section>

        {/* 5 Additional Information */}
        <section className="report-section">
          <SectionHeading number="5" title="Additional Information" />
          <div className="mt-2">
            <NarrativeBlock
              reportKey={reportKey}
              id="additional-information"
              placeholder="Anything else relevant to implementation or reporting…"
              rows={4}
            />
          </div>
          {aggregatedAdditional.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Source notes from faculty submissions
              </p>
              {aggregatedAdditional.map((a) => (
                <div
                  key={a.fullName}
                  className="rounded border border-slate-200 bg-slate-50 p-3 text-sm"
                >
                  <p className="text-[11px] font-semibold text-[#1e3a5f]">
                    {a.faculty} · {a.fullName}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-slate-700">
                    {a.otherInformation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6 Success Stories */}
        <section className="report-section">
          <SectionHeading number="6" title="Success Stories" />
          {allStories.length === 0 ? (
            <p className="mt-2 text-sm italic text-slate-500">
              No success stories submitted for this period.
            </p>
          ) : (
            <ol className="mt-3 space-y-4">
              {allStories.map((s, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#a05c00] text-[11px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-[#1e3a5f]">
                      {s.programActivity}
                    </span>
                    {s.consent ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        Consent given
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-300">
                        Internal only — withhold from publication
                      </span>
                    )}
                    {s.consent && s.participantName && (
                      <span className="text-xs font-semibold text-[#1e3a5f]">
                        {s.participantName}
                      </span>
                    )}
                    {s.location && (
                      <span className="text-xs text-slate-500">
                        · {s.location}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {s.story}
                  </p>
                  {s.outcomes && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      <strong>Notable outcomes:</strong> {s.outcomes}
                    </p>
                  )}
                  {s.photoUrl && (
                    <p className="mt-2 text-xs text-slate-500">
                      Photo or media:{" "}
                      <a
                        className="break-all text-[#2563a8] hover:underline"
                        href={s.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {s.photoUrl}
                      </a>
                    </p>
                  )}
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-slate-400">
                    Submitted by {s.faculty} · {s.submitter}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="report-section mt-6 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
          Generated from the Nkabom Activity Map dashboard. Submit to{" "}
          <a
            href="mailto:secretariat.nkabom@mcgill.ca"
            className="font-semibold text-[#2563a8] hover:underline"
          >
            secretariat.nkabom@mcgill.ca
          </a>
          .
        </footer>
      </article>

      <div className={`flex justify-end ${SCREEN_HIDDEN_IN_PRINT}`}>
        <span className="text-xs italic text-slate-500">
          Narrative blocks save automatically to your browser, scoped to this
          reporting period.
        </span>
      </div>
    </div>
  );
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="border-l-4 border-[#1e3a5f] pl-3 text-base font-bold uppercase tracking-wide text-[#1e3a5f]">
      <span className="mr-2 text-slate-400">{number}.</span>
      {title}
    </h2>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <tr className="border-b border-slate-100">
      <td className="w-1/3 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </td>
      <td
        className={`px-3 py-2 text-sm text-slate-800 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </td>
    </tr>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <th className={`border-b border-slate-200 px-3 py-2 text-${align}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "center";
}) {
  return (
    <td className={`px-3 py-2 align-top text-${align} tabular-nums`}>
      {children}
    </td>
  );
}

function OutputTable({
  pillar,
  outputs,
}: {
  pillar: Pillar;
  outputs: Props["outputs"];
}) {
  const groups = outputIndicatorsByPillar(pillar);
  return (
    <table className="w-full border-collapse text-sm">
      <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
        <tr>
          <Th>Indicator</Th>
          <Th align="right">Annual Target</Th>
          <Th align="right">Achieved this Qtr</Th>
          <Th align="right">Cumulative (Year)</Th>
          <Th>Comments</Th>
        </tr>
      </thead>
      <tbody>
        {groups.map((g) => (
          <>
            <tr key={`${g.parent}-h`} className="bg-slate-50">
              <td
                colSpan={5}
                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1e3a5f]"
              >
                {g.parent}
              </td>
            </tr>
            {g.rows.map((meta) => {
              const k = rowKey(pillar, meta.key);
              const m = outputIndicatorMeta(meta.key)!;
              const value = outputs.entries[k]?.value;
              const target = outputs.targets[k];
              const cum = outputs.cumulative[k] ?? 0;
              const fmt =
                m.unit === "percent"
                  ? fmtPercent
                  : m.unit === "currency"
                    ? fmtCurrency
                    : fmtCount;
              return (
                <tr
                  key={`${pillar}-${meta.key}`}
                  className="border-b border-slate-100"
                >
                  <Td>
                    <span className="pl-6 text-slate-700">{meta.label}</span>
                  </Td>
                  <Td align="right">{fmt(target ?? null)}</Td>
                  <Td align="right">
                    <strong>{fmt(value ?? null)}</strong>
                  </Td>
                  <Td align="right">{fmt(cum)}</Td>
                  <Td>{outputs.entries[k]?.comments ?? "—"}</Td>
                </tr>
              );
            })}
          </>
        ))}
      </tbody>
    </table>
  );
}

function OutcomeMatrix({
  outcomes,
}: {
  outcomes: Props["outcomes"];
}) {
  const groups = outcomeIndicatorGroups();
  return (
    <div className="mt-2 space-y-3">
      {groups.map((g) => (
        <div key={g.parent}>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#1e3a5f]">
            {g.parent}
          </p>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <Th>Outcome</Th>
                {PILLARS.map((p) => (
                  <Th key={p} align="right">
                    {p}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.rows.map((meta) => (
                <tr key={meta.key} className="border-b border-slate-100">
                  <Td>
                    <span className="text-slate-700">{meta.label}</span>
                    <span className="ml-1 text-[10px] uppercase text-slate-400">
                      {meta.unit}
                    </span>
                  </Td>
                  {PILLARS.map((p) => {
                    const k = rowKey(p, meta.key);
                    const v = outcomes.entries[k]?.value;
                    const cum = outcomes.cumulative[k] ?? 0;
                    const fmt = meta.unit === "percent" ? fmtPercent : fmtCount;
                    return (
                      <Td key={p} align="right">
                        <div className="text-sm">
                          <strong>{fmt(v ?? null)}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          YTD {fmt(cum)}
                        </div>
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Use the indicator-vocabulary array so unused imports don't
              break tree-shaking concerns; the array is small and the
              compile-time link is cheap. */}
          {OUTCOME_INDICATORS.length === 0 && null}
        </div>
      ))}
    </div>
  );
}
