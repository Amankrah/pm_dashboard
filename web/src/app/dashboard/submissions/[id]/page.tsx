import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { StatusDot, ThemeTag } from "@/components/dashboard/ThemeTag";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PARTICIPANT_FIELDS } from "@/lib/constants";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      activities: {
        include: { themes: true },
        orderBy: { id: "asc" },
      },
      period: {
        select: {
          label: true,
          slug: true,
          reportKey: true,
          programYear: true,
          quarter: true,
        },
      },
    },
  });

  if (!submission) notFound();

  const additional: { label: string; value: string }[] = [];
  if (submission.resourcesNeeded)
    additional.push({ label: "Resources needed", value: submission.resourcesNeeded });
  if (submission.collaborationOpportunities)
    additional.push({
      label: "Collaboration opportunities",
      value: submission.collaborationOpportunities,
    });
  if (submission.challengesBarriers)
    additional.push({
      label: "Challenges and barriers",
      value: submission.challengesBarriers,
    });
  if (submission.lessonsLearned)
    additional.push({
      label: "Lessons learned",
      value: submission.lessonsLearned,
    });
  if (submission.outcomesAchievements)
    additional.push({
      label: "Outcomes and achievements",
      value: submission.outcomesAchievements,
    });
  if (submission.otherInformation)
    additional.push({ label: "Other information", value: submission.otherInformation });

  const submittedAt = submission.submittedAt.toLocaleString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-5 print:space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/dashboard/submissions"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#2563a8] hover:bg-[#eef3fa] hover:text-[#1e3a5f]"
        >
          <BackIcon />
          Back to submissions
        </Link>
        <PrintButton />
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-stretch border-b border-slate-200">
          <span aria-hidden="true" className="w-1 bg-[#2563a8]" />
          <div className="flex-1 px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Submission
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#1e3a5f]">
              {submission.fullName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {submission.position}
              {submission.department ? ` · ${submission.department}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip label={submission.faculty} tone="blue" />
              {submission.period.reportKey && (
                <Chip label={submission.period.reportKey} tone="amber" />
              )}
              <Chip label={submission.period.label} tone="slate" />
              <Chip
                label={`Submitted ${submittedAt}`}
                tone="slate"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-4 px-6 py-5 text-sm sm:grid-cols-2">
          <Field
            label="Email"
            value={
              <a
                href={`mailto:${submission.email}`}
                className="font-semibold text-[#2563a8] hover:underline"
              >
                {submission.email}
              </a>
            }
          />
          <Field label="Submission date" value={submission.submissionDate} />
          <Field label="Faculty" value={submission.faculty} />
          <Field label="Department or unit" value={submission.department} />
          <Field label="Position" value={submission.position} />
          <Field label="Reporting period" value={submission.period.label} />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-[#1e3a5f]">
            Activities ({submission.activities.length})
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Each activity the respondent reported, in the order they were entered.
          </p>
        </div>

        {submission.activities.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm italic text-slate-500">
            This submission has no activities.
          </p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {submission.activities.map((a, idx) => {
              const themes = a.themes.map((t) => t.theme);
              const crossPillar = themes.length > 1;
              const dateLine = formatDateRange(a.startDate, a.endDate);
              return (
                <li key={a.id} className="px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1e3a5f] text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-[#1e3a5f]">
                          {a.title}
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <StatusDot status={a.status} />
                          {a.activityType && (
                            <span className="rounded-full bg-[#eef3fa] px-2 py-0.5 text-[10px] font-semibold text-[#1e3a5f] ring-1 ring-[#cdddef]">
                              {a.activityType}
                            </span>
                          )}
                          {themes.map((t) => (
                            <ThemeTag key={t} theme={t} />
                          ))}
                          {crossPillar && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              cross-pillar
                            </span>
                          )}
                          {dateLine && (
                            <span className="text-xs text-slate-500">
                              {dateLine}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {a.partnerInstitution && (
                      <Field
                        label="Partner institution"
                        value={a.partnerInstitution}
                      />
                    )}
                    {a.contactName && (
                      <Field
                        label="Contact person"
                        value={
                          <>
                            <span>{a.contactName}</span>
                            {a.contactEmail && (
                              <>
                                <br />
                                <a
                                  href={`mailto:${a.contactEmail}`}
                                  className="font-medium text-[#2563a8] hover:underline"
                                >
                                  {a.contactEmail}
                                </a>
                              </>
                            )}
                          </>
                        }
                      />
                    )}
                    {a.location && (
                      <Field label="Location" value={a.location} />
                    )}
                    {a.localeType && (
                      <Field label="Setting" value={a.localeType} />
                    )}
                  </div>

                  {(() => {
                    const reported = PARTICIPANT_FIELDS.filter(
                      (f) => a[f.column] !== null && a[f.column] !== undefined,
                    );
                    if (reported.length === 0) return null;
                    return (
                      <div className="mt-5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Participants
                        </p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {reported.map((f) => (
                            <div
                              key={f.key}
                              className="rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-200"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                {f.label}
                              </p>
                              <p className="mt-0.5 text-lg font-bold text-[#1e3a5f]">
                                {(a[f.column] as number).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {a.description && (
                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Description
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {a.description}
                      </p>
                    </div>
                  )}

                  {a.outputs && (
                    <div className="mt-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Outputs and deliverables
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                        {a.outputs}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {additional.length > 0 && (
        <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-base font-bold text-[#1e3a5f]">
              Additional context
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Free-text answers to the optional follow-up questions.
            </p>
          </div>
          <div className="space-y-5 px-6 py-5">
            {additional.map((entry) => (
              <div key={entry.label}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {entry.label}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {entry.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}

function Chip({
  label,
  tone,
}: {
  label: string;
  tone: "blue" | "slate" | "amber";
}) {
  const styles =
    tone === "blue"
      ? "bg-[#eef3fa] text-[#1e3a5f] ring-[#cdddef]"
      : tone === "amber"
        ? "bg-[#fff4dc] text-[#7a4300] ring-[#f5d597] font-mono"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${styles}`}
    >
      {label}
    </span>
  );
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return null;
  if (start && end) return `${start} → ${end}`;
  if (start) return `from ${start}`;
  return `until ${end}`;
}

function BackIcon() {
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
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

