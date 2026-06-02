export const PILLARS = [
  "Education",
  "Access and Success",
  "Entrepreneurship",
] as const;

export type Pillar = (typeof PILLARS)[number];

export const PILLAR_META: Record<
  Pillar,
  { cls: string; icon: string; color: string; short: string; desc: string }
> = {
  Education: {
    cls: "edu",
    icon: "📚",
    color: "#1e5fa8",
    short: "Building Skills and Knowledge",
    desc: "Building agricultural skills and academic knowledge to strengthen capacity across Ghana and Canada.",
  },
  "Access and Success": {
    cls: "acc",
    icon: "🌱",
    color: "#1a6b44",
    short: "Expanding Opportunities",
    desc: "Expanding access to higher education and professional opportunities for underserved communities.",
  },
  Entrepreneurship: {
    cls: "ent",
    icon: "🚀",
    color: "#a05c00",
    short: "Driving Innovation and Impact",
    desc: "Driving innovation and enterprise development in the agri-food value chain.",
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

export function themeClass(t: string) {
  if (t === "Education") return "edu";
  if (t === "Access and Success") return "acc";
  if (t === "Entrepreneurship") return "ent";
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
