import { humanizeKey } from "@/services/dataUtils";

/**
 * Generic, recursive viewer for backend JSON. Shows exactly what the backend
 * returned (no derived values) until per-field formats are agreed.
 */
export default function DataView({ data, depth = 0, hideKeys = [] }) {
  if (data === null || data === undefined) return <span className="text-muted-foreground">—</span>;

  if (typeof data !== "object") {
    if (typeof data === "string" && /^https?:\/\//i.test(data)) {
      return (
        <a href={data} target="_blank" rel="noreferrer" className="break-all text-primary underline-offset-2 hover:underline">
          {data}
        </a>
      );
    }
    return <span className="break-words font-mono text-[0.8125rem] text-foreground">{String(data)}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-muted-foreground">None</span>;
    if (data.every((v) => v === null || typeof v !== "object")) {
      return <span className="break-words font-mono text-[0.8125rem]">{data.map(String).join(", ")}</span>;
    }
    if (depth > 3) return <span className="font-mono text-xs text-muted-foreground">[{data.length} items]</span>;
    return (
      <ol className="space-y-2">
        {data.map((item, i) => (
          <li key={i} className="rounded border border-border bg-surface px-3 py-2">
            <DataView data={item} depth={depth + 1} hideKeys={hideKeys} />
          </li>
        ))}
      </ol>
    );
  }

  const entries = Object.entries(data).filter(([k]) => !hideKeys.includes(k));
  if (entries.length === 0) return <span className="text-muted-foreground">—</span>;
  if (depth > 3) return <span className="font-mono text-xs text-muted-foreground">{"{…}"}</span>;

  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-[minmax(7rem,auto)_1fr]">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="label-caps pt-0.5">{humanizeKey(key)}</dt>
          <dd className="min-w-0 text-sm">
            <DataView data={value} depth={depth + 1} hideKeys={hideKeys} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
