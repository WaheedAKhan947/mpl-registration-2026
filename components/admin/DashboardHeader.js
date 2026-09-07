import Button from "@/components/ui/Button";

export default function DashboardHeader({ onRefresh, onLogout, title = "MPL Admin Dashboard", exportHref = "/api/admin/export" }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-2xl font-bold text-ink">{title}</h2>
      <div className="flex flex-wrap items-center gap-3.5">
        <Button as="a" href={exportHref}>
          Export Excel
        </Button>
        <Button type="button" variant="secondary" onClick={onRefresh}>
          Refresh
        </Button>
        <Button type="button" variant="secondary" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
}
