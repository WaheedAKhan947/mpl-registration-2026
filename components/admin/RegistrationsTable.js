import Avatar from "@/components/admin/Avatar";
import { TrashIcon } from "@/components/admin/icons";
import { DELETE_BUTTON_CLASSES } from "@/components/admin/formStyles";

const COLUMNS = ["Player", "Phone", "Village", "Preferred Team", "Allocated", "Role", "Submitted", ""];

export default function RegistrationsTable({ registrations, onSelect, onDelete }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[820px] border-collapse text-[0.88rem]">
        <thead>
          <tr>
            {COLUMNS.map((heading, index) => (
              <th
                key={heading || `col-${index}`}
                className="whitespace-nowrap border-b border-ink/[0.08] bg-[#f8faf8] px-4 py-3 text-left text-[0.68rem] font-black uppercase tracking-[0.12em] text-muted"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration) => (
            <tr
              key={registration.id}
              onClick={() => onSelect(registration)}
              className="cursor-pointer border-b border-ink/[0.06] transition last:border-0 hover:bg-green/[0.035]"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar src={registration.profilePicture} name={registration.playerName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{registration.playerName}</p>
                    {registration.fatherName ? (
                      <p className="truncate text-xs text-muted">s/o {registration.fatherName}</p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink">{registration.phone}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink">{registration.area}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink">{registration.preferredTeam}</td>
              <td className="whitespace-nowrap px-4 py-3">
                {registration.allocatedTeam ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-2.5 py-1 text-xs font-bold text-green-dark">
                    <span className="h-1.5 w-1.5 rounded-full bg-green" />
                    {registration.allocatedTeam}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-bold text-muted">
                    Unassigned
                  </span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-ink">{registration.playingRole}</td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {registration.createdAt ? new Date(registration.createdAt).toLocaleString() : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(registration.id);
                  }}
                  className={DELETE_BUTTON_CLASSES}
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
