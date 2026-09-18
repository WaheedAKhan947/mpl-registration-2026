import Avatar from "@/components/admin/Avatar";
import { TrashIcon } from "@/components/admin/icons";
import { DELETE_BUTTON_CLASSES } from "@/components/admin/formStyles";

const COLUMNS = [
  "Reg. ID",
  "Player",
  "Phone",
  "Village",
  "Position",
  "Preferred Foot",
  "Status",
  "Submitted",
  "",
];

export default function MFCRegistrationsTable({ registrations, onSelect, onDelete, onVerify }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[920px] border-collapse text-[0.88rem]">
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
              <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-muted">
                {registration.registrationId || "—"}
              </td>
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
              <td className="whitespace-nowrap px-4 py-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onVerify(registration.id, !registration.verified);
                  }}
                  title={registration.verified ? "Click to mark unverified" : "Click to mark verified"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition ${
                    registration.verified
                      ? "bg-green/10 text-green-dark hover:bg-green/15"
                      : "bg-gold/15 text-navy-dark hover:bg-gold/25"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${registration.verified ? "bg-green" : "bg-gold"}`} />
                  {registration.verified ? "Verified" : "Unverified"}
                </button>
              </td>
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
