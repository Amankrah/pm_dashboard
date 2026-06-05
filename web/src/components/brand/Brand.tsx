type Variant = "light" | "dark";

const SRC = {
  mcgill: { light: "/brand/mcgill.svg", dark: "/brand/mcgill-white.svg" },
  mcf: {
    light: "/brand/mastercard-foundation.svg",
    dark: "/brand/mastercard-foundation-white.svg",
  },
};

export function McGillMark({
  variant = "light",
  height = 40,
}: {
  variant?: Variant;
  height?: number;
}) {
  return (
    <img
      src={SRC.mcgill[variant]}
      alt="McGill University"
      style={{ height, width: "auto" }}
      className="block select-none"
      draggable={false}
    />
  );
}

export function MastercardFoundationMark({
  variant = "light",
  height = 40,
}: {
  variant?: Variant;
  height?: number;
}) {
  return (
    <img
      src={SRC.mcf[variant]}
      alt="Mastercard Foundation"
      style={{ height, width: "auto" }}
      className="block select-none"
      draggable={false}
    />
  );
}

export function BrandLockup({
  variant = "light",
  height = 40,
  className = "",
}: {
  variant?: Variant;
  height?: number;
  className?: string;
}) {
  const divider =
    variant === "dark" ? "bg-white/25" : "bg-slate-300";
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <McGillMark variant={variant} height={height} />
      <span
        aria-hidden="true"
        className={`block w-px ${divider}`}
        style={{ height: height * 0.85 }}
      />
      <MastercardFoundationMark variant={variant} height={height} />
    </div>
  );
}
