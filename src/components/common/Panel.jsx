import { cn } from "@/lib/utils";

/** Mission-control panel with a caps label header. */
export default function Panel({ title, icon: Icon, actions, className, bodyClassName, children }) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-md border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />}
            <h2 className="label-caps truncate">{title}</h2>
          </div>
          {actions}
        </header>
      )}
      <div className={cn("min-w-0 flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
