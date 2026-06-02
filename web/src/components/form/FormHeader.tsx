import { PILLARS } from "@/lib/constants";

export function FormHeader({ periodLabel }: { periodLabel: string }) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-br from-[#152c47] via-[#1e3a5f] to-[#1e4d7a] text-white shadow-md">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <div className="flex items-start gap-3">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#e8a020] text-2xl">
              🤝
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/75">
                Mastercard Foundation · McGill University
              </p>
              <p className="text-lg font-bold">Nkabom Collaborative</p>
            </div>
          </div>
          <h1 className="mt-5 text-[26px] font-bold leading-tight">
            Faculty Activity Mapping Form
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
            This form captures collaborative activities across the four Nkabom themes.
            Your responses help harmonize engagement across McGill faculties and partner
            institutions in Ghana.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs">
              McGill University — Academic Lead Office
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs">
              {periodLabel}
            </span>
          </div>
        </div>
        <div className="border-t border-white/10 bg-[#152c47]">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-6 py-2.5">
            <span className="text-[11px] text-white/55">Themes:</span>
            {PILLARS.map((p) => (
              <span
                key={p}
                className={`rounded-full px-3 py-0.5 text-[11px] font-semibold text-white ${
                  p === "Education"
                    ? "bg-[#1e5fa8]"
                    : p === "Access and Success"
                      ? "bg-[#1a6b44]"
                      : "bg-[#a05c00]"
                }`}
              >
                {p === "Access and Success" ? "Access & Success" : p}
              </span>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
