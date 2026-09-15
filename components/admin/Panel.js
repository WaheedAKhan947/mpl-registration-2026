export const PANEL_CLASSES =
  "rounded-2xl border border-ink/10 bg-white shadow-[0_1px_2px_rgba(16,32,24,0.04)]";

export default function Panel({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "",
}) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section className={`${PANEL_CLASSES} ${className}`}>
      {hasHeader ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/[0.06] px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="font-sans text-[1.05rem] font-bold tracking-tight text-ink">{title}</h2>
            ) : null}
            {description ? <p className="mt-0.5 text-sm leading-relaxed text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName || "px-5 py-5 sm:px-6"}>{children}</div>
    </section>
  );
}
