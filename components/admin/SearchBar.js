import { SearchIcon, XIcon } from "@/components/admin/icons";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search by name, phone, CNIC, team, village...",
  className = "",
}) {
  return (
    <label className={`relative block w-full ${className}`}>
      <span className="sr-only">Search registrations</span>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-ink/15 bg-white pl-10 pr-10 text-sm font-medium text-ink outline-none transition placeholder:text-muted/60 focus:border-green focus:ring-4 focus:ring-green/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted transition hover:bg-ink/5 hover:text-ink"
        >
          <XIcon className="h-4 w-4" />
        </button>
      ) : null}
    </label>
  );
}
