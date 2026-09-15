export default function RegistrationClosedNotice({ orgName }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-6 text-center shadow-[0_14px_42px_rgba(6,66,39,0.08)]">
      <h3 className="mb-2 text-xl font-black uppercase text-green-dark">Registration Closed</h3>
      <p className="font-semibold text-muted">
        {orgName} player registration is currently closed. Please check back later or follow our social pages for
        updates.
      </p>
    </div>
  );
}
