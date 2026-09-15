const SIZES = {
  sm: "h-9 w-9 text-[0.7rem]",
  md: "h-11 w-11 text-xs",
  lg: "h-28 w-28 text-2xl",
};

export function initialsOf(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const letters = parts.map((part) => part[0]).join("");
  return letters ? letters.toUpperCase() : "?";
}

export default function Avatar({ src, name, size = "md", className = "" }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ""}
        className={`${SIZES[size]} shrink-0 rounded-full border border-ink/10 bg-white object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} grid shrink-0 place-items-center rounded-full bg-green/10 font-black text-green-dark ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
