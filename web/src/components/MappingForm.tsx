"use client";

import { Children, cloneElement, isValidElement, useMemo, useState } from "react";
import {
  ACTIVITY_STATUSES,
  FACULTIES,
  PARTNER_INSTITUTIONS,
  PILLARS,
  PILLAR_META,
} from "@/lib/constants";

type Prefill = {
  email?: string | null;
  fullName?: string | null;
  faculty?: string | null;
};

type ActivityDraft = {
  id: string;
  title: string;
  themes: string[];
  status: string;
  description: string;
  start_date: string;
  end_date: string;
  partner_institution: string;
  partner_other: string;
  contact_name: string;
  contact_email: string;
  outputs: string;
};

function blankActivity(id: string): ActivityDraft {
  return {
    id,
    title: "",
    themes: [],
    status: "",
    description: "",
    start_date: "",
    end_date: "",
    partner_institution: "",
    partner_other: "",
    contact_name: "",
    contact_email: "",
    outputs: "",
  };
}

export function MappingForm({
  token,
  periodLabel,
  prefill,
}: {
  token: string;
  periodLabel: string;
  prefill: Prefill;
}) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [fullName, setFullName] = useState(prefill.fullName ?? "");
  const [email, setEmail] = useState(prefill.email ?? "");
  const [faculty, setFaculty] = useState(prefill.faculty ?? "");
  const [facultyOther, setFacultyOther] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [submissionDate, setSubmissionDate] = useState(today);
  const [activities, setActivities] = useState<ActivityDraft[]>(() => [
    blankActivity("activity-1"),
  ]);
  const [resources, setResources] = useState("");
  const [collaborations, setCollaborations] = useState("");
  const [challenges, setChallenges] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [otherInfo, setOtherInfo] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function updateActivity(id: string, patch: Partial<ActivityDraft>) {
    setActivities((list) =>
      list.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }

  function toggleTheme(id: string, theme: string) {
    setActivities((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        const has = a.themes.includes(theme);
        return {
          ...a,
          themes: has
            ? a.themes.filter((t) => t !== theme)
            : [...a.themes, theme],
        };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const facultyValue = faculty === "Other" ? facultyOther : faculty;

    const payload = {
      token,
      respondent: {
        full_name: fullName,
        email,
        faculty: facultyValue,
        department,
        position,
        submission_date: submissionDate,
      },
      activities: activities.map((a) => ({
        title: a.title,
        themes: a.themes,
        status: a.status,
        description: a.description || undefined,
        start_date: a.start_date || undefined,
        end_date: a.end_date || undefined,
        partner_institution:
          a.partner_institution === "Other"
            ? a.partner_other
            : a.partner_institution,
        contact_name: a.contact_name,
        contact_email: a.contact_email,
        outputs: a.outputs || undefined,
      })),
      additional: {
        resources_needed: resources || undefined,
        collaboration_opportunities: collaborations || undefined,
        challenges_barriers: challenges || undefined,
        outcomes_achievements: outcomes || undefined,
        other_information: otherInfo || undefined,
      },
    };

    const res = await fetch("/api/public/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Submission failed. Please check required fields.");
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7 text-emerald-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7" />
          </svg>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-[#1e3a5f]">Thank you</h2>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {periodLabel}
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
          Your faculty activity mapping has been saved. The Academic Lead office
          will review it on the programme dashboard. A confirmation may be sent
          to your McGill email if enabled.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-8">
      <SectionCard
        number={1}
        accent="blue"
        title="About you"
        subtitle="Tell us about your role at McGill so we can attribute this submission."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Question
            fieldId="respondent-full-name"
            required
            question="What is your full name?"
          >
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Dr. Kwame Mensah"
              className="input"
            />
          </Question>
          <Question
            fieldId="respondent-email"
            required
            question="What is your McGill email address?"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="username@mcgill.ca"
              className="input"
            />
          </Question>
          <Question
            fieldId="respondent-faculty"
            required
            question="Which McGill faculty are you affiliated with?"
          >
            <select
              aria-label="Which McGill faculty are you affiliated with?"
              required
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="input"
            >
              <option value="">Select your faculty…</option>
              {FACULTIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value="Other">Other (specify below)</option>
            </select>
          </Question>
          {faculty === "Other" && (
            <Question
              fieldId="respondent-faculty-other"
              question="Please specify your faculty:"
            >
              <input
                value={facultyOther}
                onChange={(e) => setFacultyOther(e.target.value)}
                placeholder="Enter your faculty name"
                className="input"
              />
            </Question>
          )}
          <Question
            fieldId="respondent-department"
            required
            question="What is your department or unit?"
          >
            <input
              required
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Department of Bioresource Engineering"
              className="input"
            />
          </Question>
          <Question
            fieldId="respondent-position"
            required
            question="What is your position or title?"
          >
            <input
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Associate Professor"
              className="input"
            />
          </Question>
          <Question
            fieldId="respondent-submission-date"
            required
            question="What is the date of this submission?"
          >
            <input
              type="date"
              aria-label="What is the date of this submission?"
              required
              value={submissionDate}
              onChange={(e) => setSubmissionDate(e.target.value)}
              className="input"
            />
          </Question>
        </div>
      </SectionCard>

      <SectionCard
        number={2}
        accent="green"
        title="Your Nkabom activities"
        subtitle="List each collaborative activity separately. You can add as many as you need."
      >
        {activities.map((act, idx) => (
          <div
            key={act.id}
            className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-[#fafcff] last:mb-0"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-[#1e3a5f] px-1.5 text-[11px] font-bold text-white">
                  {idx + 1}
                </span>
                <h3 className="text-sm font-bold text-[#1e3a5f]">
                  Activity {idx + 1}
                  {act.title ? `: ${act.title}` : ""}
                </h3>
              </div>
              {activities.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActivities((list) => list.filter((a) => a.id !== act.id))
                  }
                  className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="space-y-6 px-5 py-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Question
                  fieldId={`activity-title-${act.id}`}
                  required
                  question="What is the title of this activity?"
                  className="sm:col-span-2"
                >
                  <input
                    required
                    value={act.title}
                    onChange={(e) =>
                      updateActivity(act.id, { title: e.target.value })
                    }
                    placeholder="Brief, descriptive title"
                    className="input"
                  />
                </Question>
                <Question
                  fieldId={`activity-pillars-${act.id}`}
                  required
                  question="Which strategic pillar(s) does this activity advance?"
                  hint="Select all that apply. See definitions above."
                  className="sm:col-span-2"
                >
                  <div className="grid gap-2 sm:grid-cols-3">
                    {PILLARS.map((p) => {
                      const m = PILLAR_META[p];
                      const selected = act.themes.includes(p);
                      return (
                        <label
                          key={p}
                          className={`flex cursor-pointer flex-col rounded-lg border-2 p-3 transition-colors ${
                            selected
                              ? "border-[#2563a8] bg-[#eef3fa]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selected}
                            onChange={() => toggleTheme(act.id, p)}
                          />
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white ${m.bgClass}`}
                            aria-hidden="true"
                          >
                            {m.abbr}
                          </span>
                          <span className="mt-2 text-xs font-bold text-[#1e3a5f]">
                            {p === "Access and Success" ? "Access & Success" : p}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {m.short}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Question>
                <Question
                  fieldId={`activity-status-${act.id}`}
                  required
                  question="What is the current status of this activity?"
                >
                  <select
                    aria-label="What is the current status of this activity?"
                    required
                    value={act.status}
                    onChange={(e) =>
                      updateActivity(act.id, { status: e.target.value })
                    }
                    className="input"
                  >
                    <option value="">Select status…</option>
                    {ACTIVITY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Question>
                <Question
                  fieldId={`activity-description-${act.id}`}
                  question="How would you describe this activity and its purpose?"
                  className="sm:col-span-2"
                >
                  <textarea
                    value={act.description}
                    onChange={(e) =>
                      updateActivity(act.id, { description: e.target.value })
                    }
                    rows={3}
                    placeholder="Brief description of the activity, objectives, and approach…"
                    className="input"
                  />
                </Question>
                <Question
                  fieldId={`activity-start-${act.id}`}
                  question="When did (or will) this activity start?"
                >
                  <input
                    type="date"
                    aria-label="When did (or will) this activity start?"
                    value={act.start_date}
                    onChange={(e) =>
                      updateActivity(act.id, { start_date: e.target.value })
                    }
                    className="input"
                  />
                </Question>
                <Question
                  fieldId={`activity-end-${act.id}`}
                  question="When did (or will) this activity end?"
                >
                  <input
                    type="date"
                    aria-label="When did (or will) this activity end?"
                    value={act.end_date}
                    onChange={(e) =>
                      updateActivity(act.id, { end_date: e.target.value })
                    }
                    className="input"
                  />
                </Question>
                <Question
                  fieldId={`activity-outputs-${act.id}`}
                  question="What are the key outputs or deliverables to date?"
                  className="sm:col-span-2"
                >
                  <textarea
                    value={act.outputs}
                    onChange={(e) =>
                      updateActivity(act.id, { outputs: e.target.value })
                    }
                    rows={2}
                    placeholder="e.g. Report, workshop, curriculum module, number of participants…"
                    className="input"
                  />
                </Question>
              </div>

              <SubGroup
                title="Partner institution & main contact"
                hint="Tell us who in Ghana you are collaborating with so we can coordinate across faculties."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <Question
                    fieldId={`activity-partner-${act.id}`}
                    required
                    question="Which Ghanaian partner institution is involved?"
                    className={
                      act.partner_institution === "Other"
                        ? "sm:col-span-2"
                        : "sm:col-span-2"
                    }
                  >
                    <select
                      aria-label="Which Ghanaian partner institution is involved?"
                      required
                      value={act.partner_institution}
                      onChange={(e) =>
                        updateActivity(act.id, {
                          partner_institution: e.target.value,
                        })
                      }
                      className="input"
                    >
                      <option value="">Select partner…</option>
                      {PARTNER_INSTITUTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </Question>
                  {act.partner_institution === "Other" && (
                    <Question
                      fieldId={`activity-partner-other-${act.id}`}
                      required
                      question="Please name the other partner institution:"
                      className="sm:col-span-2"
                    >
                      <input
                        required
                        value={act.partner_other}
                        onChange={(e) =>
                          updateActivity(act.id, {
                            partner_other: e.target.value,
                          })
                        }
                        placeholder="Partner institution name"
                        className="input"
                      />
                    </Question>
                  )}
                  <Question
                    fieldId={`activity-contact-name-${act.id}`}
                    required
                    question="Main contact person at the partner institution"
                  >
                    <input
                      required
                      value={act.contact_name}
                      onChange={(e) =>
                        updateActivity(act.id, { contact_name: e.target.value })
                      }
                      placeholder="Contact full name"
                      className="input"
                    />
                  </Question>
                  <Question
                    fieldId={`activity-contact-email-${act.id}`}
                    required
                    question="Their email address"
                  >
                    <input
                      type="email"
                      required
                      value={act.contact_email}
                      onChange={(e) =>
                        updateActivity(act.id, { contact_email: e.target.value })
                      }
                      placeholder="contact@institution.edu.gh"
                      className="input"
                    />
                  </Question>
                </div>
              </SubGroup>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setActivities((list) => [
              ...list,
              blankActivity(crypto.randomUUID()),
            ])
          }
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#2563a8] bg-white py-3 text-sm font-bold text-[#2563a8] transition-colors hover:bg-[#eef3fa]"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          Add another activity
        </button>
      </SectionCard>

      <SectionCard
        number={3}
        accent="amber"
        title="Additional context"
        subtitle="Optional. Helps strengthen programme coordination."
      >
        <div className="grid gap-5">
          <Question
            fieldId="additional-resources"
            question="What resources or support do you need to advance your activities?"
          >
            <textarea
              value={resources}
              onChange={(e) => setResources(e.target.value)}
              rows={2}
              placeholder="Funding, travel, staffing, institutional support…"
              className="input"
            />
          </Question>
          <Question
            fieldId="additional-collaborations"
            question="Are there opportunities for other McGill faculty or units to join your work?"
          >
            <textarea
              value={collaborations}
              onChange={(e) => setCollaborations(e.target.value)}
              rows={2}
              aria-label="Are there opportunities for other McGill faculty or units to join your work?"
              className="input"
            />
          </Question>
          <Question
            fieldId="additional-challenges"
            question="What challenges or barriers have you encountered (or anticipate)?"
          >
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              rows={2}
              aria-label="What challenges or barriers have you encountered (or anticipate)?"
              className="input"
            />
          </Question>
          <Question
            fieldId="additional-outcomes"
            question="What outcomes or achievements can you report to date?"
          >
            <textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              rows={2}
              placeholder="Publications, events, placements, policy impact…"
              className="input"
            />
          </Question>
          <Question
            fieldId="additional-other"
            question="Is there any other information relevant to your Nkabom engagement?"
          >
            <textarea
              value={otherInfo}
              onChange={(e) => setOtherInfo(e.target.value)}
              rows={3}
              aria-label="Is there any other information relevant to your Nkabom engagement?"
              className="input"
            />
          </Question>
        </div>
      </SectionCard>

      <SectionCard
        number={4}
        accent="purple"
        title="Declaration"
        subtitle="Please confirm before submitting."
      >
        <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-[#fafcff] p-4 text-sm leading-relaxed text-slate-700 hover:border-slate-300">
          <input
            type="checkbox"
            required
            checked={declaration}
            onChange={(e) => setDeclaration(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#1e3a5f]"
          />
          <span>
            I confirm that the information I have provided is accurate to the best of
            my knowledge. I understand that this data will be used by the Nkabom
            Academic Lead Office at McGill University to map and coordinate
            collaborative activities, and that my contact information may be shared
            within the Nkabom network for coordination purposes.
          </span>
        </label>
      </SectionCard>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="space-y-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-[#1a6b44] to-[#15803d] py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit my responses"}
        </button>
        <p className="text-center text-xs text-slate-500">
          Your responses are saved directly to the Nkabom programme database. The
          Academic Lead ({periodLabel}) will be notified.
        </p>
      </div>
    </form>
  );
}

const ACCENTS: Record<
  "blue" | "green" | "amber" | "purple",
  { badge: string; bar: string }
> = {
  blue: { badge: "bg-[#1e3a5f] text-white", bar: "bg-[#2563a8]" },
  green: { badge: "bg-[#1a6b44] text-white", bar: "bg-[#1a6b44]" },
  amber: { badge: "bg-[#a05c00] text-white", bar: "bg-[#a05c00]" },
  purple: { badge: "bg-[#5b21b6] text-white", bar: "bg-[#5b21b6]" },
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
            <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Section {number}
            </p>
            <h2 className="text-base font-bold leading-snug text-[#1e3a5f]">
              {title}
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function SubGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 border-b border-slate-100 pb-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a5f]">
          {title}
        </p>
        {hint && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Question({
  question,
  required,
  fieldId,
  hint,
  children,
  className = "",
}: {
  question: string;
  required?: boolean;
  fieldId: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const child = Children.only(children);
  const isControl =
    isValidElement(child) &&
    typeof child.type === "string" &&
    (child.type === "input" ||
      child.type === "select" ||
      child.type === "textarea");

  const prompt = (
    <>
      {question}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-red-600">
          *
        </span>
      )}
    </>
  );

  if (isControl && isValidElement(child)) {
    return (
      <div className={className}>
        <label
          htmlFor={fieldId}
          className="mb-1 block text-sm font-semibold leading-snug text-[#1e293b]"
        >
          {prompt}
        </label>
        {hint && (
          <p className="mb-2 text-xs leading-relaxed text-slate-500">{hint}</p>
        )}
        {cloneElement(
          child as React.ReactElement<
            React.InputHTMLAttributes<
              HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
            >
          >,
          {
            id: fieldId,
            "aria-required": required ? true : undefined,
          },
        )}
      </div>
    );
  }

  return (
    <fieldset
      className={`${className} m-0 min-w-0 border-0 p-0`}
      aria-labelledby={`${fieldId}-legend`}
    >
      <legend
        id={`${fieldId}-legend`}
        className="mb-1 text-sm font-semibold leading-snug text-[#1e293b]"
      >
        {prompt}
      </legend>
      {hint && (
        <p className="mb-2 text-xs leading-relaxed text-slate-500">{hint}</p>
      )}
      {children}
    </fieldset>
  );
}
