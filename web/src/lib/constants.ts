export const PILLARS = [
  "Education",
  "Access",
  "Entrepreneurship",
  "Networking",
] as const;

export type Pillar = (typeof PILLARS)[number];

// "Other" is a legal tag value on an activity but is NOT a pillar. It never
// appears in pillar rollups, targets, or charts. The form exposes it as a
// separate checkbox alongside the four pillars.
export const OTHER_TAG = "Other" as const;
export type ActivityTag = Pillar | typeof OTHER_TAG;

// Pillar vocabulary used when tagging structured Challenges (Phase 2).
// Mirrors the Partner Narrative Report's per-pillar challenge tables; the
// docx groups any non-pillar challenges under an "Other" header, so we keep
// Other here as a valid choice.
export const CHALLENGE_PILLARS = [...PILLARS, OTHER_TAG] as const;
export type ChallengePillar = (typeof CHALLENGE_PILLARS)[number];

export const PILLAR_META: Record<
  Pillar,
  {
    cls: string;
    abbr: string;
    color: string;
    bgClass: string;
    borderTopClass: string;
    textClass: string;
    short: string;
    desc: string;
  }
> = {
  Education: {
    cls: "edu",
    abbr: "Ed",
    color: "#1e5fa8",
    bgClass: "bg-[#1e5fa8]",
    borderTopClass: "border-t-[#1e5fa8]",
    textClass: "text-[#1e5fa8]",
    short: "Building Skills and Knowledge",
    desc: "Building agricultural skills and academic knowledge to strengthen capacity across Ghana and Canada.",
  },
  Access: {
    cls: "acc",
    abbr: "Ac",
    color: "#1a6b44",
    bgClass: "bg-[#1a6b44]",
    borderTopClass: "border-t-[#1a6b44]",
    textClass: "text-[#1a6b44]",
    short: "Expanding Opportunities",
    desc: "Expanding access to higher education and professional opportunities for underserved communities.",
  },
  Entrepreneurship: {
    cls: "ent",
    abbr: "En",
    color: "#a05c00",
    bgClass: "bg-[#a05c00]",
    borderTopClass: "border-t-[#a05c00]",
    textClass: "text-[#a05c00]",
    short: "Driving Innovation and Impact",
    desc: "Driving innovation and enterprise development in the agri-food value chain.",
  },
  Networking: {
    cls: "net",
    abbr: "Nw",
    color: "#5b21b6",
    bgClass: "bg-[#5b21b6]",
    borderTopClass: "border-t-[#5b21b6]",
    textClass: "text-[#5b21b6]",
    short: "Sustained Opportunity",
    desc: "Building enduring connections between students, employers, alumni, and partner institutions across Ghana and Canada to translate education and access into sustained opportunity.",
  },
};

export const FACULTIES = [
  "Agricultural and Environmental Sciences (AES)",
  "School of Continuing Education",
  "School of Population and Global Health (SPGH)",
  "Sustainability Growth Initiative (SGI)",
] as const;

export const FAC_SHORT: Record<string, string> = {
  "Agricultural and Environmental Sciences (AES)": "AES",
  "School of Continuing Education": "SCS",
  "School of Population and Global Health (SPGH)": "SPGH",
  "Sustainability Growth Initiative (SGI)": "SGI",
};

export const FAC_KEYS = ["AES", "SPGH", "SCS", "SGI"] as const;

export const FAC_MATCH: Record<string, string> = {
  AES: "Agricultural and Environmental Sciences (AES)",
  SPGH: "School of Population and Global Health (SPGH)",
  SCS: "School of Continuing Education",
  SGI: "Sustainability Growth Initiative (SGI)",
};

export const FAC_FULL_NAMES: Record<string, string> = {
  AES: "Faculty of Agricultural and Environmental Sciences",
  SPGH: "School of Population and Global Health",
  SCS: "School of Continuing Education",
  SGI: "Sustainability Growth Initiative",
};

export const PARTNER_INSTITUTIONS = [
  "Association of Ghana Industries",
  "Ashesi University",
  "Koforidua Technical University",
  "Kwame Nkrumah University of Science and Technology (KNUST)",
  "University of Environment and Sustainable Development",
  "University of Ghana",
  "University of Health and Allied Sciences (UHAS)",
  "Other",
] as const;

export const ACTIVITY_STATUSES = ["Completed", "Ongoing", "Planned"] as const;

// Activity type taxonomy from the Partner Narrative Report template's
// "Description of activities" instructions. Used in MappingForm Section 2
// and surfaced on the submission detail page. "Other" is a tolerated value
// for activities that don't fit any of the canonical types.
export const ACTIVITY_TYPES = [
  "Training",
  "Workshop",
  "Meeting",
  "Event",
  "Course",
  "Mentorship",
  "Outreach",
  "Research",
  "Other",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// Where the activity took place. Maps directly to the Outreach
// disaggregation rows in the Overall Indicator Performance table
// (Rural / Urban / Peri-Urban).
export const LOCALE_TYPES = ["Rural", "Urban", "Peri-Urban", "Mixed"] as const;

export type LocaleType = (typeof LOCALE_TYPES)[number];

// Per-activity participant counts feeding the Partner Narrative Report's
// Overall Indicator Performance table. The keys match the JSON payload
// field names that go from the form to the API; the corresponding Prisma
// column names are the camelCased equivalents handled in submissions.ts.
//
// All counts are optional. NULL ("not reported") and 0 ("explicitly zero")
// are stored distinctly so we can flag activities the respondent simply
// skipped.
export const PARTICIPANT_FIELDS = [
  {
    key: "outreach_count",
    column: "outreachCount",
    label: "Outreach",
    hint: "People reached or made aware of this activity, including those who did not participate directly.",
  },
  {
    key: "participants_total",
    column: "participantsTotal",
    label: "Total participants",
    hint: "People who actually engaged with or attended this activity.",
  },
  {
    key: "participants_youth",
    column: "participantsYouth",
    label: "Youth (15 to 35)",
    hint: "Subset of total participants in the 15 to 35 age range.",
  },
  {
    key: "participants_women",
    column: "participantsWomen",
    label: "Women",
    hint: "Subset of total participants who are women.",
  },
  {
    key: "participants_yiw",
    column: "participantsYiW",
    label: "Youth in Work",
    hint: "Youth participants who moved into actual employment or income-generating opportunities, per the Mastercard Foundation Shared Measures definition.",
  },
  {
    key: "participants_yiw_women",
    column: "participantsYiWWomen",
    label: "Youth in Work (women)",
    hint: "Subset of Youth in Work who are women.",
  },
  {
    key: "participants_disability",
    column: "participantsDisability",
    label: "With disabilities",
    hint: "Subset of total participants who are persons with disabilities.",
  },
  {
    key: "participants_refugee_idp",
    column: "participantsRefugeeIdp",
    label: "Refugees or IDPs",
    hint: "Subset of total participants who are refugees or internally displaced persons.",
  },
] as const;

export type ParticipantFieldKey = (typeof PARTICIPANT_FIELDS)[number]["key"];
export type ParticipantFieldColumn =
  (typeof PARTICIPANT_FIELDS)[number]["column"];

export function themeClass(t: string) {
  if (t === "Education") return "edu";
  if (t === "Access") return "acc";
  if (t === "Entrepreneurship") return "ent";
  if (t === "Networking") return "net";
  return "";
}

export function statusClass(s: string) {
  return s.toLowerCase();
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
