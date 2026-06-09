export type CollaboratorRow = {
  name: string;
  faculty: string | null;
  email: string | null;
};

// Per-activity participant disaggregation (Phase 1d). NULL = "not reported",
// 0 = "explicitly zero". The indicator rollup treats NULL as 0 when summing
// but preserves the distinction for per-row display.
export type ParticipantCounts = {
  outreachCount: number | null;
  participantsTotal: number | null;
  participantsYouth: number | null;
  participantsWomen: number | null;
  participantsYiW: number | null;
  participantsYiWWomen: number | null;
  participantsDisability: number | null;
  participantsRefugeeIdp: number | null;
};

export type FlatActivity = {
  id: string;
  title: string;
  status: string;
  themes: string[];
  // Phase 1c descriptors
  activityType: string | null;
  location: string | null;
  localeType: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  // Phase 3 partner classification
  partnerType: string | null;
  partnerInstitution: string | null;
  contactName: string | null;
  contactEmail: string | null;
  outputs: string | null;
  // Phase 1d participant counts
  counts: ParticipantCounts;
  collaborators: CollaboratorRow[];
  submission: {
    id: string;
    fullName: string;
    email: string;
    faculty: string;
    department: string;
    position: string;
    submissionDate: string;
    periodId: string;
    periodLabel: string;
    // Phase 1b quarterly identifiers
    periodReportKey: string | null;
    periodProgramYear: number | null;
    periodQuarter: number | null;
  };
};

export type SubmissionRow = {
  id: string;
  fullName: string;
  email: string;
  faculty: string;
  department: string;
  position: string;
  submissionDate: string;
  submittedAt: string;
  periodId: string;
  periodLabel: string;
  periodReportKey: string | null;
  periodProgramYear: number | null;
  periodQuarter: number | null;
  resourcesNeeded: string | null;
  collaborationOpportunities: string | null;
  challengesBarriers: string | null;
  lessonsLearned: string | null;
  outcomesAchievements: string | null;
  activities: FlatActivity[];
};

export type AnalyticsBundle = {
  submissions: SubmissionRow[];
  activities: FlatActivity[];
  submissionCount: number;
};

export type PeriodOption = { value: string; label: string };

export type SynergyItem = {
  type:
    | "cross-pillar"
    | "multi-faculty-partner"
    | "shared-contact"
    | "cross-faculty-collaboration";
  title: string;
  detail: string;
  activities: string[];
};
