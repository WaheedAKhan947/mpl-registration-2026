function StatBox({ value, label }) {
  return (
    <div className="min-w-[140px] rounded-xl border border-ink/10 bg-white px-[22px] py-4">
      <strong className="block text-[1.6rem] text-green-dark">{value}</strong>
      <span className="text-[0.85rem] text-muted">{label}</span>
    </div>
  );
}

export default function StatsRow({ total, showing, searching }) {
  return (
    <div className="mb-5 flex flex-wrap gap-4">
      <StatBox value={total} label="Total Registrations" />
      {searching ? <StatBox value={showing} label="Matching Search" /> : null}
    </div>
  );
}
