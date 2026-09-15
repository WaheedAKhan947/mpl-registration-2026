import Avatar from "@/components/admin/Avatar";
import { TrashIcon } from "@/components/admin/icons";

export default function RegistrationCards({ registrations, onSelect, onDelete }) {
  return (
    <div className="grid gap-3 p-3 md:hidden">
      {registrations.map((registration) => (
        <div
          key={registration.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(registration)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") onSelect(registration);
          }}
          className="flex cursor-pointer items-start gap-3.5 rounded-xl border border-ink/10 bg-white p-4 text-left transition hover:border-green/30 hover:bg-green/[0.03]"
        >
          <Avatar src={registration.profilePicture} name={registration.playerName} />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-ink">{registration.playerName}</strong>
            <span className="block truncate text-sm text-muted">
              {registration.preferredTeam} • {registration.playingRole}
            </span>
            <span className="mt-1.5 block">
              {registration.allocatedTeam ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-2 py-0.5 text-xs font-bold text-green-dark">
                  <span className="h-1.5 w-1.5 rounded-full bg-green" />
                  {registration.allocatedTeam}
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-ink/[0.06] px-2 py-0.5 text-xs font-bold text-muted">
                  Unassigned
                </span>
              )}
            </span>
            <span className="mt-1.5 block truncate text-sm tabular-nums text-muted">{registration.phone}</span>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(registration.id);
            }}
            aria-label={`Delete ${registration.playerName}`}
            title="Delete"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-brand-red transition hover:bg-brand-red/10"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
