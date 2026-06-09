import { themeClass } from "@/lib/constants";

export function ThemeTag({ theme }: { theme: string }) {
  const cls = themeClass(theme);
  const colors: Record<string, string> = {
    edu: "bg-[#1e5fa8]",
    acc: "bg-[#1a6b44]",
    ent: "bg-[#a05c00]",
    net: "bg-[#5b21b6]",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${colors[cls] ?? "bg-slate-600"}`}
    >
      {theme}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: "text-[#15803d]",
    ongoing: "text-[#a05c00]",
    planned: "text-[#1e3a5f]",
  };
  const dots: Record<string, string> = {
    completed: "bg-[#15803d]",
    ongoing: "bg-[#a05c00]",
    planned: "bg-[#1e3a5f]",
  };
  const key = status.toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${colors[key] ?? ""}`}>
      <span className={`h-2 w-2 rounded-full ${dots[key] ?? "bg-slate-400"}`} />
      {status}
    </span>
  );
}
