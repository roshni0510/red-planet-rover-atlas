import { AlertTriangle, CloudOff, FileQuestion, Inbox, Loader2, PlugZap, Settings2 } from "lucide-react";
import { isEmptyData } from "@/services/dataUtils";

const MESSAGES = {
  endpoint_pending: {
    icon: PlugZap,
    title: "Endpoint pending",
    text: "Not connected — this endpoint has not been agreed with the backend team yet.",
  },
  not_configured: {
    icon: Settings2,
    title: "Backend not configured",
    text: "Set VITE_API_BASE_URL to the MarsWalk backend address.",
  },
  request_format_pending: {
    icon: FileQuestion,
    title: "Request format pending",
    text: "The request fields have not been agreed with the backend team yet.",
  },
  backend_unavailable: { icon: CloudOff, title: "Backend unavailable", text: null },
  timeout: { icon: CloudOff, title: "Backend timed out", text: null },
  http_error: { icon: AlertTriangle, title: "Request failed", text: null },
  invalid_response: { icon: AlertTriangle, title: "Invalid response", text: null },
};

export function StateMessage({ kind, message, compact = false }) {
  const m = MESSAGES[kind] || { icon: AlertTriangle, title: "Error", text: null };
  const Icon = m.icon;
  const tone = ["http_error", "invalid_response", "backend_unavailable", "timeout"].includes(kind)
    ? "text-destructive"
    : "text-muted-foreground";
  return (
    <div className={compact ? "flex items-start gap-2 text-xs" : "flex items-start gap-3 rounded-md border border-dashed border-border bg-surface px-3 py-3 text-sm"}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden />
      <div className="min-w-0">
        <p className={`font-medium ${tone === "text-destructive" ? "text-destructive" : "text-foreground"}`}>{m.title}</p>
        <p className="text-xs text-muted-foreground">{message || m.text}</p>
      </div>
    </div>
  );
}

export function EmptyState({ text = "The backend returned no data for this panel." }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-dashed border-border bg-surface px-3 py-3 text-sm">
      <Inbox className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

export function LoadingState({ text = "Loading from backend…" }) {
  return (
    <div className="flex items-center gap-2 px-1 py-3 text-xs text-muted-foreground">
      <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
      {text}
    </div>
  );
}

/**
 * Renders the right state for a useApiQuery result, or children(data) when ready.
 */
export default function DataState({ query, emptyText, children }) {
  if (query.readiness !== "ready") return <StateMessage kind={query.readiness} />;
  if (query.isPending) return <LoadingState />;
  if (query.isError) return <StateMessage kind={query.error?.kind} message={query.error?.message} />;
  if (isEmptyData(query.data)) return <EmptyState text={emptyText} />;
  return children(query.data);
}
