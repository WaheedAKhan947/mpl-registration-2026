const STATS = [
  { value: "6", label: "Competitive teams" },
  { value: "1", label: "Professional local platform" },
  { value: "100%", label: "Focus on fair play" },
];

export default function StatsBar() {
  return (
    <div className="grid grid-cols-1 gap-px bg-ink/10 sm:grid-cols-3" aria-label="League highlights">
      {STATS.map((stat) => (
        <div key={stat.label} className="min-h-[128px] bg-white p-6">
          <strong className="block text-[clamp(2rem,4vw,3.2rem)] leading-none text-green">{stat.value}</strong>
          <span className="font-extrabold text-muted">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
