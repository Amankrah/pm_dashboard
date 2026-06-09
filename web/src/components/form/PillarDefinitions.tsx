import { PILLAR_META, PILLARS } from "@/lib/constants";

export function PillarDefinitions() {
  return (
    <section className="border-t-[3px] border-[#1e3a5f] bg-[#f4f7fb] py-7">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="mb-4 border-l-4 border-[#1e3a5f] pl-3 text-sm font-bold uppercase tracking-wide text-[#1e3a5f]">
          Nkabom strategic pillars
        </h2>
        <p className="mb-5 text-[15px] text-slate-600">
          When you describe each activity below, select the pillar or pillars that
          best describe how the work contributes to the collaborative. You may
          select more than one. If an activity does not fit any of the four
          pillars, tag it as Other on the activity itself.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((key) => {
            const m = PILLAR_META[key];
            return (
              <div
                key={key}
                className={`rounded-[10px] border-t-4 bg-white p-5 shadow-sm ${m.borderTopClass}`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-white ${m.bgClass}`}
                  aria-hidden="true"
                >
                  {m.abbr}
                </span>
                <h3
                  className={`mt-2 text-sm font-extrabold ${m.textClass}`}
                >
                  {key}
                </h3>
                <p className="text-[11.5px] font-semibold uppercase tracking-wide text-slate-500">
                  {m.short}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
                  {m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
