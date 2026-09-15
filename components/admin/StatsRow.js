import { PANEL_CLASSES } from "@/components/admin/Panel";

function formatValue(value) {
  return typeof value === "number" ? value.toLocaleString() : value;
}

export function StatTile({ label, value, caption, accent = false }) {
  return (
    <div className={`${PANEL_CLASSES} px-5 py-4`}>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-muted">{label}</p>
      <p
        className={`mt-2 font-sans text-[1.8rem] font-bold leading-none tracking-tight tabular-nums ${
          accent ? "text-green-dark" : "text-ink"
        }`}
      >
        {formatValue(value)}
      </p>
      {caption ? <p className="mt-2 text-xs text-muted">{caption}</p> : null}
    </div>
  );
}

export default function StatsRow({ items }) {
  const visible = items.filter(Boolean);
  if (!visible.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {visible.map((item) => (
        <StatTile key={item.label} {...item} />
      ))}
    </div>
  );
}
