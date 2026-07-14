const COLUMNS = ["Photo", "Player Name", "Phone", "Village", "Team", "Role", "Submitted", ""];

export default function RegistrationsTable({ registrations, onSelect, onDelete }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-ink/10 bg-white md:block">
      <table className="w-full min-w-[720px] border-collapse text-[0.88rem]">
        <thead>
          <tr>
            {COLUMNS.map((heading) => (
              <th
                key={heading}
                className="sticky top-0 whitespace-nowrap border-b border-ink/10 bg-paper px-3.5 py-2.5 text-left font-bold"
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
              className="cursor-pointer border-b border-ink/10 last:border-0 hover:bg-paper/70"
            >
              <td className="whitespace-nowrap px-3.5 py-2.5">
                {registration.profilePicture ? (
                  <img
                    src={registration.profilePicture}
                    alt={registration.playerName}
                    className="h-10 w-10 rounded-md border border-ink/10 object-cover"
                  />
                ) : (
                  "—"
                )}
              </td>
              <td className="whitespace-nowrap px-3.5 py-2.5 font-semibold text-ink">{registration.playerName}</td>
              <td className="whitespace-nowrap px-3.5 py-2.5">{registration.phone}</td>
              <td className="whitespace-nowrap px-3.5 py-2.5">{registration.area}</td>
              <td className="whitespace-nowrap px-3.5 py-2.5">{registration.preferredTeam}</td>
              <td className="whitespace-nowrap px-3.5 py-2.5">{registration.playingRole}</td>
              <td className="whitespace-nowrap px-3.5 py-2.5">
                {registration.createdAt ? new Date(registration.createdAt).toLocaleString() : "—"}
              </td>
              <td className="whitespace-nowrap px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(registration.id);
                  }}
                  className="font-bold text-brand-red"
                >
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
