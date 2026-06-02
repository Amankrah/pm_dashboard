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

function newActivity(): ActivityDraft {
  return {
    id: crypto.randomUUID(),
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
  const [activities, setActivities] = useState<ActivityDraft[]>([newActivity()]);
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
      <div className="rounded-xl bg-white p-10 text-center shadow-md">
        <p className="text-4xl">✅</p>
        <h2 className="mt-4 text-xl font-bold text-[#1e3a5f]">Thank you</h2>
        <p className="mt-2 text-sm text-slate-600">{periodLabel}</p>
        <p className="mt-4 text-sm text-slate-700">
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
        icon="👤"
        iconBg="bg-blue-100"
        title="Section 1 — About you"
        subtitle="Please answer the following about your role at McGill"
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
              <option value="">— Select your faculty —</option>
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
        icon="📊"
        iconBg="bg-green-100"
        title="Section 2 — Your Nkabom activities"
        subtitle="List each collaborative activity separately (you may add more than one)"
      >
        {activities.map((act, idx) => (
          <div
            key={act.id}
            className="mb-5 rounded-lg border border-slate-200 bg-[#fafcff] p-5 last:mb-0"
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-[#1e3a5f]">Activity {idx + 1}</h3>
              {activities.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setActivities((list) => list.filter((a) => a.id !== act.id))
                  }
                  className="text-xs font-semibold text-red-600"
                >
                  Remove this activity
                </button>
              )}
            </div>
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
                  onChange={(e) => updateActivity(act.id, { title: e.target.value })}
                  placeholder="Brief, descriptive title"
                  className="input"
                />
              </Question>
              <Question
                fieldId={`activity-pillars-${act.id}`}
                required
                question="Which strategic pillar(s) does this activity advance? (Select all that apply — see definitions above.)"
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
                        <span className="text-lg">{m.icon}</span>
                        <span className="mt-1 text-xs font-bold text-[#1e3a5f]">
                          {p === "Access and Success" ? "Access & Success" : p}
                        </span>
                        <span className="text-[10px] text-slate-500">{m.short}</span>
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
                  onChange={(e) => updateActivity(act.id, { status: e.target.value })}
                  className="input"
                >
                  <option value="">— Select status —</option>
                  {ACTIVITY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Question>
              <Question
                fieldId={`activity-partner-${act.id}`}
                required
                question="Which Ghanaian partner institution is involved?"
              >
                <select
                  aria-label="Which Ghanaian partner institution is involved?"
                  required
                  value={act.partner_institution}
                  onChange={(e) =>
                    updateActivity(act.id, { partner_institution: e.target.value })
                  }
                  className="input"
                >
                  <option value="">— Select partner —</option>
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
                      updateActivity(act.id, { partner_other: e.target.value })
                    }
                    placeholder="Partner institution name"
                    className="input"
                  />
                </Question>
              )}
              <Question
                fieldId={`activity-contact-name-${act.id}`}
                required
                question="Who is the main contact person at the partner institution?"
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
                question="What is their email address?"
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
                  onChange={(e) => updateActivity(act.id, { outputs: e.target.value })}
                  rows={2}
                  placeholder="e.g. Report, workshop, curriculum module, number of participants…"
                  className="input"
                />
              </Question>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setActivities((list) => [...list, newActivity()])}
          className="mt-2 w-full rounded-lg border-2 border-dashed border-[#2563a8] bg-white py-3 text-sm font-bold text-[#2563a8] hover:bg-[#eef3fa]"
        >
          ＋ Add another activity
        </button>
      </SectionCard>

      <SectionCard
        icon="💡"
        iconBg="bg-amber-100"
        title="Section 3 — Additional context"
        subtitle="Optional — helps strengthen programme coordination"
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
        icon="✅"
        iconBg="bg-purple-100"
        title="Section 4 — Declaration"
        subtitle="Please confirm before submitting"
      >
        <label className="flex gap-3 text-sm leading-relaxed text-slate-700">
          <input
            type="checkbox"
            required
            checked={declaration}
            onChange={(e) => setDeclaration(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
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
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gradient-to-r from-[#1a6b44] to-[#15803d] py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-60"
      >
        {loading ? "Submitting…" : "Submit my responses"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Your responses are saved directly to the Nkabom programme database. The
        Academic Lead ({periodLabel}) will be notified.
      </p>
    </form>
  );
}

function SectionCard({
  icon,
  iconBg,
  title,
  subtitle,
  children,
}: {
  icon: string;
  iconBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-[#1e3a5f]">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Question({
  question,
  required,
  fieldId,
  children,
  className = "",
}: {
  question: string;
  required?: boolean;
  fieldId: string;
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
      {required && <span className="ml-0.5 text-red-600">*</span>}
    </>
  );

  if (isControl && isValidElement(child)) {
    return (
      <div className={className}>
        <label
          htmlFor={fieldId}
          className="mb-2 block text-sm font-semibold leading-snug text-[#1e293b]"
        >
          {prompt}
        </label>
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
        className="mb-2 text-sm font-semibold leading-snug text-[#1e293b]"
      >
        {prompt}
      </legend>
      {children}
    </fieldset>
  );
}
