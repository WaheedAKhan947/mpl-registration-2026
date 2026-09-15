import Avatar from "@/components/admin/Avatar";
import { TrashIcon } from "@/components/admin/icons";
import { DELETE_BUTTON_CLASSES } from "@/components/admin/formStyles";

const COLUMNS = ["Player", "Phone", "Village", "Position", "Preferred Foot", "Submitted", ""];

export default function MFCRegistrationsTable({ registrations, onSelect, onDelete }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[760px] border-collapse text-[0.88rem]">
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
                  <Avatar src={registration.photo} name={registration.fullName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{registration.fullName}</p>
                    {registration.fatherName ? (
                      <p className="truncate text-xs text-muted">s/o {registration.fatherName}</p>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink">{registration.phone}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink">{registration.village}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="inline-flex rounded-full bg-navy/[0.07] px-2.5 py-1 text-xs font-bold text-navy">
                  {registration.position}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-ink">{registration.preferredFoot}</td>
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
