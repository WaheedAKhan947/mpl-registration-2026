import { DownloadIcon, MenuIcon, RefreshIcon } from "@/components/admin/icons";

export default function DashboardHeader({
  title,
  subtitle,
  onOpenMenu,
  onRefresh,
  refreshing = false,
  exportHref,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-ink/10 bg-white text-ink transition hover:bg-ink/[0.04] lg:hidden"
        >
          <MenuIcon />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-sans text-xl font-bold tracking-tight text-ink sm:text-[1.45rem]">{title}</h1>
          {subtitle ? <p className="hidden truncate text-sm text-muted sm:block">{subtitle}</p> : null}
        </div>

        {onRefresh || exportHref ? (
          <div className="flex shrink-0 items-center gap-2">
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-bold text-ink transition hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{refreshing ? "Refreshing" : "Refresh"}</span>
              </button>
            ) : null}
            {exportHref ? (
              <a
                href={exportHref}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-green px-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,107,58,0.25)] transition hover:bg-green-dark"
              >
                <DownloadIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Export Excel</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
