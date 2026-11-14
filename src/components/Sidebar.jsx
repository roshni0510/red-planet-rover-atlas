import { Link } from "@tanstack/react-router";
import { Compass, FileText, FlaskConical, LayoutDashboard, Map } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/explore", label: "Explore", icon: Map },
  { to: "/navigation", label: "Navigation", icon: Compass },
  { to: "/science", label: "Science", icon: FlaskConical },
  { to: "/reports", label: "Reports", icon: FileText },
];

export default function Sidebar() {
  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 z-10 hidden h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/75 text-sidebar-foreground backdrop-blur-md md:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="grid size-7 place-items-center rounded-sm bg-primary font-mono text-xs font-semibold text-primary-foreground">
            MW
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide text-foreground">MarsWalk</p>
            <p className="label-caps !text-[0.625rem]">Expedition console</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Main">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2.5 rounded-sm border-l-2 border-transparent px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "!border-primary bg-sidebar-accent !text-sidebar-accent-foreground font-medium" }}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <p className="border-t border-sidebar-border px-4 py-3 text-[0.6875rem] text-muted-foreground">
          All values shown come from the MarsWalk backend.
        </p>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-sidebar-border bg-sidebar/85 backdrop-blur-md md:hidden"
        aria-label="Main"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-0.5 py-2 text-[0.625rem] text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
