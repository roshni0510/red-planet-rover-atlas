import { useRouterState } from "@tanstack/react-router";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/services/api";
import { NAV_ITEMS } from "./Sidebar";

function backendLabel() {
  if (!API_BASE_URL) return { text: "Backend not configured", tone: "bg-muted-foreground" };
  try {
    return { text: new URL(API_BASE_URL).host, tone: "bg-warning" };
  } catch {
    return { text: "Invalid backend URL", tone: "bg-destructive" };
  }
}

export default function Header({ onOpenAssistant }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV_ITEMS.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));
  const backend = backendLabel();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="font-mono text-sm font-semibold text-primary md:hidden">MW</span>
        <h1 className="truncate text-base font-semibold tracking-wide">{current?.label ?? "MarsWalk"}</h1>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="hidden items-center gap-2 rounded-sm border border-border bg-surface px-2.5 py-1 font-mono text-[0.6875rem] text-muted-foreground sm:flex"
          title="Backend address used for all data"
        >
          <span className={`size-1.5 rounded-full ${backend.tone}`} aria-hidden />
          {backend.text}
        </span>
        <Button size="sm" variant="outline" onClick={onOpenAssistant}>
          <MessageSquareText aria-hidden />
          <span className="hidden sm:inline">AI assistant</span>
        </Button>
      </div>
    </header>
  );
}
