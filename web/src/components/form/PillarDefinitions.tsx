import { PILLAR_META, PILLARS } from "@/lib/constants";

const PILLAR_CLASS: Record<string, string> = {
  Education: "border-t-[#1e5fa8]",
  "Access and Success": "border-t-[#1a6b44]",
  Entrepreneurship: "border-t-[#a05c00]",
};

const PILLAR_TITLE_COLOR: Record<string, string> = {
  Education: "text-[#1e5fa8]",
  "Access and Success": "text-[#1a6b44]",
  Entrepreneurship: "text-[#a05c00]",
};

export function PillarDefinitions() {
  return (
    <section className="border-t-[3px] border-[#1e3a5f] bg-[#f4f7fb] py-7">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="mb-4 border-l-4 border-[#1e3a5f] pl-3 text-[13px] font-bold uppercase tracking-wide text-[#1e3a5f]">
          Nkabom strategic pillars — themes at a glance
        </h2>
        <p className="mb-5 text-sm text-slate-600">
          When you describe each activity below, select the pillar(s) that best describe how
          the work contributes to the collaborative. You may select more than one.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((key) => {
            const m = PILLAR_META[key];
            return (
              <div
                key={key}
                className={`rounded-[10px] border-t-4 bg-white p-4 shadow-sm ${PILLAR_CLASS[key]}`}
              >
                <div className="text-2xl">{m.icon}</div>
                <h3 className={`mt-2 text-[13px] font-extrabold ${PILLAR_TITLE_COLOR[key]}`}>
                  {key}
                </h3>
                <p className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
                  {m.short}
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-slate-700">
                  {key === "Education" &&
                    "We develop the next generation of agri-food leaders through hands-on, experiential learning in climate-smart agriculture, nutrition-sensitive practices, and community-based research. Curriculum is co-created with industry, community, and institutional partners to ensure training is practical and responsive to Ghana's evolving needs."}
                  {key === "Access and Success" &&
                    "We create inclusive, flexible pathways for young people — especially women, refugees, and persons with disabilities — to thrive in the agri-food and nutrition sectors through scholarships, mentorship, and targeted support that remove barriers to participation and enable transition into meaningful employment."}
                  {key === "Entrepreneurship" &&
                    "We foster an enabling environment for youth-led innovation through business incubation, mentorship, policy engagement, and access to networks and markets — helping young people transform ideas into impactful ventures that create jobs, improve livelihoods, and drive sustainable economic growth in communities across Ghana."}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
