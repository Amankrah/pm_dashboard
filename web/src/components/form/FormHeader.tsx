import { BrandLockup } from "@/components/brand/Brand";
import { PILLARS } from "@/lib/constants";

export function FormHeader({ periodLabel }: { periodLabel: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <BrandLockup variant="light" height={40} />
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:inline">
            Nkabom Collaborative
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#152c47] via-[#1e3a5f] to-[#1e4d7a] text-white">
        <div className="mx-auto max-w-3xl px-6 py-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Faculty Activity Mapping
          </p>
          <h1 className="mt-2 text-[28px] font-bold leading-tight">
            Tell us what you’re working on this period
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
            This short form captures collaborative activities across the four Nkabom
            themes. Your responses help harmonize engagement across McGill faculties
            and partner institutions in Ghana.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
              McGill University · Academic Lead Office
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
              {periodLabel}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90">
              About 5 to 10 minutes
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
      </div>
    </header>
  );
}
