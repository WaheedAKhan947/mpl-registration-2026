"use client";

import Image from "next/image";
import { ChevronLeftIcon, LogoutIcon, XIcon } from "@/components/admin/icons";

export default function Sidebar({
  groups,
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  onLogout,
}) {
  const hideWhenCollapsed = collapsed ? "lg:hidden" : "";

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={`fixed inset-0 z-40 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-ink/10 bg-white transition-[transform,width] duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:max-w-none lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } ${collapsed ? "lg:w-[76px]" : "lg:w-[264px]"}`}
      >
        <div
          className={`flex h-[68px] shrink-0 items-center gap-3 border-b border-ink/[0.06] px-4 ${
            collapsed ? "lg:justify-center lg:px-0" : ""
          }`}
        >
          <Image
            src="/logo.png"
            alt="MPL logo"
            width={40}
            height={40}
            className="shrink-0 drop-shadow-[0_6px_14px_rgba(244,182,61,0.35)]"
          />
          <div className={`min-w-0 ${hideWhenCollapsed}`}>
            <p className="truncate font-sans text-[1.02rem] font-black leading-tight text-navy-dark">
              MPL <span className="text-green">Admin</span>
            </p>
            <p className="truncate text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted">
              Control panel
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-ink/5 hover:text-ink lg:hidden"
          >
            <XIcon />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-[82px] z-10 hidden h-6 w-6 place-items-center rounded-full border-2 border-white bg-green text-white shadow-md transition hover:bg-green-dark lg:grid"
        >
          <ChevronLeftIcon className={`h-3.5 w-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2">
          {groups.map((group, groupIndex) => (
            <div key={group.label} className="mb-1.5">
              <p
                className={`px-3 pb-1.5 pt-3.5 text-[0.64rem] font-black uppercase tracking-[0.16em] text-muted/80 ${hideWhenCollapsed}`}
              >
                {group.label}
              </p>
              {groupIndex > 0 ? (
                <div className={`mx-2 my-2.5 hidden border-t border-ink/[0.08] ${collapsed ? "lg:block" : ""}`} />
              ) : (
                <div className={`hidden h-2.5 ${collapsed ? "lg:block" : ""}`} />
              )}
              <ul className="grid gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === active;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onNavigate(item.id)}
                        title={collapsed ? item.label : undefined}
                        aria-current={isActive ? "page" : undefined}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.92rem] font-semibold transition ${
                          isActive
                            ? "bg-green/10 text-green-dark ring-1 ring-inset ring-green/15"
                            : "text-[#3f4c45] hover:bg-ink/[0.04] hover:text-ink"
                        } ${collapsed ? "lg:justify-center lg:px-0" : ""}`}
                      >
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 transition ${
                            isActive ? "text-green" : "text-muted group-hover:text-ink"
                          }`}
                        />
                        <span className={`truncate ${hideWhenCollapsed}`}>{item.label}</span>
                        {item.badge !== undefined && item.badge !== null ? (
                          <span
                            className={`ml-auto rounded-full px-2 py-0.5 text-[0.7rem] font-bold tabular-nums ${
                              isActive ? "bg-green/15 text-green-dark" : "bg-ink/[0.06] text-muted"
                            } ${hideWhenCollapsed}`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-ink/[0.06] p-3">
          <div
            className={`flex items-center gap-3 rounded-xl px-2 py-1.5 ${
              collapsed ? "lg:flex-col lg:gap-2 lg:px-0" : ""
            }`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-green/10 text-[0.78rem] font-black text-green-dark">
              AD
            </span>
            <div className={`min-w-0 flex-1 ${hideWhenCollapsed}`}>
              <p className="truncate text-sm font-bold text-ink">Admin</p>
              <p className="truncate text-xs text-muted">Signed in</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-brand-red/10 hover:text-brand-red"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
