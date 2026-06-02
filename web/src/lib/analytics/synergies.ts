import { FAC_SHORT } from "@/lib/constants";
import type { FlatActivity, SynergyItem } from "@/lib/analytics/types";

export function computeSynergies(acts: FlatActivity[]): SynergyItem[] {
  const items: SynergyItem[] = [];

  acts
    .filter((a) => a.themes.length > 1)
    .forEach((a) => {
      items.push({
        type: "cross-pillar",
        title: a.title,
        detail: `Spans ${a.themes.join(" + ")} — ${FAC_SHORT[a.submission.faculty] || a.submission.faculty}, ${a.submission.fullName}`,
        activities: [a.id],
      });
    });

  const byPartner = new Map<string, FlatActivity[]>();
  acts.forEach((a) => {
    if (!a.partnerInstitution) return;
    const list = byPartner.get(a.partnerInstitution) ?? [];
    list.push(a);
    byPartner.set(a.partnerInstitution, list);
  });

  byPartner.forEach((list, partner) => {
    const faculties = new Set(list.map((a) => a.submission.faculty));
    if (faculties.size > 1) {
      items.push({
        type: "multi-faculty-partner",
        title: partner,
        detail: `${list.length} activities across ${faculties.size} faculties: ${[...faculties].map((f) => FAC_SHORT[f] || f).join(", ")}`,
        activities: list.map((a) => a.id),
      });
    }
    const pillars = new Set(list.flatMap((a) => a.themes));
    if (pillars.size > 1 && faculties.size === 1) {
      items.push({
        type: "multi-faculty-partner",
        title: `${partner} (multi-pillar)`,
        detail: `Single faculty engagement spanning ${[...pillars].join(", ")}`,
        activities: list.map((a) => a.id),
      });
    }
  });

  const byContact = new Map<string, FlatActivity[]>();
  acts.forEach((a) => {
    const key = (a.contactEmail || "").trim().toLowerCase();
    if (!key) return;
    const list = byContact.get(key) ?? [];
    list.push(a);
    byContact.set(key, list);
  });

  byContact.forEach((list, email) => {
    if (list.length > 1) {
      const names = [...new Set(list.map((a) => a.contactName).filter(Boolean))];
      items.push({
        type: "shared-contact",
        title: names[0] || email,
        detail: `${list.length} linked activities · ${email}`,
        activities: list.map((a) => a.id),
      });
    }
  });

  acts.forEach((a) => {
    a.collaborators.forEach((c) => {
      if (!c.name || !c.faculty) return;
      if (c.faculty !== a.submission.faculty) {
        items.push({
          type: "cross-faculty-collaboration",
          title: a.title,
          detail: `${a.submission.fullName} (${FAC_SHORT[a.submission.faculty] || a.submission.faculty}) ↔ ${c.name} (${FAC_SHORT[c.faculty] || c.faculty})`,
          activities: [a.id],
        });
      }
    });
  });

  return items;
}
