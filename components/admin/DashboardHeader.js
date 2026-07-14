import Button from "@/components/ui/Button";

export default function DashboardHeader({ onRefresh, onLogout }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <h2 className="text-2xl font-bold text-ink">MPL Admin Dashboard</h2>
      <div className="flex flex-wrap items-center gap-3.5">
        <Button as="a" href="/api/admin/export">
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
