export default function SearchBar({ value, onChange }) {
  return (
    <label className="mb-5 grid max-w-md gap-1.5 text-sm font-bold text-green-dark">
      <span>Search Registrations</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name, phone, CNIC, team, village..."
        className="w-full rounded-lg border border-ink/10 bg-white px-[13px] py-3 text-ink outline-none transition focus:border-green focus:shadow-[0_0_0_4px_rgba(11,107,58,0.12)]"
      />
    </label>
  );
}
