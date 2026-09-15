import Avatar from "@/components/admin/Avatar";
import { TrashIcon } from "@/components/admin/icons";

export default function MFCRegistrationCards({ registrations, onSelect, onDelete }) {
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
          <Avatar src={registration.photo} name={registration.fullName} />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-ink">{registration.fullName}</strong>
            <span className="block truncate text-sm text-muted">
              {registration.position} • {registration.preferredFoot} foot
            </span>
            <span className="block truncate text-sm text-muted">{registration.village}</span>
            <span className="mt-1 block truncate text-sm tabular-nums text-muted">{registration.phone}</span>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(registration.id);
            }}
            aria-label={`Delete ${registration.fullName}`}
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
