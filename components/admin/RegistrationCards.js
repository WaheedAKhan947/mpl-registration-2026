export default function RegistrationCards({ registrations, onSelect, onDelete }) {
  return (
    <div className="grid gap-3 md:hidden">
      {registrations.map((registration) => (
        <div
          key={registration.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(registration)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onSelect(registration);
          }}
          className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-ink/10 bg-white p-4 text-left"
        >
          {registration.profilePicture ? (
            <img
              src={registration.profilePicture}
              alt={registration.playerName}
              className="h-12 w-12 shrink-0 rounded-full border border-ink/10 object-cover"
            />
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-paper text-xs text-muted">
              N/A
            </span>
          )}
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-ink">{registration.playerName}</strong>
            <span className="block truncate text-sm text-muted">
              {registration.preferredTeam} • {registration.playingRole}
            </span>
            <span className="block truncate text-sm text-muted">{registration.phone}</span>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(registration.id);
            }}
            className="shrink-0 text-sm font-bold text-brand-red"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
