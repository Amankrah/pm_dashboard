export type CollaboratorRow = {
  name: string;
  faculty: string | null;
  email: string | null;
};

export type FlatActivity = {
  id: string;
  title: string;
  status: string;
  themes: string[];
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  partnerInstitution: string | null;
  contactName: string | null;
  contactEmail: string | null;
  outputs: string | null;
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
  resourcesNeeded: string | null;
  collaborationOpportunities: string | null;
  challengesBarriers: string | null;
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
